// Wave 37.1: per-post FAQ JSON-LD editor (4 locale batch save)
import type { APIRoute } from "astro";
import { getDB } from "../../../../../lib/db";

const LOCALES = ["zh-Hans", "en", "ms-MY", "id-ID"] as const;

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  const form = await ctx.request.formData();

  const faq: Record<string, { q: string; a: string }[]> = {};
  for (const loc of LOCALES) {
    const raw = String(form.get(`faq_${loc}`) ?? "[]").trim() || "[]";
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Response(`Invalid FAQ JSON for ${loc}: not an array`, {
          status: 400,
        });
      }
      const arr = parsed.filter(
        (it) =>
          it &&
          typeof it === "object" &&
          typeof it.q === "string" &&
          typeof it.a === "string",
      );
      faq[loc] = arr;
    } catch (e) {
      return new Response(
        `Invalid FAQ JSON for ${loc}: ${(e as Error).message}`,
        { status: 400 },
      );
    }
  }

  const db = getDB();
  await db
    .prepare("UPDATE posts SET faq = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(faq), Math.floor(Date.now() / 1000), id)
    .run();

  return ctx.redirect(`/admin/posts/${id}?tab=faq`, 303);
};
