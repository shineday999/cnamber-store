import type { APIRoute } from 'astro';
import { getDB } from '../../../../../lib/db';

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response('Unauthorized', { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await ctx.request.formData();
  const category = String(form.get('category') ?? '');
  const subcategory = String(form.get('subcategory') ?? '') || null;
  const slug = String(form.get('slug') ?? '');
  const status = String(form.get('status') ?? '');

  if (!['jewelry', 'incense'].includes(category)) {
    return new Response('Invalid category', { status: 400 });
  }
  if (!['draft', 'active', 'archived'].includes(status)) {
    return new Response('Invalid status', { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response('Invalid slug', { status: 400 });
  }

  const db = getDB(ctx);
  await db
    .prepare(
      'UPDATE products SET category = ?, subcategory = ?, slug = ?, status = ?, updated_at = ? WHERE id = ?',
    )
    .bind(category, subcategory, slug, status, Math.floor(Date.now() / 1000), id)
    .run();

  return ctx.redirect(`/admin/products/${id}?tab=core`, 303);
};