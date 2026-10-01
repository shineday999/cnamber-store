// 後台認證 — Cloudflare Access (production) + dev cookie (DEV only)
// F-01: 用 jose 真實驗簽 CF Access JWT,需 env CF_ACCESS_TEAM + CF_ACCESS_AUD
// F-02: dev cookie 只在 DEV 環境生效,prod 完全不信任
// F-07: role 一律為 super_admin

import type { APIContext } from "astro";
import { jwtVerify, createRemoteJWKSet } from "jose";

export interface AdminSession {
  email: string;
  role: "super_admin";
  displayName?: string;
}

const ADMIN_EMAILS = new Set<string>([
  "shineday999@gmail.com",
  "18940333444@qq.com",
]);

interface CfRuntimeEnv {
  CF_ACCESS_TEAM?: string;
  CF_ACCESS_AUD?: string;
}

function readCfAccessEnv(ctx: APIContext): {
  team: string | null;
  aud: string | null;
} {
  const env = (ctx.locals.runtime?.env ?? {}) as CfRuntimeEnv;
  return {
    team:
      typeof env.CF_ACCESS_TEAM === "string" && env.CF_ACCESS_TEAM.length > 0
        ? env.CF_ACCESS_TEAM
        : null,
    aud:
      typeof env.CF_ACCESS_AUD === "string" && env.CF_ACCESS_AUD.length > 0
        ? env.CF_ACCESS_AUD
        : null,
  };
}

export async function getAdminFromContext(
  ctx: APIContext,
): Promise<AdminSession | null> {
  // 1. CF Access JWT (production) — F-01: jose 真實驗簽
  const cfJwt = ctx.request.headers.get("cf-access-jwt-assertion");
  if (cfJwt) {
    const { team, aud } = readCfAccessEnv(ctx);
    if (team && aud) {
      try {
        const jwks = createRemoteJWKSet(
          new URL(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`),
        );
        const { payload } = await jwtVerify(cfJwt, jwks, {
          audience: aud,
          issuer: `https://${team}.cloudflareaccess.com`,
        });
        const email = typeof payload.email === "string" ? payload.email : null;
        if (email && ADMIN_EMAILS.has(email)) {
          return {
            email,
            role: "super_admin",
            displayName: email.split("@")[0] ?? email,
          };
        }
      } catch {
        // invalid JWT — fall through to dev cookie (DEV only) or 401
      }
    }
  }

  // 2. Dev cookie fallback — F-02: 只在 DEV 環境生效,prod 完全不信任
  if (import.meta.env.DEV) {
    const devCookie = ctx.cookies.get("cnamber_dev_admin")?.value;
    if (devCookie) {
      const raw = safeBase64Decode(devCookie);
      if (raw && ADMIN_EMAILS.has(raw)) {
        return {
          email: raw,
          role: "super_admin",
          displayName: raw.split("@")[0] ?? raw,
        };
      }
    }
  }

  return null;
}

export async function requireAdmin(ctx: APIContext): Promise<AdminSession> {
  const session = await getAdminFromContext(ctx);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}

function safeBase64Decode(s: string): string | null {
  try {
    return atob(s);
  } catch {
    return null;
  }
}
