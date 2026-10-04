// src/pages/sitemap.xml.ts
// Wave 32 SEO: dynamic sitemap for SEO + AEO + GEO
// Phase 1: static pages × 4 locales (44 URLs)
// Wave 32.1 will append D1 products + blog posts (with lastmod from updated_at / published_at)
import type { APIRoute } from "astro";
import { locales, localizedPath } from "../i18n/config";

const SITE_URL = "https://cnamber.ccwu.cc";

// Static pages included in sitemap (no /admin/*, /api/*, /checkout/*, /cart — those are session-gated or low-value)
const STATIC_PATHS = [
  "/",
  "/products",
  "/story",
  "/vision",
  "/craft",
  "/materials",
  "/amber",
  "/incense",
  "/blog",
  "/quiz",
  "/contact",
];

export const GET: APIRoute = async () => {
  const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const urls: {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }[] = [];

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      const localized = localizedPath(locale, path);
      const isHome = path === "/";
      const isProductList = path === "/products";
      urls.push({
        loc: `${SITE_URL}${localized}`,
        lastmod: now,
        changefreq: isHome ? "weekly" : "monthly",
        priority: isHome ? "1.0" : isProductList ? "0.9" : "0.7",
      });
    }
  }

  // TODO Wave 32.1: append D1 products (slug, updated_at) + blog posts (slug, published_at)
  //   const db = Astro.locals.runtime.env.DB;
  //   const products = await db.prepare("SELECT slug, updated_at FROM products WHERE status = 'active'").all();
  //   ... etc

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
