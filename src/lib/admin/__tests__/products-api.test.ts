import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../../repo/__tests__/_d1";
import {
  createProductHandler,
  createVariantHandler,
  deleteProductHandler,
  deleteVariantHandler,
  setPricesHandler,
  sniffImageType,
  updateProductHandler,
  updateVariantHandler,
  uploadImageHandler,
} from "../products-api";

const db = (await createTestDb()) as unknown as D1Database | null;
const editor = { role: "editor" as const, email: "e@x.com" };
const viewer = { role: "viewer" as const };

const req = (body: unknown, method = "POST") =>
  new Request("http://localhost/api", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const validProduct = (over: Record<string, unknown> = {}) => ({
  category: "jewelry",
  subcategory: "necklace",
  slug: "api-pendant",
  translations: [{ locale: "zh-Hans", name: "名", description: "述" }],
  variants: [{ sku: "A-1", stock: 2, prices: { USD: 1000 } }],
  ...over,
});

async function create(over: Record<string, unknown> = {}): Promise<string> {
  const res = await createProductHandler(db!, editor, req(validProduct(over)));
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

async function errorOf(
  res: Response,
): Promise<{ code: string; issues?: { path: string }[] }> {
  return (
    (await res.json()) as {
      error: { code: string; issues?: { path: string }[] };
    }
  ).error;
}

async function count(table: string): Promise<number> {
  return (
    (
      await db!
        .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
        .first<{ n: number }>()
    )?.n ?? 0
  );
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];

function uploadReq(file: File | null, productId?: string): Request {
  const fd = new FormData();
  if (file) fd.set("image", file);
  if (productId) fd.set("product_id", productId);
  return new Request("http://localhost/api/admin/uploads/image", {
    method: "POST",
    body: fd,
  });
}

function fakeBucket() {
  const puts: { key: string; type?: string | undefined; bytes: number }[] = [];
  return {
    puts,
    put: async (
      key: string,
      value: unknown,
      opts?: { httpMetadata?: { contentType?: string } },
    ) => {
      puts.push({
        key,
        type: opts?.httpMetadata?.contentType,
        bytes: (value as ArrayBuffer).byteLength,
      });
      return null;
    },
  } as unknown as Pick<R2Bucket, "put"> & { puts: typeof puts };
}

describe("sniffImageType", () => {
  it("辨識四種格式", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(sniffImageType(new Uint8Array(PNG))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("GIF89a......"))).toBe(
      "image/gif",
    );
    expect(sniffImageType(new TextEncoder().encode("RIFF....WEBPVP8 "))).toBe(
      "image/webp",
    );
  });
  it("不是圖片回 null", () => {
    expect(
      sniffImageType(new TextEncoder().encode("<html></html>")),
    ).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});

describe("upload image handler", () => {
  it("沒有權限：未登入 401、viewer 403", async () => {
    const b = fakeBucket();
    const file = new File([new Uint8Array(PNG)], "a.png", {
      type: "image/png",
    });
    expect(
      (await uploadImageHandler(b, undefined, uploadReq(file))).status,
    ).toBe(401);
    expect((await uploadImageHandler(b, viewer, uploadReq(file))).status).toBe(
      403,
    );
    expect(b.puts.length).toBe(0);
  });

  it("成功：回傳 url 與 key，並以偵測到的格式存入 R2", async () => {
    const b = fakeBucket();
    const file = new File([new Uint8Array(PNG)], "a.png", {
      type: "image/png",
    });
    const res = await uploadImageHandler(
      b,
      editor,
      uploadReq(file, "prod_abc"),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { url: string; key: string };
    expect(body.key.startsWith("products/prod_abc/")).toBe(true);
    expect(body.key.endsWith(".png")).toBe(true);
    expect(body.url).toBe(`/api/images/${body.key}`);
    expect(b.puts[0]?.type).toBe("image/png");
  });

  it("product_id 格式不合法時改放 uploads 資料夾（避免路徑穿越）", async () => {
    const b = fakeBucket();
    const file = new File([new Uint8Array(PNG)], "a.png", {
      type: "image/png",
    });
    const res = await uploadImageHandler(b, editor, uploadReq(file, "../etc"));
    expect(
      ((await res.json()) as { key: string }).key.startsWith(
        "products/uploads/",
      ),
    ).toBe(true);
  });

  it("沒有檔案 400、超過 5MB 413、宣稱是圖片但內容不是 415", async () => {
    const b = fakeBucket();
    expect((await uploadImageHandler(b, editor, uploadReq(null))).status).toBe(
      400,
    );
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "b.png", {
      type: "image/png",
    });
    expect((await uploadImageHandler(b, editor, uploadReq(big))).status).toBe(
      413,
    );
    const fake = new File(["<html>hi</html>"], "c.png", { type: "image/png" });
    const res = await uploadImageHandler(b, editor, uploadReq(fake));
    expect(res.status).toBe(415);
    expect((await errorOf(res)).code).toBe("invalid_image_type");
    expect(b.puts.length).toBe(0);
  });

  it("R2 沒綁定 → 500", async () => {
    const file = new File([new Uint8Array(PNG)], "a.png", {
      type: "image/png",
    });
    expect(
      (await uploadImageHandler(undefined, editor, uploadReq(file))).status,
    ).toBe(500);
  });
});

describe.skipIf(!db)("products API handlers", () => {
  beforeEach(async () => {
    for (const t of [
      "reviews",
      "product_prices",
      "product_variants",
      "product_translations",
      "products",
    ]) {
      await db!.prepare(`DELETE FROM ${t}`).run();
    }
  });

  it("權限：未登入 401、viewer 403，且不會寫入", async () => {
    expect(
      (await createProductHandler(db!, undefined, req(validProduct()))).status,
    ).toBe(401);
    expect(
      (await createProductHandler(db!, viewer, req(validProduct()))).status,
    ).toBe(403);
    expect(await count("products")).toBe(0);
  });

  it("建立：成功 201；JSON 壞掉 400；欄位錯誤 400 並指出欄位", async () => {
    await create();
    expect(await count("products")).toBe(1);

    const bad = await createProductHandler(
      db!,
      editor,
      new Request("http://x/", { method: "POST", body: "{oops" }),
    );
    expect(bad.status).toBe(400);
    expect((await errorOf(bad)).code).toBe("invalid_json");

    const inv = await createProductHandler(
      db!,
      editor,
      req(validProduct({ slug: "Bad Slug", variants: [] })),
    );
    expect(inv.status).toBe(400);
    const e = await errorOf(inv);
    expect(e.code).toBe("validation_failed");
    expect(e.issues?.map((i) => i.path).sort()).toEqual(["slug", "variants"]);
  });

  it("建立：slug 重複 409、分類錯誤 400、SKU 重複 409", async () => {
    await create();
    const dup = await createProductHandler(
      db!,
      editor,
      req(validProduct({ variants: [{ sku: "Z" }] })),
    );
    expect(dup.status).toBe(409);
    expect((await errorOf(dup)).code).toBe("slug_taken");

    const cat = await createProductHandler(
      db!,
      editor,
      req(validProduct({ slug: "c2", category: "shoes" })),
    );
    expect(cat.status).toBe(400);
    expect((await errorOf(cat)).code).toBe("invalid_category");

    const sku = await createProductHandler(
      db!,
      editor,
      req(validProduct({ slug: "c3" })),
    );
    expect(sku.status).toBe(409);
    expect((await errorOf(sku)).code).toBe("sku_taken");
  });

  it("更新：只改帶的欄位；空 body 400；找不到 404；slug 撞到別人 409", async () => {
    const id = await create();
    await create({ slug: "other", variants: [{ sku: "B-1" }] });

    const ok = await updateProductHandler(
      db!,
      editor,
      id,
      req({ status: "active", tags: ["calm"] }, "PATCH"),
    );
    expect(ok.status).toBe(200);
    const row = await db!
      .prepare("SELECT status, tags, category FROM products WHERE id = ?")
      .bind(id)
      .first<{ status: string; tags: string; category: string }>();
    expect({ ...row }).toEqual({
      status: "active",
      tags: "calm",
      category: "jewelry",
    });

    expect(
      (await updateProductHandler(db!, editor, id, req({}, "PATCH"))).status,
    ).toBe(400);
    expect(
      (
        await updateProductHandler(
          db!,
          editor,
          "nope",
          req({ status: "active" }, "PATCH"),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await updateProductHandler(
          db!,
          editor,
          id,
          req({ slug: "other" }, "PATCH"),
        )
      ).status,
    ).toBe(409);
    // variants 不屬於 PATCH，會被忽略；忽略後沒有任何欄位可更新 → 400
    expect(
      (
        await updateProductHandler(
          db!,
          editor,
          id,
          req({ variants: [] }, "PATCH"),
        )
      ).status,
    ).toBe(400);
  });

  it("刪除：沒帶或帶錯 confirm 400；正確才刪；找不到 404", async () => {
    const id = await create();
    const u = (q: string) => new URL(`http://x/api/admin/products/${id}${q}`);
    expect((await deleteProductHandler(db!, editor, id, u(""))).status).toBe(
      400,
    );
    expect(
      (await deleteProductHandler(db!, editor, id, u("?confirm=wrong"))).status,
    ).toBe(400);
    expect(await count("products")).toBe(1);
    expect(
      (await deleteProductHandler(db!, viewer, id, u("?confirm=api-pendant")))
        .status,
    ).toBe(403);
    expect(
      (await deleteProductHandler(db!, editor, id, u("?confirm=api-pendant")))
        .status,
    ).toBe(200);
    expect(await count("products")).toBe(0);
    expect(await count("product_variants")).toBe(0);
    expect(
      (await deleteProductHandler(db!, editor, id, u("?confirm=api-pendant")))
        .status,
    ).toBe(404);
  });

  it("變體：新增 201、更新（id 以網址為準）、價格整組取代、不能刪最後一個", async () => {
    const id = await create();
    const add = await createVariantHandler(
      db!,
      editor,
      id,
      req({ sku: "A-2", stock: 4, prices: { USD: 2000, CNY: 14000 } }),
    );
    expect(add.status).toBe(201);
    const vid = ((await add.json()) as { id: string }).id;

    const upd = await updateVariantHandler(
      db!,
      editor,
      id,
      vid,
      req({ id: "ignored", sku: "A-2", stock: 9, prices: { MYR: 900 } }, "PUT"),
    );
    expect(upd.status).toBe(200);
    const stock = await db!
      .prepare("SELECT stock FROM product_variants WHERE id = ?")
      .bind(vid)
      .first<{ stock: number }>();
    expect(stock?.stock).toBe(9);

    const pr = await setPricesHandler(
      db!,
      editor,
      id,
      vid,
      req({ prices: { USD: 111, IDR: 222 } }, "PUT"),
    );
    expect(pr.status).toBe(200);
    const rows = await db!
      .prepare(
        "SELECT currency FROM product_prices WHERE variant_id = ? ORDER BY currency",
      )
      .bind(vid)
      .all<{ currency: string }>();
    expect(rows.results.map((r) => r.currency)).toEqual(["IDR", "USD"]);

    const badPrice = await setPricesHandler(
      db!,
      editor,
      id,
      vid,
      req({ prices: { XXX: 1 } }, "PUT"),
    );
    expect(badPrice.status).toBe(400);
    expect(
      (
        await setPricesHandler(
          db!,
          editor,
          id,
          "nope",
          req({ prices: {} }, "PUT"),
        )
      ).status,
    ).toBe(404);

    expect((await deleteVariantHandler(db!, editor, id, vid)).status).toBe(200);
    const last = (await db!
      .prepare("SELECT id FROM product_variants WHERE product_id = ?")
      .bind(id)
      .first<{ id: string }>())!.id;
    const res = await deleteVariantHandler(db!, editor, id, last);
    expect(res.status).toBe(409);
    expect((await errorOf(res)).code).toBe("last_variant");
  });

  it("變體：更新別的商品的變體 404、SKU 撞到 409", async () => {
    const a = await create();
    const b = await create({ slug: "b", variants: [{ sku: "B-1" }] });
    const bVar = (await db!
      .prepare("SELECT id FROM product_variants WHERE product_id = ?")
      .bind(b)
      .first<{ id: string }>())!.id;
    expect(
      (
        await updateVariantHandler(
          db!,
          editor,
          a,
          bVar,
          req({ sku: "HACK" }, "PUT"),
        )
      ).status,
    ).toBe(404);
    expect(
      (await createVariantHandler(db!, editor, a, req({ sku: "B-1" }))).status,
    ).toBe(409);
  });
});
