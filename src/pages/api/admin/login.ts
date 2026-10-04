import type { APIRoute } from "astro";
import { setSessionCookie, verifyPassword } from "../../../lib/auth";

// Wave 79: simple in-memory rate limit (5 attempts / 15 min lockout per IP)
const loginAttempts = new Map<
  string,
  { count: number; firstAt: number; lockedUntil: number }
>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec) return { allowed: true };
  if (rec.lockedUntil > now)
    return {
      allowed: false,
      retryAfter: Math.ceil((rec.lockedUntil - now) / 1000),
    };
  if (now - rec.firstAt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function recordAttempt(ip: string, success: boolean): void {
  const now = Date.now();
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const rec = loginAttempts.get(ip);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = now + LOCKOUT_MS;
}

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
  const ip =
    ctx.request.headers.get("CF-Connecting-IP") ??
    ctx.request.headers.get("X-Forwarded-For") ??
    "unknown";
  const rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    return new Response(`Too many attempts. Try again in ${rl.retryAfter}s.`, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }
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
    const clientIp = ctx.request.headers.get("cf-connecting-ip") ?? "?";
    console.warn(`[admin login] failed email=${email} ip=${clientIp}`);
    return ctx.redirect("/admin/login?error=invalid", 303);
  }

  await setSessionCookie(ctx, row.email);

  // F-09: 更新 last_login_at / last_login_ip
  const now = Math.floor(Date.now() / 1000);
  const clientIp = ctx.request.headers.get("cf-connecting-ip") ?? null;
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
