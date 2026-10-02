import type { APIRoute } from "astro";
import { getDB, genId } from "../../../lib/db";
import {
  sendEmail,
  emailEnvFromContext,
  welcomeNewsletterEmail,
} from "../../../lib/email";

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

  const db = getDB(ctx);
  const id = genId("sub");
  const now = Math.floor(Date.now() / 1000);

  let isNewSubscriber = false;
  try {
    // INSERT OR IGNORE: dedupe 同 email 不重複 row
    const result = await db
      .prepare(
        "INSERT OR IGNORE INTO newsletter_subscribers (id, email, locale, status, source, created_at, updated_at) VALUES (?, ?, ?, 'active', 'footer_form', ?, ?)",
      )
      .bind(id, email, locale, now, now)
      .run();
    // changes === 1 表示真寫入;0 表示 email 已存在 (UNIQUE 撞到)
    isNewSubscriber = (result.meta?.changes ?? 0) === 1;
  } catch (e) {
    console.error("[newsletter] insert failed", e);
    return new Response("DB error", { status: 500 });
  }

  // Wave 30.1: 只有新訂閱才寄歡迎信,dedupe 重複不寄 (省 Gmail quota + 避免打擾)
  if (isNewSubscriber) {
    const tpl = welcomeNewsletterEmail(email, locale);
    void sendEmail(emailEnvFromContext(ctx), {
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    }).catch((e) => console.error("[newsletter] welcome email failed", e));
  }

  // 303 redirect 回首頁帶 subscribed=1 query → Footer 顯示成功訊息
  return ctx.redirect("/?subscribed=1", 303);
};
