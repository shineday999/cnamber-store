// /api/admin/faqs — POST:欄位式 FAQ 批次儲存
// 接收 product_id + faq_{loc}_q_{i} / faq_{loc}_a_{i} 欄位,
// 組回 { locale: [{q, a}] } JSON 存 products.faq。
import type { APIRoute } from "astro";
import { getDB } from "../../../lib/db";

const LOCALES = ["zh-Hans", "en", "ms-MY", "id-ID"] as const;

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });

  const form = await ctx.request.formData();
  const productId = String(form.get("product_id") ?? "").trim();
  if (!productId) return new Response("Missing product_id", { status: 400 });

  const db = getDB();
  const product = await db
    .prepare("SELECT id FROM products WHERE id = ?")
    .bind(productId)
    .first<{ id: string }>();
  if (!product) return new Response("Product not found", { status: 404 });

  // 收集欄位式輸入:faq_{loc}_q_{i} / faq_{loc}_a_{i}(index 可跳號,依序排序)
  const byLoc: Record<string, Map<number, { q: string; a: string }>> = {
    "zh-Hans": new Map(),
    en: new Map(),
    "ms-MY": new Map(),
    "id-ID": new Map(),
  };
  for (const [key, value] of form.entries()) {
    const m = /^faq_(.+?)_(q|a)_(\d+)$/.exec(key);
    if (!m) continue;
    const loc = m[1];
    const kind = m[2] as "q" | "a";
    if (!loc || !kind) continue;
    if (!(loc in byLoc)) continue;
    const idx = Number(m[3]);
    const map = byLoc[loc]!;
    const pair = map.get(idx) ?? { q: "", a: "" };
    pair[kind] = String(value ?? "");
    map.set(idx, pair);
  }

  const faq: Record<string, { q: string; a: string }[]> = {};
  for (const loc of LOCALES) {
    const map = byLoc[loc]!;
    faq[loc] = [...map.entries()]
      .sort((x, y) => x[0] - y[0])
      .map(([, pair]) => ({ q: pair.q.trim(), a: pair.a.trim() }))
      .filter((pair) => pair.q !== "" || pair.a !== "");
  }

  await db
    .prepare("UPDATE products SET faq = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(faq), Math.floor(Date.now() / 1000), productId)
    .run();

  return ctx.redirect(
    `/admin/faqs?product=${encodeURIComponent(productId)}&saved=1`,
    303,
  );
};
