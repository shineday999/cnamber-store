import type { APIRoute } from 'astro';
import { readCart, writeCart, addToCart } from '../../../lib/cart';

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const slug = String(form.get('slug') ?? '');
  if (!slug) return new Response('Missing slug', { status: 400 });

  const cookieHeader = ctx.request.headers.get('cookie');
  const items = readCart(cookieHeader);
  const next = addToCart(items, { slug, qty: 1, addedAt: Date.now() });

  ctx.cookies.set('cnamber_cart', writeCart(next), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: true,
  });

  return ctx.redirect('/cart', 303);
};