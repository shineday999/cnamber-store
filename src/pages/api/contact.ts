import type { APIRoute } from 'astro';
import { getDB, genId } from '../../lib/db';

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const name = String(form.get('name') ?? '');
  const email = String(form.get('email') ?? '');
  const phone = String(form.get('phone') ?? '') || null;
  const subject = String(form.get('subject') ?? '') || null;
  const message = String(form.get('message') ?? '');

  if (!name || !email || !message) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Honeypot / basic validation
  if (message.length > 5000) {
    return new Response('Message too long', { status: 400 });
  }
  if (!email.includes('@') || email.length > 254) {
    return new Response('Invalid email', { status: 400 });
  }

  const db = getDB(ctx);
  const id = genId('inq');
  await db
    .prepare(
      'INSERT INTO inquiries (id, name, email, phone, subject, message, locale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, name, email, phone, subject, message, ctx.locals.locale, Math.floor(Date.now() / 1000))
    .run();

  // Phase 5 接 Resend 寄信到 hello@cnamber.ccwu.cc
  // Phase 4 簡化:只存 DB,後台手動查看
  return ctx.redirect('/contact?ok=1', 303);
};