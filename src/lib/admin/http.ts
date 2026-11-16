// 後台 JSON API 共用工具：回應格式、權限、請求驗證、錯誤對應
// 錯誤格式固定為 { error: { code, message, issues? } }
import type { z } from "zod";
import { RepoError, type RepoErrorCode } from "../repo/products";

export type AdminRole = "super_admin" | "editor" | "viewer";
export interface AdminLike {
  role: AdminRole;
  email?: string;
}

export interface ApiIssue {
  path: string;
  message: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  issues?: ApiIssue[],
): Response {
  return json(
    { error: { code, message, ...(issues ? { issues } : {}) } },
    status,
  );
}

/** 沒登入 401、viewer 403；通過回傳 null。middleware 已擋未登入，這裡是第二道防線。 */
export function requireWriter(admin: AdminLike | undefined): Response | null {
  if (!admin) return apiError(401, "unauthorized", "请先登录");
  if (admin.role === "viewer")
    return apiError(403, "forbidden", "此账号没有编辑权限");
  return null;
}

export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<
  { ok: true; data: z.output<S> } | { ok: false; response: Response }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "请求内容不是有效的 JSON"),
    };
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const issues = r.error.issues.map((i) => ({
      path: i.path.map(String).join("."),
      message: i.message,
    }));
    return {
      ok: false,
      response: apiError(400, "validation_failed", "栏位验证失败", issues),
    };
  }
  return { ok: true, data: r.data as z.output<S> };
}

const REPO_STATUS: Record<RepoErrorCode, number> = {
  not_found: 404,
  slug_taken: 409,
  sku_taken: 409,
  last_variant: 409,
  invalid_category: 400,
};

const REPO_MESSAGE: Record<RepoErrorCode, string> = {
  not_found: "找不到资源",
  slug_taken: "标识（slug）已被使用",
  sku_taken: "SKU 已被使用",
  last_variant: "商品至少要保留一个变体",
  invalid_category: "分类或子分类不正确",
};

/** 把例外轉成回應：RepoError 對應 4xx，其他一律 500（內容只寫進 log，不回給前端）。 */
export function failure(e: unknown): Response {
  if (e instanceof RepoError)
    return apiError(REPO_STATUS[e.code], e.code, REPO_MESSAGE[e.code]);
  console.error("[admin-products-api]", e);
  return apiError(500, "internal_error", "服务器错误");
}
