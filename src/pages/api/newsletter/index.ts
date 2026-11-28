import type { APIRoute } from "astro";
import { getDB, genId } from "../../../lib/db";
import {
  sendEmail,
  emailEnvFromContext,
  welcomeNewsletterEmail,
} from "../../../lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_LOCALES = new Set(["zh-Hans", "en", "ms-MY", "id-ID"]);

// site_settings.site_name 依語系取值,4 層 fallback
async function siteNameFor(
  db: ReturnType<typeof getDB>,
  locale: string,
): Promise<string> {
  try {
    const { results } = await db
      .prepare(
        "SELECT locale, value FROM site_settings WHERE key = 'site_name'",
      )
      .all<{ locale: string; value: string }>();
    const map = new Map((results ?? []).map((r) => [r.locale, r.value]));
    return (
      map.get(locale) ?? map.get("zh-Hans") ?? map.get("en") ?? "cnamber-store"
    );
  } catch {
    return "cnamber-store";
  }
}

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const localeRaw = String(
    form.get("locale") ?? ctx.locals.locale ?? "zh-Hans",
  );
  const locale = ALLOWED_LOCALES.has(localeRaw) ? localeRaw : "zh-Hans";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return new Response("Invalid email", { status: 400 });
  }

  const db = getDB();
  const id = genId("sub");
  const now = Math.floor(Date.now() / 1000);

  let inserted = false;
  try {
    // INSERT OR IGNORE: dedupe 同 email 不重複 row
    const ins = await db
      .prepare(
        "INSERT OR IGNORE INTO newsletter_subscribers (id, email, locale, status, source, created_at, updated_at) VALUES (?, ?, ?, 'active', 'footer_form', ?, ?)",
      )
      .bind(id, email, locale, now, now)
      .run();
    inserted = (ins.meta?.changes ?? 0) > 0;
  } catch (e) {
    console.error("[newsletter] insert failed", e);
    return new Response("DB error", { status: 500 });
  }

  // 只有真的新訂閱才寄歡迎信(重複訂閱不會重寄)
  if (inserted) {
    try {
      const siteName = await siteNameFor(db, locale);
      const t = welcomeNewsletterEmail(email, locale, siteName);
      const r = await sendEmail(emailEnvFromContext(), {
        to: email,
        subject: t.subject,
        html: t.html,
        text: t.text,
      });
      if (r.ok) {
        await db
          .prepare(
            "UPDATE newsletter_subscribers SET welcome_sent_at = ? WHERE id = ?",
          )
          .bind(Math.floor(Date.now() / 1000), id)
          .run();
      } else {
        console.error("[newsletter] welcome send failed", r.error);
      }
    } catch (e) {
      console.error("[newsletter] welcome send failed", e);
    }
  }

  // 導回訂閱表單所在的頁面(同源 Referer 的 path;沒有就回首頁),帶 subscribed=1
  let backPath = "/";
  try {
    const ref = ctx.request.headers.get("referer");
    if (ref) {
      const r = new URL(ref);
      if (r.origin === new URL(ctx.request.url).origin) {
        backPath = r.pathname || "/";
      }
    }
  } catch {
    backPath = "/";
  }
  // 防 open redirect:只允許站內單斜線開頭的路徑
  if (!backPath.startsWith("/") || backPath.startsWith("//")) backPath = "/";
  // /more 頁的成功訊息在頁面最上方,不需要錨點;其他頁訊息在 Footer,用錨點捲過去
  const isMore = /(^|\/)more\/?$/.test(backPath);
  return ctx.redirect(
    `${backPath}?subscribed=1${isMore ? "" : "#newsletter-success"}`,
    303,
  );
};
