import type { APIRoute } from 'astro';
import { getDB } from '../../../../../lib/db';

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) {
    return new Response('Unauthorized', { status: 401 });
  }
  const id = ctx.params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const db = getDB(ctx);
  const existing = await db.prepare('SELECT status FROM products WHERE id = ?').bind(id).first<{ status: string }>();
  if (!existing) return new Response('Not found', { status: 404 });

  const next = existing.status === 'active' ? 'archived' : 'active';
  await db
    .prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?')
    .bind(next, Math.floor(Date.now() / 1000), id)
    .run();

  return ctx.redirect(`/admin/products/${id}`, 303);
};