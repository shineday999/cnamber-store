# Phase 1 Tasks — 基礎建設

> **目標**:Phase 1 結束時 `localhost:4321` 顯示 4 語首頁 + 語系切換器,`cnamber-store.pages.dev` 可訪問,D1 schema 已建,CI/CD 跑得起來。
> **建立**:2026-09-29
> **狀態**:🟡 全部檔案就位,等待驗證 + commit + push

---

## Task 列表

- [x] **T1**:寫本檔 + 驗證 wrangler 認證狀態
- [x] **T2**:Astro SSR 設定(`output: 'server'` + `@astrojs/cloudflare` adapter)
- [x] **T3**:D1 schema migrations 檔案(13 個表)
- [x] **T4**:`wrangler.jsonc` bindings(D1/R2/KV)+ 本地 D1 待套用
- [x] **T5**:Hono API skeleton(`src/functions/api/[[path]].ts` + `/api/health`)
- [x] **T6**:4 語 i18n 框架(`src/i18n/` + `t()` helper + 中間件 + 4 個 locale messages)
- [x] **T7**:首頁改為 4 語 + LocaleSwitcher + HomeContent + [lang]/index.astro
- [x] **T8**:GitHub Actions deploy workflow
- [x] **T9**:Vitest 設定 + smoke test
- [x] **T10**:Husky + commitlint + 8 個 lint-staged glob

## 待用戶手動完成

- [ ] **T11**:Cloudflare Access 設定(見 `docs/PHASE1-ACCESS-SETUP.md`)
- [ ] **T12**:Phase 1 驗收(DNS 驗證 + Lighthouse + 4 語首頁 deploy 上線)

---

## 技術決定(鎖定)

| 項目 | 決定 | 原因 |
|---|---|---|
| Astro 模式 | `output: 'server'` + `@astrojs/cloudflare` v11+ | 計畫書 §4 |
| D1 database_id | `adbf8443-b2ab-4042-9781-d36588a8f5b8`(APAC) | 計畫書 §4 |
| KV namespace id | `4c8f1d2d42c040a9958d3c133426d896` | I18N 快取 |
| i18n | 自寫 t() helper + 中間件 | Astro 慣例、零 runtime cost |
| API | Hono + Pages Functions `[[path]].ts` | 輕量、TypeScript-first |
| 測試 | Vitest(已裝) | Astro 預設整合 |
| 部署 | `cloudflare/pages-action` | 自動部署 + PR preview |

---

## 進度記錄

| 日期 | Task | 狀態 | 備註 |
|---|---|---|---|
| 2026-09-29 | T1-T10 | 檔案就位 | 等待驗證 + commit + push |