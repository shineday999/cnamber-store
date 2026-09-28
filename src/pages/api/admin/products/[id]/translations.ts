import type { APIRoute } from 'astro';
import { getDB } from '../../../../../lib/db';

const LOCALES = ['zh-Hans', 'en', 'ms-MY', 'id-ID'] as const;

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response('Unauthorized', { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await ctx.request.formData();
  const locale = String(form.get('locale') ?? '');
  const name = String(form.get('name') ?? '');
  const description = String(form.get('description') ?? '');
  const shortDescription = String(form.get('short_description') ?? '') || null;
  const story = String(form.get('story') ?? '') || null;

  if (!LOCALES.includes(locale as never)) {
    return new Response('Invalid locale', { status: 400 });
  }
  if (!name || !description) {
    return new Response('Missing required fields', { status: 400 });
  }
  if (description.length > 10000) {
    return new Response('Description too long', { status: 400 });
  }

  const db = getDB(ctx);
  await db
    .prepare(
      `INSERT INTO product_translations (product_id, locale, name, description, short_description, story)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (product_id, locale) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         short_description = excluded.short_description,
         story = excluded.story`,
    )
    .bind(id, locale, name, description, shortDescription, story)
    .run();

  return ctx.redirect(`/admin/products/${id}?tab=translations`, 303);
};