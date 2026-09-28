// 後台認證 — Phase 2 簡化版
// Cloudflare Access 在 production 透過 JWT 驗證(admin request header CF-Access-Jwt-Assertion)
// 本地開發 / preview 環境用 dev cookie fallback
// Phase 5 上線前需把 CF Access JWKS 接上(AUD 從 CF dashboard 取得)

import type { APIContext } from 'astro';

export interface AdminSession {
  email: string;
  role: 'super_admin' | 'editor' | 'viewer';
  displayName?: string;
}

const ADMIN_EMAILS = new Set<string>([
  'shineday999@gmail.com',
  // Phase 5 前可加更多 admin(從 admin_users 表 query)
]);

export function getAdminFromContext(ctx: APIContext): AdminSession | null {
  // 1. CF Access JWT header(生產環境)
  const cfJwt = ctx.request.headers.get('cf-access-jwt-assertion');
  if (cfJwt) {
    const raw = decodeCfAccessEmail(cfJwt);
    if (raw !== null && ADMIN_EMAILS.has(raw)) {
      return { email: raw, role: 'super_admin', displayName: raw.split('@')[0] ?? '' };
    }
  }

  // 2. Dev cookie fallback(本地 / preview)
  const devCookie = ctx.cookies.get('cnamber_dev_admin')?.value;
  if (devCookie) {
    const raw = safeBase64Decode(devCookie);
    if (raw !== null && ADMIN_EMAILS.has(raw)) {
      return { email: raw, role: 'super_admin', displayName: raw.split('@')[0] ?? '' };
    }
  }

  return null;
}

export function requireAdmin(ctx: APIContext): AdminSession {
  const session = getAdminFromContext(ctx);
  if (!session) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}

function decodeCfAccessEmail(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1] ?? '')) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

function safeBase64Decode(s: string): string | null {
  try {
    return atob(s);
  } catch {
    return null;
  }
}