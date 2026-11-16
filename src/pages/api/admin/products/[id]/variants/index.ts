import type { APIRoute } from "astro";
import { getDB } from "../../../../../../lib/db";
import { createVariantHandler } from "../../../../../../lib/admin/products-api";

// POST /api/admin/products/:id/variants — 新增變體（含價格）
export const POST: APIRoute = async ({ locals, params, request }) =>
  createVariantHandler(getDB(), locals.admin, params.id, request);
