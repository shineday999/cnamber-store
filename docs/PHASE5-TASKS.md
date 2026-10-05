# Phase 5 Tasks — QA + 上線 + Phase 5+

> **狀態**:✅ Phase 5+ 完成(2026-09-29 最後更新)
> **建立**:2026-09-29

---

## Phase 5 上線 Checklist

### 安全審計(OWASP Top 10 + CWE Top 25)

- [x] **A01 Broken Access Control**:`/admin/*` 由 Cloudflare Access 保護(middleware)
- [x] **A03 Injection**:所有 D1 query 使用 prepared statements(`db.prepare(...).bind(...)`)
- [x] **A04 Insecure Design**:預訂制無金流,降低攻擊面
- [x] **A05 Security Misconfiguration**:Cookie 設 `httpOnly` + `sameSite=lax` + `secure` (prod)
- [x] **A07 Identification & Auth Failures**:後台依賴 CF Access JWT,密碼不存本站
- [x] **A08 Software & Data Integrity**:依賴 Cloudflare Pages build + GitHub commit signing
- [x] **A09 Logging Failures**:Workers Logs + Cloudflare Analytics(預設)
- [x] **A10 SSRF**:無外部 URL 呼叫,降低風險
- [x] **HTTP Headers**:`public/_headers` 設 X-Frame-Options / X-Content-Type-Options / HSTS / COOP

### 4 語驗收

- [x] `zh-Hans`(簡體,預設)— 完整翻譯
- [x] `en` 英文 — 完整翻譯
- [x] `ms-MY` 馬來西亞馬來語 — 完整翻譯
- [x] `id-ID` 印尼馬來語 — 完整翻譯
- [x] hreflang tags(Layout 已加)
- [x] Locale 切換器(LocaleSwitcher React island)
- [x] Cookie-based 偵測(URL → cookie → Accept-Language → default)

### DNS + 上線(用戶操作)

- [ ] **DNS CNAME**:`cnamber.ccwu.cc → cnamber-store.pages.dev`(用戶在 Cloudflare Dashboard 加)
- [ ] **Cloudflare Access**:Application + Policy(見 `docs/PHASE1-ACCESS-SETUP.md`)
- [ ] **驗證線上**:https://cnamber.ccwu.cc 顯示 4 語首頁

---

## Phase 5+ 剩餘項目(完成版)

### ✅ Email 通知(Resend)

- [x] `src/lib/email.ts` — Resend API wrapper + `orderConfirmationEmail` + `contactNotificationEmail` 模板
- [x] `src/pages/api/orders/create.ts` — 寄客戶確認信 + 管理員通知
- [x] `src/pages/api/contact.ts` — 寄管理員通知
- [x] Graceful fallback:無 `RESEND_API_KEY` 時只 console.log
- [ ] **用戶操作**:`wrangler secret put RESEND_API_KEY`(上線後)

### ✅ 部落格 CMS + 前台

- [x] `src/pages/admin/posts/index.astro` — 列表
- [x] `src/pages/admin/posts/new.astro` — 新增(4 語 tab)
- [x] `src/pages/admin/posts/[id].astro` — 編輯(4 語 tab)
- [x] `src/pages/api/admin/posts/index.ts` — POST create
- [x] `src/pages/api/admin/posts/[id].ts` — POST meta + translation + delete
- [x] `src/pages/blog/index.astro` — 前台列表(SSR)
- [x] `src/pages/blog/[slug].astro` — 前台文章(SSR + Markdown 渲染)

### ✅ 訂單狀態切換詳細 UI

- [x] `src/pages/admin/orders/[id].astro` — 訂單詳細 + 狀態/付款/追蹤號/備註編輯
- [x] `src/pages/api/admin/orders/[id]/status.ts` — POST 處理

### ✅ 商品 4 語完整編輯器

- [x] `src/pages/admin/products/[id].astro` — Tabs(core / translations / variants)
- [x] `src/pages/api/admin/products/[id]/index.ts` — POST 更新核心欄位
- [x] `src/pages/api/admin/products/[id]/translations.ts` — POST 更新單語(INSERT ON CONFLICT DO UPDATE)

### 已知限制 / 後續

- [ ] Email Resend 介面已寫,但需要用戶實際提供 API key
- [ ] 真實產品資料擴充(目前 7 個 sample)
- [ ] 馬/印母語譯者校稿
- [ ] Lighthouse 實測達標(`.lighthouserc.json` 已設,需跑)
- [ ] 影像最佳化(產品圖 R2 + Cloudflare Images)
