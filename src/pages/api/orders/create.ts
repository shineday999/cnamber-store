import type { APIRoute } from 'astro';
import { getDB, genId } from '../../../lib/db';
import { readCart } from '../../../lib/cart';

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const name = String(form.get('customer_name') ?? '');
  const email = String(form.get('customer_email') ?? '');
  const phone = String(form.get('customer_phone') ?? '') || null;
  const country = String(form.get('country') ?? '');
  const city = String(form.get('city') ?? '');
  const address = String(form.get('address') ?? '');
  const postal = String(form.get('postal') ?? '');
  const notes = String(form.get('notes') ?? '') || null;

  if (!name || !email || !country || !city || !address) {
    return new Response('Missing required fields', { status: 400 });
  }

  const items = readCart(ctx.request.headers.get('cookie'));
  if (items.length === 0) {
    return new Response('Cart is empty', { status: 400 });
  }

  const db = getDB(ctx);
  const orderId = genId('ord');
  const now = Math.floor(Date.now() / 1000);
  const locale = ctx.locals.locale;

  // 計算 subtotal 以 USD 為準(Phase 5 改用真實 currency)
  const subtotal = 0; // Phase 5 從 cart + variants 算

  const shippingAddress = JSON.stringify({ country, city, address, postal });
  const itemsJson = JSON.stringify(items);

  await db
    .prepare(
      `INSERT INTO orders (id, customer_email, customer_name, customer_phone, shipping_address, locale, items, subtotal, currency, total, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(orderId, email, name, phone, shippingAddress, locale, itemsJson, subtotal, 'USD', subtotal, notes, now, now)
    .run();

  // 清空 cart cookie
  ctx.cookies.set('cnamber_cart', '', { path: '/', maxAge: 0 });

  return ctx.redirect(`/checkout/success?id=${orderId}`, 303);
};