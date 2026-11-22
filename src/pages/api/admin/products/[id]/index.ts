import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDB } from "../../../../../lib/db";
import { pushProductToSheet } from "../../../../../lib/sheet-bridge";
import {
  CATEGORIES,
  buildTags,
  checkReadiness,
  splitTags,
} from "../../../../../lib/admin-products";
import {
  ensureCategoryTable,
  listCategories,
} from "../../../../../lib/categories";
import { kindOf } from "../../../../../lib/category-kind";

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  const form = await ctx.request.formData();
  const db = getDB();

  // 刪除放在最前面：刪除表單只送 _action，不該被後面的欄位驗證擋掉
  // （FK CASCADE：規格、翻譯、價格、評論一併刪除）
  if (String(form.get("_action") ?? "") === "delete") {
    await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return ctx.redirect("/admin/products", 303);
  }

  const fail = (msg: string) =>
    ctx.redirect(`/admin/products/${id}?error=${encodeURIComponent(msg)}`, 303);

  const category = String(form.get("category") ?? "");
  const subcategory = String(form.get("subcategory") ?? "").trim() || null;
  const slug = String(form.get("slug") ?? "");
  const status = String(form.get("status") ?? "");

  // 分类 = 「分类图片」页的分类（含后台新增的，如茶叶）；读不到时只认内建两个
  let cats: { code: string; zh: string | undefined }[] = [];
  try {
    await ensureCategoryTable(db);
    cats = (await listCategories(db)).map((c) => ({
      code: c.code,
      zh: c.titles["zh-Hans"],
    }));
  } catch {
    cats = [];
  }
  if (cats.length === 0)
    cats = CATEGORIES.map((c) => ({ code: c, zh: undefined }));
  const chosen = cats.find((c) => c.code === category);
  const stored = await db
    .prepare("SELECT category FROM products WHERE id = ?")
    .bind(id)
    .first<{ category: string }>();
  // 商品原本的分类即使已不在清单里，也允许原样保存
  if (!chosen && stored?.category !== category) return fail("分类不正确");
  const kind = kindOf(category, chosen?.zh);
  if (!["draft", "active", "archived"].includes(status))
    return fail("状态不正确");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return fail("编号格式不正确");

  const existing = await db
    .prepare("SELECT status, slug FROM products WHERE id = ?")
    .bind(id)
    .first<{ status: string; slug: string }>();
  if (!existing) return new Response("Not found", { status: 404 });

  const dup = await db
    .prepare("SELECT id FROM products WHERE slug = ? AND id <> ?")
    .bind(slug, id)
    .first();
  if (dup) return fail("这个编号已被其他商品使用");

  // 改成「上架」前先檢查資料齊不齊（與前台實際讀取的資料一致）
  if (status === "active" && existing.status !== "active") {
    const missing = await checkReadiness(db, id);
    if (missing.length > 0) {
      return fail(`还不能上架，缺少：${missing.join("、")}`);
    }
  }

  // 標籤：新表單送 tag（勾選）+ tags_extra（舊資料保留）；舊表單才會送 tags
  const tags = form.has("tags_extra")
    ? buildTags(
        kind,
        form.getAll("tag").map(String),
        splitTags(String(form.get("tags_extra") ?? "")),
      )
    : String(form.get("tags") ?? "").trim();

  await db
    .prepare(
      "UPDATE products SET category = ?, subcategory = ?, slug = ?, status = ?, tags = ?, updated_at = ? WHERE id = ?",
    )
    .bind(
      category,
      subcategory,
      slug,
      status,
      tags,
      Math.floor(Date.now() / 1000),
      id,
    )
    .run();

  await pushProductToSheet(db, env, id, existing.slug);
  return ctx.redirect(`/admin/products/${id}?tab=core&saved=1`, 303);
};
