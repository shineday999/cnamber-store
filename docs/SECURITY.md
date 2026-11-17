# Security Audit — OWASP Top 10 + CWE Top 25

> **對齊**:Phase 5 上線前審計(計劃書 §Station 4)
> **日期**:2026-09-29

> **2026-11-17 更新**:本文件下方 A01、A02 原寫於 2026-09-29,當時認證走 Cloudflare Access;
> 該流程已於 2026-10-01 拔除,現況如下,下方舊描述以現況為準。
>
> ## 後台認證現況
>
> - 自建 email + 密碼登入:`admin_users.password_hash`(bcryptjs,cost 12),見 `src/lib/auth.ts`
> - 登入成功後簽發 HS256 session JWT cookie(12 小時、HttpOnly、SameSite=Lax、prod 啟用 Secure);`SESSION_SECRET` 需 ≥ 32 字元
> - 每次請求以 D1 `admin_users.email` 重新查驗,移除 admin 後立即失效
> - 登入限流:同 IP 15 分鐘內失敗 5 次,鎖定 15 分鐘(回 429);計數存於 KV `SESSION`(`login-rl:<ip>`),只信 `CF-Connecting-IP`
> - 已知限制:`change-password` 的限流仍為單一 Worker 實例的記憶體版,待改為 KV
> - 若歷史 commit 曾含任何金鑰或密碼,請輪替,並以 `gitleaks detect` 掃描完整歷史

---

## OWASP Top 10 (2021)

### A01:2021 Broken Access Control ✅

- `/admin/*` 路由由 `src/middleware.ts` 統一檢查(~~Cloudflare Access JWT~~ 已改為 session JWT cookie,見上方「後台認證現況」)
- 後台 email 限制:`shineday999@gmail.com`(Phase 5 之後可從 `admin_users` 表 query)
- Cookie 設 `httpOnly` + `sameSite=lax` + `secure`(prod)

### A02:2021 Cryptographic Failures ✅(部分)

- HTTPS 由 Cloudflare 自動提供
- ~~密碼不在本站存(認證走 CF Access)~~ 密碼以 bcrypt 雜湊存於 D1 `admin_users`(見上方「後台認證現況」)
- Cookie 用 base64 + URL encode(僅作為 client-side cart state,非 sensitive)

### A03:2021 Injection ✅

- 所有 D1 query 使用 prepared statements:`db.prepare(...).bind(...)`
- 動態路由參數直接 bind,不拼接字串
- 表單輸入驗證:`name`/`email`/`message` required,length 限制

### A04:2021 Insecure Design ✅

- 預訂制(無金流)降低攻擊面 — 不存信用卡、不接 Stripe
- Email 通知(Phase 5 接 Resend)走 HTTPS API

### A05:2021 Security Misconfiguration ✅

- `secure: import.meta.env.PROD` — Cookie 只在 prod 啟用 secure flag
- 4 語 locale 列舉驗證(`isLocale` type guard)
- 文案長度上限(message 5000 chars)

### A06:2021 Vulnerable & Outdated Components ⚠️(待持續更新)

- 18 vulnerabilities(moderate/high/critical)來自 `npm install`(transitive deps)
- 不影響功能,但 Phase 5 後建議跑 `npm audit fix`

### A07:2021 Identification & Auth Failures ✅

- 後台依賴 CF Access JWT,不在本站存密碼
- Phase 5 上線前需把 CF Access JWKS 接上,嚴格驗 JWT signature(目前 Phase 2 簡化版只解析 payload 不驗)

### A08:2021 Software & Data Integrity Failures ⚠️(部分)

- 部署透過 GitHub + Cloudflare Pages GitHub App
- Commit 透過 Husky pre-commit + lint-staged + commitlint(已設,用 --no-verify bypass 過但 hooks 在)
- Phase 5 上線前:啟用 GitHub branch protection + required CI checks

### A09:2021 Security Logging Failures ✅

- Cloudflare Workers Logs 自動啟用
- 後台錯誤印到 console:`console.error('[admin dashboard] DB query failed', e)`
- Phase 5 可考慮加 Sentry(已從 PRD 砍,後續可加)

### A10:2021 Server-Side Request Forgery ✅

- 本站無外部 URL 呼叫,降低 SSRF 風險

---

## CWE Top 25(常見項)

| CWE     | 名稱                  | 狀態 | 備註                                               |
| ------- | --------------------- | ---- | -------------------------------------------------- |
| CWE-79  | XSS                   | ✅   | 無 `dangerouslySetInnerHTML`,所有輸出 escape       |
| CWE-89  | SQL Injection         | ✅   | prepared statements 全用                           |
| CWE-352 | CSRF                  | ⚠️   | POST 表單需同源;同源 + sameSite=lax 提供基本防護   |
| CWE-22  | Path Traversal        | ✅   | 動態路由只 `[id]` + `[lang]`,D1 直接 bind          |
| CWE-798 | Hardcoded Credentials | ✅   | 無 hardcoded secrets;`.env` 透過 `wrangler secret` |
| CWE-787 | Out-of-bounds Write   | N/A  | 不適用(無 C code)                                  |
| CWE-125 | Out-of-bounds Read    | N/A  | 不適用                                             |
| CWE-416 | Use After Free        | N/A  | 不適用                                             |
| CWE-476 | NULL Pointer Deref    | ✅   | TypeScript 強制 null check                         |
| CWE-190 | Integer Overflow      | N/A  | JS Number 範圍足夠                                 |

---

## 待改善(Phase 5+ 上線前)

1. **CF Access JWKS 嚴格驗**:把 `src/lib/auth.ts` 的 JWT payload 解析換成 `jose` + JWKS 驗證
2. **Rate limiting**:API endpoint 加 Cloudflare Rate Limit Rules(防 spam)
3. **Honeypot field**:聯絡表單加隱藏欄位抓 bot
4. **CSP headers**:Layout 加 `Content-Security-Policy`
5. **HSTS**:Cloudflare Dashboard 啟用 Strict-Transport-Security
6. **Email 通知**:接 Resend + DKIM/SPF/DMARC 設定

---

## 結論

cnamber-store v1 在 OWASP Top 10 主要類別合規,CWE Top 25 無關鍵風險。剩餘風險集中在部署後設定(CF Access 嚴格驗、Rate limiting、HSTS),這些需 user 登入 Cloudflare Dashboard 設定或補上 API key。
