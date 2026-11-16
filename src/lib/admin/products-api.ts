// 後台商品 JSON API 的處理函式（路由檔只負責取得 db / r2 / admin 再呼叫這裡，方便測試）
import {
  ProductCreateSchema,
  ProductPatchSchema,
  SetPricesBodySchema,
  VariantInputSchema,
} from "../schemas/product";
import {
  createProduct,
  deleteProduct,
  deleteVariant,
  setVariantPrices,
  updateProduct,
  upsertVariant,
} from "../repo/products";
import {
  apiError,
  failure,
  json,
  parseJsonBody,
  requireWriter,
  type AdminLike,
} from "./http";

// ───────────── 商品 ─────────────

export async function createProductHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  request: Request,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  const body = await parseJsonBody(request, ProductCreateSchema);
  if (!body.ok) return body.response;
  try {
    return json({ id: await createProduct(db, body.data) }, 201);
  } catch (e) {
    return failure(e);
  }
}

export async function updateProductHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  id: string | undefined,
  request: Request,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!id) return apiError(400, "missing_id", "缺少商品 id");
  const body = await parseJsonBody(request, ProductPatchSchema);
  if (!body.ok) return body.response;
  if (Object.keys(body.data).length === 0) {
    return apiError(400, "empty_patch", "没有要更新的栏位");
  }
  try {
    await updateProduct(db, id, body.data);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

/** 必須帶 ?confirm=<商品 slug>，避免誤刪。連帶刪除翻譯、變體、價格、評論（外鍵 CASCADE）。 */
export async function deleteProductHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  id: string | undefined,
  url: URL,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!id) return apiError(400, "missing_id", "缺少商品 id");
  try {
    const row = await db
      .prepare("SELECT slug FROM products WHERE id = ?")
      .bind(id)
      .first<{ slug: string }>();
    if (!row) return apiError(404, "not_found", "找不到资源");
    if (url.searchParams.get("confirm") !== row.slug) {
      return apiError(
        400,
        "confirm_required",
        "请以 confirm 参数带入商品 slug 确认删除",
      );
    }
    await deleteProduct(db, id);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

// ───────────── 變體與價格 ─────────────

export async function createVariantHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  productId: string | undefined,
  request: Request,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!productId) return apiError(400, "missing_id", "缺少商品 id");
  const body = await parseJsonBody(request, VariantInputSchema);
  if (!body.ok) return body.response;
  try {
    const id = await upsertVariant(db, productId, {
      ...body.data,
      id: undefined,
    });
    return json({ id }, 201);
  } catch (e) {
    return failure(e);
  }
}

export async function updateVariantHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  productId: string | undefined,
  variantId: string | undefined,
  request: Request,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!productId || !variantId)
    return apiError(400, "missing_id", "缺少商品或变体 id");
  const body = await parseJsonBody(request, VariantInputSchema);
  if (!body.ok) return body.response;
  try {
    await upsertVariant(db, productId, { ...body.data, id: variantId });
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

export async function deleteVariantHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  productId: string | undefined,
  variantId: string | undefined,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!productId || !variantId)
    return apiError(400, "missing_id", "缺少商品或变体 id");
  try {
    await deleteVariant(db, productId, variantId);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

export async function setPricesHandler(
  db: D1Database,
  admin: AdminLike | undefined,
  productId: string | undefined,
  variantId: string | undefined,
  request: Request,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!productId || !variantId)
    return apiError(400, "missing_id", "缺少商品或变体 id");
  const body = await parseJsonBody(request, SetPricesBodySchema);
  if (!body.ok) return body.response;
  try {
    await setVariantPrices(db, productId, variantId, body.data.prices);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

// ───────────── 圖片上傳（R2） ─────────────

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** 依檔案開頭的位元組判斷真正的圖片格式；不是支援的格式回傳 null。 */
export function sniffImageType(b: Uint8Array): string | null {
  const at = (i: number) => b[i];
  const ascii = (start: number, s: string) =>
    [...s].every((ch, i) => at(start + i) === ch.charCodeAt(0));
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (
    at(0) === 0x89 &&
    at(1) === 0x50 &&
    at(2) === 0x4e &&
    at(3) === 0x47 &&
    at(4) === 0x0d &&
    at(5) === 0x0a &&
    at(6) === 0x1a &&
    at(7) === 0x0a
  ) {
    return "image/png";
  }
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  return null;
}

/** 表單欄位：image（檔案）、product_id（選填，決定存放資料夾）。回傳 { url, key }。 */
export async function uploadImageHandler(
  bucket: Pick<R2Bucket, "put"> | undefined,
  admin: AdminLike | undefined,
  request: Request,
): Promise<Response> {
  const denied = requireWriter(admin);
  if (denied) return denied;
  if (!bucket) return apiError(500, "r2_not_bound", "图片储存未设定");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "invalid_form", "请求内容不是有效的表单");
  }
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return apiError(400, "no_file", "没有收到图片档案");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return apiError(413, "too_large", "图片超过 5MB 上限");
  }

  const buf = await file.arrayBuffer();
  const type = sniffImageType(new Uint8Array(buf.slice(0, 16)));
  if (!type)
    return apiError(415, "invalid_image_type", "仅支援 JPG、PNG、WebP、GIF");

  const rawProductId = form.get("product_id");
  const productId =
    typeof rawProductId === "string" &&
    /^[A-Za-z0-9_-]{1,64}$/.test(rawProductId)
      ? rawProductId
      : "uploads";
  const key = `products/${productId}/${crypto.randomUUID()}.${IMAGE_EXT[type]}`;

  try {
    await bucket.put(key, buf, { httpMetadata: { contentType: type } });
  } catch (e) {
    return failure(e);
  }
  return json({ url: `/api/images/${key}`, key }, 201);
}
