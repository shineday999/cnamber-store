import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const keySegments = params.key;
  if (!keySegments) return new Response("Not found", { status: 404 });
  const key = Array.isArray(keySegments) ? keySegments.join("/") : keySegments;

  const r2 = locals.runtime?.env.PRODUCT_IMAGES;
  if (!r2) return new Response("R2 not bound", { status: 500 });

  const obj = await r2.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
