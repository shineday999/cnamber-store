import type { APIRoute } from 'astro';
import { getDB, genId } from '../../../../lib/db';

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) {
    return new Response('Unauthorized', { status: 401 });
  }
  const form = await ctx.request.formData();
  const category = String(form.get('category') ?? '');
  const subcategory = String(form.get('subcategory') ?? '') || null;
  const slug = String(form.get('slug') ?? '');

  if (!category || !slug || !['jewelry', 'incense'].includes(category)) {
    return new Response('Invalid input', { status: 400 });
  }

  const db = getDB(ctx);
  const id = genId('prod');
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      'INSERT INTO products (id, category, subcategory, slug, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, category, subcategory, slug, 'draft', now, now)
    .run();

  // Initial zh-Hans translation if provided
  const name = String(form.get('translations[zh-Hans][name]') ?? '');
  const description = String(form.get('translations[zh-Hans][description]') ?? '');
  if (name && description) {
    await db
      .prepare(
        'INSERT INTO product_translations (product_id, locale, name, description) VALUES (?, ?, ?, ?)',
      )
      .bind(id, 'zh-Hans', name, description)
      .run();
  }

  return ctx.redirect(`/admin/products/${id}`, 303);
};