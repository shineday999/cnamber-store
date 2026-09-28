# cnamber-store — Phase 0 手動操作手冊

> 自動執行已完成的動作不列於此。本文件列出**需要您手動在 Cloudflare / GitHub dashboard 操作**的步驟,完成後 Phase 0 即收結案。

---

## 1. DNS CNAME 設定(讓 cnamber.ccwu.cc 指到 Pages)

### 為什麼需要

- Cloudflare Pages API 加自訂網域因內部狀態不一致(code 8000018)持續失敗
- OAuth token 缺少 `dns_records:edit` scope,無法用 API 寫 DNS
- **繞道方案**:直接在 cnamber.ccwu.cc zone 加 CNAME record 指 `cnamber-store.pages.dev`,Cloudflare proxy 會自動處理 SSL

### 操作步驟(預計 2 分鐘)

1. 登入 **Cloudflare Dashboard**:https://dash.cloudflare.com
2. 選擇 zone **`cnamber.ccwu.cc`**(已驗證存在於您的帳號)
3. 左側選單 → **DNS** → **Records**
4. 點 **Add record**
5. 填寫:
   - **Type**:`CNAME`
   - **Name**:`@`(代表根網域 cnamber.ccwu.cc)
   - **Target**:`cnamber-store.pages.dev`
   - **Proxy status**:**Proxied**(預設,橘色雲朵)
   - **TTL**:`Auto`
6. 點 **Save**
7. 等 1-5 分鐘 DNS 傳播

### 驗證

```bash
curl -sI https://cnamber.ccwu.cc
# 應回 HTTP/2 200 + cf-cache-status: HIT
curl -s https://cnamber.ccwu.cc | head -10
# 應看到「牛馬得飾 — 把森林穿戴在身上」HTML
```

### 若失敗

- 檢查 CNAME record 是否啟用 Proxy(橘雲)
- 確認 Target 是 `cnamber-store.pages.dev`(不是 `*.cnamber-store.pages.dev`)
- 等 5-10 分鐘 DNS 完整傳播

---

## 2. GitHub Project 板建立(Kanban 追蹤)

### 為什麼需要

- `gh project create` 因 OAuth token 缺 `project` scope 失敗
- **繞道方案**:在 GitHub dashboard 手動建

### 操作步驟(預計 3 分鐘)

1. 登入 **GitHub**:https://github.com
2. 進入 repo **shineday999/cnamber-store**
3. 上方頁籤 → **Projects** → 點 **→ New project**(或 **Create a project**)
4. 選擇模板:**Kanban**(或 "Team planning")
6. 填寫:
   - **Project name**:`cnamber-store Phase 0-6`
   - **Description**:`追蹤 Phase 0-6 進度,Kanban 4 欄視覺化`
7. 點 **Create**
8. 確認 4 個欄位存在:**Todo / In Progress / In Review / Done**

### 連結 Milestones 到 Project

1. 進入 Project → 上方 → **Settings**(齒輪)
2. 左側 → **Managed access**
3. 加 7 個 Milestones(phase-0 ~ phase-6)為「追蹤項目」
4. 確認每個 Milestone 在 Project 中顯示為卡片

### 設定自動化(可選,推薦)

- **Issue closed** → 自動移到 **Done** 欄
- **PR opened** → 自動移到 **In Review** 欄
- **Issue assigned** → 自動移到 **In Progress** 欄

---

## 3. Phase 1 待辦預告

Phase 1 開工時,我會自動接續處理(您不需手動操作):

1. **tunnel cnamber-llm 推毀重試**(等 active connections 關閉後)
2. **Astro 4.x SSR 設定**:`output: 'server'` + `@astrojs/cloudflare` adapter
3. **Workers API 起始**(Hono framework)
4. **D1 schema 設計**(products / variants / categories / users / orders)
5. **wrangler.toml 加上 D1 binding**
6. **Cloudflare Pages GitHub App 連接 repo**(自動部署)
7. **Vitest 測驗框架 + ESLint + Prettier + Husky**

---

## 4. 重要連結

- **GitHub repo**:https://github.com/shineday999/cnamber-store
- **Pages URL**:https://cnamber-store.pages.dev
- **Cloudflare zone**:`cnamber.ccwu.cc`(zone ID:`51853d10d3ec8448b2200e6bb17cfd2f`)
- **Cloudflare account**:`shineday999@gmail.com's Account`(ID:`0dbc642e2a4e49dc8515807e42d5f26d`)
- **舊 CRM tunnel**:`cnamber-llm`(待 Phase 1 推毀)
- **完整計劃書**:`https://github.com/shineday999/cnamber-store/blob/main/docs/spec.md`

---

## 5. 環境變數與 secrets(未來準備)

Phase 1+ 才會用到,先列出提醒:

| Secret | 用途 | Phase |
|---|---|---|
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Phase 4 |
| `STRIPE_SECRET_KEY` | Stripe | Phase 4 |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Phase 4 |
| `RESEND_API_KEY` | Email 交易信 | Phase 4 |
| `CLERK_PUBLISHABLE_KEY` | 認證 | Phase 5 |
| `CLERK_SECRET_KEY` | 認證 | Phase 5 |
| `SF_API_KEY` / `SF_API_SECRET` | SF International | Phase 4 |
| `ARAMEX_ACCOUNT_NUMBER` / `ARAMEX_USERNAME` | Aramex | Phase 4 |

---

## 6. Phase 0 結案驗收 Checklist

當您完成 #1 + #2 後,Phase 0 即正式收結案:

- [ ] DNS CNAME 設定完成(curl 驗證 cnamber.ccwu.cc 回 200)
- [ ] GitHub Project 板建立完成(4 欄 Todo/In Progress/In Review/Done)
- [ ] 7 個 Milestones 已連結到 Project
- [ ] (可選)設定自動化 rules

完成後,告訴我「Phase 0 完成」,我會立即開啟 Phase 1。