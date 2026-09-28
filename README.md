# cnamber-store

> 森林系手作品牌電商——琥珀飾品與香品,大東南亞+中東市場,六語在地化。

## 品牌定位(Placeholder)

- **品牌名**:「牛馬得飾」(placeholder,實作前 1 週定案)
- **視覺關鍵詞**:森林 / 綠樹 / 清新 / 自然 / 愜意 / 手作 / 通透 / 留白 / 東方禪意 / 歐美靜物電影感
- **目標市場**:大東南亞(馬/星/泰/印/菲)+ 中東 GCC
- **i18n**:簡中(預設)/ 繁中 / 英文 / 馬來西亞馬來語 / 印尼馬來語 / 阿語 RTL

## 技術棧

- **前台**:Astro 4.x + React 18 islands + TypeScript strict + Tailwind v3
- **後端**:Cloudflare Workers + Hono
- **資料庫**:Cloudflare D1(SQLite)
- **儲存**:Cloudflare R2(產品圖)+ KV(i18n 快取)
- **認證**:Clerk(Magic Link + Google / Apple / 微信)
- **支付**:Stripe + 東南亞本地錢包(Touch'n Go / GrabPay / Boost / PromptPay / OVO / DANA)
- **物流**:Aramex(中東)+ SF International(全球)
- **交易信**:Resend
- **監控**:Cloudflare Workers Analytics + Logs

## 開發

```bash
npm install              # 安裝依賴
npm run dev              # 開發伺服器 (http://localhost:4321)
npm run build            # 建構
npm run preview          # 預覽
npm run deploy           # 部署到 Cloudflare Pages
```

## 部署

- **dev**:`dev.cnamber.ccwu.cc`
- **staging**:`staging.cnamber.ccwu.cc`
- **prod**:`cnamber.ccwu.cc`(從 Travel Agency CRM 接手)

## 計劃書

完整 PRD 見 [`docs/spec.md`](./docs/spec.md)。

## 開發階段

- [ ] Phase 0:品牌定名 + 基礎建設
- [ ] Phase 1:基礎建設
- [ ] Phase 2:設計系統 + 商品資料
- [ ] Phase 3:互動路徑 + i18n
- [ ] Phase 4:支付 + 物流 + 訂單
- [ ] Phase 5:內容頁 + 部落格 + 會員
- [ ] Phase 6:QA + 上線

## License

MIT