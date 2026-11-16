import type { APIRoute } from "astro";
import { getDB } from "../../../../../../../lib/db";
import { setPricesHandler } from "../../../../../../../lib/admin/products-api";

// PUT /api/admin/products/:id/variants/:variantId/prices — 只更新價格（整組取代）
export const PUT: APIRoute = async ({ locals, params, request }) =>
  setPricesHandler(getDB(), locals.admin, params.id, params.variantId, request);
