import { defineMiddleware } from "astro:middleware";
import {
  defaultLocale,
  isLocale,
  locales,
  localeFromPath,
  type Locale,
} from "./i18n/config";
import { loadMessages } from "./i18n/loader";
import { getAdminFromContext } from "./lib/auth";

const LOCALE_COOKIE = "cnamber_locale";

interface SiteSettings {
  siteName: Partial<Record<string, string>>;
  theme: Partial<Record<string, string>>;
  subTheme: Partial<Record<string, string>>;
  heroSubtitle: Partial<Record<string, string>>;
}

// Wave 28.7: 載入 D1 site_settings → Astro.locals.siteSettings。
// middleware 跑一次/request,SSR 期間所有 page 可讀。
async function loadSiteSettings(
  db: D1Database | undefined,
): Promise<SiteSettings | undefined> {
  if (!db) return undefined;
  const rows = await db
    .prepare("SELECT key, locale, value FROM site_settings")
    .all<{ key: string; locale: string; value: string }>();
  const out: SiteSettings = {
    siteName: {},
    theme: {},
    subTheme: {},
    heroSubtitle: {},
  };
  for (const r of rows.results ?? []) {
    const l = r.locale as Locale;
    if (r.key === "site_name") out.siteName[l] = r.value;
    else if (r.key === "theme") out.theme[l] = r.value;
    else if (r.key === "sub_theme") out.subTheme[l] = r.value;
    else if (r.key === "hero_subtitle") out.heroSubtitle[l] = r.value;
  }
  return out;
}
// F-13: Security headers — Cloudflare Pages _headers 只套 static assets,
// SSR worker responses 必須由 middleware 注入。
function setSecurityHeaders(response: Response): void {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  const ct = response.headers.get("content-type") ?? "";
  if (ct.includes("text/html")) {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  }
}
function withSecurityHeaders(response: Response): Response {
  setSecurityHeaders(response);
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;

  // 1. Locale detection
  let locale = localeFromPath(url.pathname);

  if (!locale) {
    const cookieLocale = context.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(cookieLocale)) {
      locale = cookieLocale;
    }
  }

  if (!locale) {
    const acceptLanguage = context.request.headers.get("accept-language") ?? "";
    locale = detectLocaleFromHeader(acceptLanguage);
  }

  if (!locale) {
    locale = defaultLocale;
  }

  // F-16: locale cookie maxAge 縮到 30 天,只在首次 set(cookie 不存在時)
  if (!context.cookies.get(LOCALE_COOKIE)?.value) {
    context.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: import.meta.env.PROD,
    });
  }

  const messages = await loadMessages(locale);
  context.locals.locale = locale;
  context.locals.messages = messages;

  // Wave 28.7: 載入 D1 site_settings (12 rows,index-covered,~5-15ms)
  const db = context.locals.runtime?.env?.DB;
  context.locals.siteSettings = await loadSiteSettings(db);

  // 2. CSRF defense (F-03): POST/PUT/DELETE/PATCH /api/admin/* 必須 same-origin
  const requestMethod = context.request.method.toUpperCase();
  if (
    url.pathname.startsWith("/api/admin") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(requestMethod)
  ) {
    const origin = context.request.headers.get("origin");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const requestHost = context.request.headers.get("host") ?? url.host;
        if (originUrl.host !== requestHost) {
          return withSecurityHeaders(
            new Response("Forbidden — invalid origin", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            }),
          );
        }
      } catch {
        return withSecurityHeaders(
          new Response("Forbidden — invalid origin", {
            status: 403,
            headers: { "Content-Type": "text/plain" },
          }),
        );
      }
    }
  }

  // 3. Admin auth check (covers /admin/* pages + /api/admin/* endpoints)
  // F-08: 沒過 session 認證 →
  //   /admin/*         → 302 redirect 到 /admin/login
  //   /api/admin/*     → 401 plain text(API 不該瀏覽器跳轉)
  // Exempt:/admin/login(登入頁)、/api/admin/login(登入 API)、/api/admin/logout(永遠允許)
  const isAdminPage =
    url.pathname.startsWith("/admin") &&
    !url.pathname.startsWith("/admin/login");
  const isAdminApi =
    url.pathname.startsWith("/api/admin") &&
    !url.pathname.startsWith("/api/admin/login") &&
    !url.pathname.startsWith("/api/admin/logout");

  if (isAdminPage || isAdminApi) {
    const admin = await getAdminFromContext(context);
    if (!admin) {
      if (isAdminApi) {
        return withSecurityHeaders(
          new Response("Unauthorized", {
            status: 401,
            headers: { "Content-Type": "text/plain" },
          }),
        );
      }
      const redirectUrl = `/admin/login?redirect=${encodeURIComponent(url.pathname)}`;
      return withSecurityHeaders(
        new Response(null, {
          status: 302,
          headers: { Location: redirectUrl },
        }),
      );
    }
    context.locals.admin = admin;
  }

  return withSecurityHeaders(await next());
});

function detectLocaleFromHeader(header: string): Locale | null {
  const parts = header
    .split(",")
    .map((p) => {
      const [tag, qPart] = p.trim().split(";");
      const q = qPart?.startsWith("q=") ? parseFloat(qPart.slice(2)) : 1;
      return { tag: (tag ?? "").toLowerCase(), q: Number.isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag === "zh-hans" || tag === "zh-cn" || tag.startsWith("zh-cn"))
      return "zh-Hans";
    if (tag === "zh-hant" || tag === "zh-tw" || tag === "zh-hk")
      return "zh-Hans";
    if (tag === "ms-my") return "ms-MY";
    if (tag === "id" || tag === "id-id") return "id-ID";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return null;
}

void locales;
