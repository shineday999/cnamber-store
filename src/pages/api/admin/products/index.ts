import type { APIRoute } from "astro";
import { getDB } from "../../../../lib/db";
import { createProductHandler } from "../../../../lib/admin/products-api";

// POST /api/admin/products — 建立完整商品（JSON，見 docs/ADMIN-PRODUCTS-API.md）
export const POST: APIRoute = async ({ locals, request }) =>
  createProductHandler(getDB(), locals.admin, request);
