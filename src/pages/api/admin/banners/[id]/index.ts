import type { APIRoute } from "astro";
import { getDB } from "../../../../../lib/db";

export const PATCH: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  const form = await ctx.request.formData();
  const altText = String(form.get("alt_text") ?? "").trim() || null;
  const sortOrder = Number(form.get("sort_order") ?? 0);
  const activeRaw = form.get("active");
  const active =
    activeRaw === null || activeRaw === "" || activeRaw === "1" ? 1 : 0;

  const db = getDB(ctx);
  await db
    .prepare(
      "UPDATE hero_banners SET alt_text = ?, sort_order = ?, active = ?, updated_at = ? WHERE id = ?",
    )
    .bind(altText, sortOrder, active, Math.floor(Date.now() / 1000), id)
    .run();

  return ctx.redirect("/admin/banners", 303);
};

export const DELETE: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  const db = getDB(ctx);
  const r2 = ctx.locals.runtime?.env.PRODUCT_IMAGES;

  // Fetch existing to clean up R2 object
  const existing = await db
    .prepare("SELECT image_url FROM hero_banners WHERE id = ?")
    .bind(id)
    .first<{ image_url: string }>();

  await db.prepare("DELETE FROM hero_banners WHERE id = ?").bind(id).run();

  if (existing && r2 && existing.image_url.startsWith("/api/images/")) {
    const key = existing.image_url.replace(/^\/api\/images\//, "");
    try {
      await r2.delete(key);
    } catch {
      // R2 deletion failure should not block DB delete
    }
  }

  return new Response(null, {
    status: 303,
    headers: { Location: "/admin/banners" },
  });
};
