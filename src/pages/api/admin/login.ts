import type { APIRoute } from "astro";
import { setSessionCookie, verifyPassword } from "../../../lib/auth";

interface AdminRow {
  email: string;
  role: string;
  password_hash: string | null;
}

// F-04: empty input guard
// F-07: 不洩漏 email 是否存在(無論 email 找不到或密碼錯都回相同 "invalid")
export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirect") ?? "/admin");

  if (!email || !password) {
    return ctx.redirect("/admin/login?error=empty", 303);
  }

  const env = ctx.locals.runtime?.env;
  const db = env?.DB;
  if (!db) {
    return ctx.redirect("/admin/login?error=server", 303);
  }

  const row = await db
    .prepare(
      "SELECT email, role, password_hash FROM admin_users WHERE email = ?",
    )
    .bind(email)
    .first<AdminRow>();

  const ok = row ? await verifyPassword(password, row.password_hash) : false;
  if (!ok || !row) {
    // F-08: log failed attempt (含 IP + email,不含密碼)
    const ip = ctx.request.headers.get("cf-connecting-ip") ?? "?";
    console.warn(`[admin login] failed email=${email} ip=${ip}`);
    return ctx.redirect("/admin/login?error=invalid", 303);
  }

  await setSessionCookie(ctx, row.email);

  // F-09: 更新 last_login_at / last_login_ip
  const now = Math.floor(Date.now() / 1000);
  const ip = ctx.request.headers.get("cf-connecting-ip") ?? null;
  await db
    .prepare(
      "UPDATE admin_users SET last_login_at = ?, last_login_ip = ? WHERE email = ?",
    )
    .bind(now, ip, row.email)
    .run();

  // F-10: redirect 路徑檢查(只能相對路徑,不能 // 開頭,不能跳外站)
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin";
  return ctx.redirect(safeRedirect, 303);
};
