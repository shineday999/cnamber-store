import type { APIRoute } from "astro";
import { getDB } from "../../../../../lib/db";
import {
  deleteProductHandler,
  updateProductHandler,
} from "../../../../../lib/admin/products-api";

// PATCH /api/admin/products/:id — 部分更新（translations 有帶就整組取代）
export const PATCH: APIRoute = async ({ locals, params, request }) =>
  updateProductHandler(getDB(), locals.admin, params.id, request);

// DELETE /api/admin/products/:id?confirm=<slug>
export const DELETE: APIRoute = async ({ locals, params, url }) =>
  deleteProductHandler(getDB(), locals.admin, params.id, url);
