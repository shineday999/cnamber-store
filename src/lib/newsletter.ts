// 電子報雙重確認訂閱的共用 helper
import { getDB } from "./db";

type DB = ReturnType<typeof getDB>;

// 確認連結一律用正式網域,不吃 request Host
export const SITE_ORIGIN = "https://cnamber.ccwu.cc";
// 同一個 email 重複送出訂閱,10 分鐘內只寄一封確認信(避免被拿來洗別人的信箱)
export const CONFIRM_COOLDOWN_SEC = 10 * 60;
// 確認連結 7 天內有效
export const CONFIRM_TTL_SEC = 7 * 24 * 60 * 60;

let pendingTableReady = false;

export async function ensureNewsletterPending(db: DB): Promise<void> {
  if (pendingTableReady) return;
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS newsletter_pending (token TEXT PRIMARY KEY, email TEXT NOT NULL, locale TEXT NOT NULL DEFAULT 'zh-Hans', created_at INTEGER NOT NULL, confirmed_at INTEGER)",
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_newsletter_pending_email ON newsletter_pending (email)",
    ),
  ]);
  pendingTableReady = true;
}

export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// site_settings.site_name 依語系取值,4 層 fallback
export async function siteNameFor(db: DB, locale: string): Promise<string> {
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

// 該語系的首頁路徑(預設語系 zh-Hans 不帶前綴)
export function localeHome(locale: string): string {
  return locale === "zh-Hans" ? "/" : `/${locale}`;
}
