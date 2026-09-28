import type { APIRoute } from 'astro';
import { getDB } from '../../../../../lib/db';

const ALLOWED_STATUS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
const ALLOWED_PAYMENT = ['unpaid', 'paid', 'refunded'] as const;

export const POST: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) {
    return new Response('Unauthorized', { status: 401 });
  }
  const id = ctx.params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await ctx.request.formData();
  const status = String(form.get('status') ?? '');
  const paymentStatus = String(form.get('payment_status') ?? '');
  const trackingNumber = String(form.get('tracking_number') ?? '') || null;

  if (!ALLOWED_STATUS.includes(status as never) || !ALLOWED_PAYMENT.includes(paymentStatus as never)) {
    return new Response('Invalid status', { status: 400 });
  }

  const db = getDB(ctx);
  await db
    .prepare(
      'UPDATE orders SET status = ?, payment_status = ?, tracking_number = ?, updated_at = ? WHERE id = ?',
    )
    .bind(status, paymentStatus, trackingNumber, Math.floor(Date.now() / 1000), id)
    .run();

  return ctx.redirect(`/admin/orders`, 303);
};