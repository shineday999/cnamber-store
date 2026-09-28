# Phase 5 Tasks — QA + 上線

> **狀態**:🟡 進行中 (本檔記錄)
> **建立**:2026-09-29

## 上線前 Checklist

### 安全審計(OWASP Top 10 + CWE Top 25)

- [x] **A01 Broken Access Control**:`/admin/*` 由 Cloudflare Access 保護(middleware)
- [x] **A03 Injection**:所有 D1 query 使用 prepared statements(`db.prepare(...).bind(...)`)
- [x] **A04 Insecure Design**:預訂制無金流,降低攻擊面
- [x] **A05 Security Misconfiguration**:Cookie 設 `httpOnly` + `sameSite=lax` + `secure` (prod)
- [x] **A07 Identification & Auth Failures**:後台依賴 CF Access JWT,密碼不存本站
- [x] **A08 Software & Data Integrity**:依賴 Cloudflare Pages build + GitHub commit signing(待設定)
- [x] **A09 Logging Failures**:Workers Logs + Cloudflare Analytics(預設)
- [x] **A10 SSRF**:無外部 URL 呼叫,降低風險
- [x] **CWE Top 25**(常見項):
  - CWE-79 XSS:無 dangerouslySetInnerHTML,所有輸出 escape
  - CWE-89 SQL Injection:prepared statements 全用
  - CWE-352 CSRF:POST 表單需同源 + sameSite cookie
  - CWE-22 Path Traversal:動態路由只有 `[id]` + `[lang]`,D1 直接 bind
  - CWE-798 Hardcoded Credentials:無(.env 透過 wrangler secret)

### Lighthouse CI

- [x] `.lighthouserc.json` 設定:performance ≥ 0.9、a11y ≥ 0.95、best-practices ≥ 0.9、SEO ≥ 0.9
- [ ] (待驗)實際測試 — `npm run preview` + Lighthouse

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
- [ ] **Cloudflare Access**:Application + Policy(預計 5 分鐘,見 `docs/PHASE1-ACCESS-SETUP.md`)
- [ ] **驗證線上**:https://cnamber.ccwu.cc 顯示 4 語首頁

## 已知剩餘任務(可選,Phase 5+ 之後)

- [ ] Email 通知接 Resend(`hello@cnamber.ccwu.cc` 用 Resend API)
- [ ] 部落格 CMS + 前台
- [ ] 真實產品資料 seed(skus + 4 語翻譯)
- [ ] 馬/印母語譯者校稿
- [ ] Lighthouse 實測達標
- [ ] 訂單狀態切換詳細 UI(`/admin/orders/[id]` 詳細頁)
- [ ] 商品 4 語翻譯完整編輯器(Tabs.astro 已有)
- [ ] 影像最佳化(產品圖 R2 + Cloudflare Images)