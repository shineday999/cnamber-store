import type { APIRoute } from "astro";
import { getDB } from "../../../lib/db";
import {
  sendEmail,
  emailEnvFromContext,
  confirmNewsletterEmail,
} from "../../../lib/email";
import {
  CONFIRM_COOLDOWN_SEC,
  SITE_ORIGIN,
  ensureNewsletterPending,
  newToken,
  siteNameFor,
} from "../../../lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_LOCALES = new Set(["zh-Hans", "en", "ms-MY", "id-ID"]);

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
  const now = Math.floor(Date.now() / 1000);
  let status: "pending" | "already" = "pending";

  try {
    await ensureNewsletterPending(db);

    // 已經是正式訂閱者 → 不再寄確認信
    const existing = await db
      .prepare("SELECT status FROM newsletter_subscribers WHERE email = ?")
      .bind(email)
      .first<{ status: string }>();

    if (existing?.status === "active") {
      status = "already";
    } else {
      // 冷卻:10 分鐘內已經寄過確認信就不重寄
      const last = await db
        .prepare(
          "SELECT created_at FROM newsletter_pending WHERE email = ? AND confirmed_at IS NULL ORDER BY created_at DESC LIMIT 1",
        )
        .bind(email)
        .first<{ created_at: number }>();

      if (!last || now - last.created_at >= CONFIRM_COOLDOWN_SEC) {
        const token = newToken();
        await db
          .prepare(
            "INSERT INTO newsletter_pending (token, email, locale, created_at) VALUES (?, ?, ?, ?)",
          )
          .bind(token, email, locale, now)
          .run();

        const siteName = await siteNameFor(db, locale);
        const mail = confirmNewsletterEmail(
          email,
          locale,
          siteName,
          `${SITE_ORIGIN}/api/newsletter/confirm?token=${token}`,
        );
        const r = await sendEmail(emailEnvFromContext(), {
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        if (!r.ok) {
          // 寄失敗就把這筆拿掉,訪客才能馬上重試
          console.error("[newsletter] confirmation send failed", r.error);
          await db
            .prepare("DELETE FROM newsletter_pending WHERE token = ?")
            .bind(token)
            .run();
        }
      }
    }
  } catch (e) {
    console.error("[newsletter] subscribe failed", e);
    return new Response("DB error", { status: 500 });
  }

  // 導回訂閱表單所在的頁面(同源 Referer 的 path;沒有就回首頁),帶 subscribed=<狀態>
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
  // /more 頁的提示在頁面最上方,不需要錨點;其他頁提示在 Footer,用錨點捲過去
  const isMore = /(^|\/)more\/?$/.test(backPath);
  return ctx.redirect(
    `${backPath}?subscribed=${status}${isMore ? "" : "#newsletter-success"}`,
    303,
  );
};
