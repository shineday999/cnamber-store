import type { APIRoute } from "astro";
import { getDB, genId } from "../../../../lib/db";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX = 10 * 1024 * 1024; // 10MB for high-res 1920x1080 banners

export const GET: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });
  const db = getDB(ctx);
  const result = await db
    .prepare(
      "SELECT id, image_url, alt_text, sort_order, active, created_at, updated_at FROM hero_banners ORDER BY sort_order ASC, created_at DESC",
    )
    .all<{
      id: string;
      image_url: string;
      alt_text: string | null;
      sort_order: number;
      active: number;
      created_at: number;
      updated_at: number;
    }>();

  return new Response(JSON.stringify({ results: result.results ?? [] }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });
  const r2 = ctx.locals.runtime?.env.PRODUCT_IMAGES;
  if (!r2) return new Response("R2 not bound", { status: 500 });

  const form = await ctx.request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return new Response("No file", { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return new Response("Invalid image type", { status: 400 });
  }
  if (file.size > MAX) {
    return new Response("Image too large (max 10MB)", { status: 413 });
  }

  const altText = String(form.get("alt_text") ?? "").trim() || null;
  const sortOrder = Number(form.get("sort_order") ?? 0);
  const activeRaw = form.get("active");
  const active =
    activeRaw === null || activeRaw === "" || activeRaw === "1" ? 1 : 0;

  const id = genId("bnr");
  const ext = EXT[file.type] ?? "jpg";
  const key = `banners/${id}/cover-${Date.now()}.${ext}`;
  await r2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  const url = `/api/images/${key}`;
  const now = Math.floor(Date.now() / 1000);

  const db = getDB(ctx);
  await db
    .prepare(
      "INSERT INTO hero_banners (id, image_url, alt_text, sort_order, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, url, altText, sortOrder, active, now, now)
    .run();

  return ctx.redirect("/admin/banners", 303);
};
