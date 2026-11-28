-- 0019: 電子報雙重確認訂閱 — 待確認清單
CREATE TABLE IF NOT EXISTS newsletter_pending (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'zh-Hans',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_newsletter_pending_email ON newsletter_pending (email);
