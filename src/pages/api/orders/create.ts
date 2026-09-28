import type { APIRoute } from 'astro';
import { getDB, genId } from '../../../lib/db';
import { readCart } from '../../../lib/cart';
import { sendEmail, emailEnvFromContext, orderConfirmationEmail } from '../../../lib/email';

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

  const subtotal = 0; // Phase 5+ 從 cart + variants 算實際金額
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

  // 寄確認信(非阻塞失敗)
  const itemsSummary = items.map((i) => `${i.slug} × ${i.qty}`).join(', ');
  const template = orderConfirmationEmail(orderId, name, itemsSummary);
  void sendEmail(emailEnvFromContext(ctx), {
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: 'hello@cnamber.ccwu.cc',
  }).catch((e) => console.error('[orders/create] email failed', e));

  // 同時寄通知給管理員(若有 email setting)
  void sendEmail(emailEnvFromContext(ctx), {
    to: 'hello@cnamber.ccwu.cc',
    subject: `[New Order] ${orderId} from ${name}`,
    html: `<p>${name} (${email}) placed a new order.</p><pre>${JSON.stringify(items, null, 2)}</pre><p>Notes: ${notes ?? '(none)'}</p>`,
  }).catch(() => {});

  return ctx.redirect(`/checkout/success?id=${orderId}`, 303);
};