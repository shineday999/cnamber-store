# Phase 1 — Cloudflare Access 設定手冊

> **狀態**:Phase 1 用戶操作步驟,完成後 `/admin/*` 才有保護
> **建立**:2026-09-29

---

## 為什麼需要

- `/admin/*` 路徑要擋掉非管理員存取
- Cloudflare Access 提供免費(< 50 帳號)zero-trust 認證
- DB 只存 admin_users 的角色/顯示名,**不存密碼**(認證走 CF Access)

---

## 操作步驟(預計 5 分鐘)

### 1. 建立 Access Application

1. 登入 Cloudflare Dashboard:https://one.dash.cloudflare.com
2. 左側選單 → **Access** → **Applications**
3. 點 **Add an application** → 選 **Self-hosted**
4. 填寫:
   - **Application name**:`cnamber-store-admin`
   - **Session duration**:`24 hours`
   - **Application domain**:`cnamber.ccwu.cc`
   - **Path**:`/admin*`(自動帶入)
5. 點 **Next**

### 2. 設定 Policy(誰可以進)

1. **Policy name**:`admins-only`
2. **Action**:**Allow**
3. **Session settings**:維持預設
4. **Assign a group or identity**:
   - 選 **Emails**
   - 填入您的 email:`shineday999@gmail.com`
5. 點 **Next** → **Add application**

### 3. 設定 Identity providers(預設應該已 OK)

- Cloudflare Access 預設用 email OTP(收一次性登入信)
- 若要加 Google / GitHub OAuth,到 Settings → Authentication

---

## 驗證

完成後:

1. 訪問 `https://cnamber.ccwu.cc/admin`(即使 Phase 1 還沒 admin 內容)
2. 應自動跳轉到 CF Access login 頁
3. 輸入您的 email → 收到 OTP 信
4. 輸入 OTP → 進入(會看到 404,但保護機制已生效)

---

## 後續

- Phase 2 admin 模組上線後,`admin_users` 表格會儲存額外的角色(`super_admin` / `editor` / `viewer`)
- Phase 1 末我會在程式碼加 `locals.admin` 注入(透過 Cloudflare JWT headers)

---

## 替代方案(若不想要 OTP 流程)

- **Service Token**:可建立 machine user(Phase 1 不需要)
- **Auth provider**:改用 Clerk(已從 PRD 砍掉,Phase 5 再考慮)

---

## 常見問題

- **Access 是免費的嗎?** 50 帳號內免費
- **可以多管理員嗎?** 可以,在 Policy 加多個 email
- **可以綁定 Google 嗎?** 可以,Settings → Authentication → Add new → Google Workspace(需您 Google Workspace 設定)

---

完成後告訴我「Access 設定完成」,我會在 Phase 2 admin 模組開發時對接。
