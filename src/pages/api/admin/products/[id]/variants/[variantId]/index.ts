import type { APIRoute } from "astro";
import { getDB } from "../../../../../../../lib/db";
import {
  deleteVariantHandler,
  updateVariantHandler,
} from "../../../../../../../lib/admin/products-api";

// PUT /api/admin/products/:id/variants/:variantId — 更新變體（價格整組取代）
export const PUT: APIRoute = async ({ locals, params, request }) =>
  updateVariantHandler(
    getDB(),
    locals.admin,
    params.id,
    params.variantId,
    request,
  );

// DELETE /api/admin/products/:id/variants/:variantId — 最後一個變體不能刪
export const DELETE: APIRoute = async ({ locals, params }) =>
  deleteVariantHandler(getDB(), locals.admin, params.id, params.variantId);
