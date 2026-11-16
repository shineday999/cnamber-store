import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadImageHandler } from "../../../../lib/admin/products-api";

// POST /api/admin/uploads/image — multipart：image（檔案）、product_id（選填）
// 回傳 { url: "/api/images/<key>", key }，由 /api/images/[...key] 提供讀取
export const POST: APIRoute = async ({ locals, request }) =>
  uploadImageHandler(env.PRODUCT_IMAGES, locals.admin, request);
