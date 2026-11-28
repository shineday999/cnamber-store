import type { APIRoute } from "astro";
import { getDB, genId } from "../../../lib/db";
import {
  sendEmail,
  emailEnvFromContext,
  welcomeNewsletterEmail,
} from "../../../lib/email";
import {
  CONFIRM_TTL_SEC,
  ensureNewsletterPending,
  localeHome,
  siteNameFor,
} from "../../../lib/newsletter";

const TOKEN_RE = /^[a-f0-9]{64}$/;

export const GET: APIRoute = async (ctx) => {
  const go = (locale: string, status: string) =>
    ctx.redirect(
      `${localeHome(locale)}?subscribed=${status}#newsletter-success`,
      303,
    );

  const token = ctx.url.searchParams.get("token") ?? "";
  if (!TOKEN_RE.test(token)) return go("zh-Hans", "invalid");

  const db = getDB();
  const now = Math.floor(Date.now() / 1000);

  try {
    await ensureNewsletterPending(db);

    const row = await db
      .prepare(
        "SELECT email, locale, created_at, confirmed_at FROM newsletter_pending WHERE token = ?",
      )
      .bind(token)
      .first<{
        email: string;
        locale: string;
        created_at: number;
        confirmed_at: number | null;
      }>();

    if (!row) return go("zh-Hans", "invalid");
    // 重複點同一個連結:視為已確認(冪等)
    if (row.confirmed_at) return go(row.locale, "confirmed");
    if (now - row.created_at > CONFIRM_TTL_SEC) {
      return go(row.locale, "invalid");
    }

    // 正式訂閱:沒有就新增,有(例如先前取消訂閱)就改回 active
    const sub = await db
      .prepare(
        "SELECT id, welcome_sent_at FROM newsletter_subscribers WHERE email = ?",
      )
      .bind(row.email)
      .first<{ id: string; welcome_sent_at: number | null }>();

    let subId = sub?.id ?? "";
    if (!sub) {
      subId = genId("sub");
      await db
        .prepare(
          "INSERT OR IGNORE INTO newsletter_subscribers (id, email, locale, status, source, created_at, updated_at) VALUES (?, ?, ?, 'active', 'footer_form', ?, ?)",
        )
        .bind(subId, row.email, row.locale, now, now)
        .run();
    } else {
      await db
        .prepare(
          "UPDATE newsletter_subscribers SET status = 'active', updated_at = ? WHERE id = ?",
        )
        .bind(now, sub.id)
        .run();
    }

    await db
      .prepare("UPDATE newsletter_pending SET confirmed_at = ? WHERE token = ?")
      .bind(now, token)
      .run();

    // 確認成功才寄歡迎信(失敗不影響訂閱結果)
    if (!sub?.welcome_sent_at) {
      try {
        const siteName = await siteNameFor(db, row.locale);
        const t = welcomeNewsletterEmail(row.email, row.locale, siteName);
        const r = await sendEmail(emailEnvFromContext(), {
          to: row.email,
          subject: t.subject,
          html: t.html,
          text: t.text,
        });
        if (r.ok && subId) {
          await db
            .prepare(
              "UPDATE newsletter_subscribers SET welcome_sent_at = ? WHERE id = ?",
            )
            .bind(Math.floor(Date.now() / 1000), subId)
            .run();
        } else if (!r.ok) {
          console.error("[newsletter] welcome send failed", r.error);
        }
      } catch (e) {
        console.error("[newsletter] welcome send failed", e);
      }
    }

    return go(row.locale, "confirmed");
  } catch (e) {
    console.error("[newsletter] confirm failed", e);
    return go("zh-Hans", "invalid");
  }
};
