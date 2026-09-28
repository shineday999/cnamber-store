// D1 query helpers — 共用型別 + CRUD wrappers
import type { APIContext } from 'astro';

export function getDB(ctx: APIContext): D1Database {
  const env = ctx.locals.runtime?.env as { DB?: D1Database } | undefined;
  if (!env?.DB) throw new Error('D1 binding DB not available');
  return env.DB;
}

export interface Product {
  id: string;
  category: string;
  subcategory: string | null;
  slug: string;
  status: 'draft' | 'active' | 'archived';
  created_at: number;
  updated_at: number;
}

export interface ProductTranslation {
  product_id: string;
  locale: string;
  name: string;
  description: string;
  short_description: string | null;
  story: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  attributes: string; // JSON
  stock: number;
  weight_grams: number | null;
  price_base: string;
  image_urls: string; // JSON
}

export interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: string; // JSON
  locale: string;
  items: string; // JSON
  subtotal: number;
  currency: string;
  shipping_fee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  notes: string | null;
  tracking_number: string | null;
  created_at: number;
  updated_at: number;
}

export interface Review {
  id: string;
  product_id: string;
  order_id: string | null;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  content: string;
  image_urls: string | null;
  status: 'pending' | 'approved' | 'rejected';
  locale: string | null;
  created_at: number;
}

export function genId(prefix: string): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}_${rand}`;
}