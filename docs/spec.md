# 「牛馬得飾」v1 完整計劃書

> **狀態**:討論完成,等待您下令開工
> **建立日期**:2026-09-28
> **品牌名**:「牛馬得飾」(placeholder,實作前 1 週定案)
> **文件位置**:`/home/abc/.claude/temp/niumade-store-plan.md`

---

## 1. 專案總覽

### 1.1 一句話定位

一個面向**大東南亞與中東 GCC**的森林系手作品牌電商,銷售**琥珀飾品 + 香品**,以**六語在地化**、**兩條互動推薦路徑**(臉型/個性、困擾/目的)、**歐美靜物電影感視覺**為三大差異化。

### 1.2 三大差異化

1. **視覺語言**:森林綠 + 米白 + 琥珀金點綴,留白、東方禪意、歐美靜物電影感
2. **互動路徑**:飾品問答(臉型+個性)、香品問答(困擾+目的),純規則式推薦矩陣
3. **在地化深度**:六語(`zh-Hans` / `zh-Hant` / `en` / `ms-MY` / `ms-ID` / `ar` RTL,完整在地化不只是翻譯)

### 1.3 目標市場

- **大東南亞**:馬來西亞、新加坡、泰國、印尼、菲律賓
- **中東**:UAE、沙烏地阿拉伯、科威特、卡達(GCC 主要四國)
- **i18n 涵蓋**:上述所有市場的主要語言

### 1.4 商品線

- **琥珀飾品**:項鍊、手鍊、耳環、戒指、手串
- **香品**:線香、香膏、精油、薰香器具

### 1.5 時程總覽

- **v1 一次交付**,不趕檔期
- **總預估工期**:14-15 週(Phase 0-6)

---

## 2. 技術架構

### 2.1 Cloudflare 全家桶配置

```
┌─────────────────────────────────────────────────┐
│  Cloudflare Edge                              │
│  ┌────────────┐  ┌─────────────┐  ┌────────┐  │
│  │ Pages      │  │ Workers     │  │ Tunnel │  │
│  │ (Astro SSG)│  │ (API/SSR)   │  │ (CRM   │  │
│  │ + React    │  │ + Workers AI│  │  讓出) │  │
│  │  islands)  │  │             │  │        │  │
│  └─────┬──────┘  └──────┬──────┘  └────────┘  │
│        │                │                     │
│  ┌─────┴────────────────┴─────┐               │
│  │  D1 (Postgres-like, SQLite)│  KV (i18n)   │
│  │  R2 (產品圖)              │  Analytics   │
│  └────────────────────────────┘               │
└─────────────────────────────────────────────────┘
```

### 2.2 技術棧明細

| 層       | 技術                                         | 用途                                                 |
| -------- | -------------------------------------------- | ---------------------------------------------------- |
| 前台框架 | **Astro 4.x + React 18 islands**             | SSG 為主,互動元件(client islands)                    |
| 後端     | **Cloudflare Workers + Hono**                | REST API、SSR、Astro endpoints                       |
| 資料庫   | **Cloudflare D1**(SQLite)                    | 商品、訂單、會員、文章                               |
| 物件儲存 | **Cloudflare R2**                            | 產品圖、品牌圖、部落格圖(搭配 Images 變體)           |
| KV       | **Workers KV**                               | i18n 翻譯快取、sitemap 快取                          |
| 認證     | **Clerk**(推薦)                              | Magic Link、Google、Apple、微信                      |
| 交易信   | **Resend**                                   | 訂單確認、出貨、到貨、評價請求                       |
| 支付     | **Stripe** + 東南亞本地錢包                  | 國際卡 + Touch'n Go/GrabPay/Boost/PromptPay/OVO/DANA |
| 物流     | **Aramex**(中東)+ **SF International**(全球) | 跨境物流、即時運費 API                               |
| 監控     | **Cloudflare Workers Analytics + Logs**      | 部署後維運                                           |
| CI/CD    | **GitHub Actions + Wrangler**                | PR preview、main deploy                              |

### 2.3 環境分離

- **dev**:本地 + `dev.cnamber.ccwu.cc`
- **staging**:`staging.cnamber.ccwu.cc`(PR preview 用 Workers for Platforms)
- **prod**:`cnamber.ccwu.cc`(讓出後,CRM 自行遷移)

### 2.4 部署管線

1. GitHub PR → Cloudflare Pages 自動 preview
2. PR merge to main → Workers/Pages 部署到 production
3. Workers secret 透過 `wrangler secret put` 管理
4. D1 遷移:`wrangler d1 migrations apply`

### 2.5 域名處理(關鍵)

- **現狀**:`cnamber.ccwu.cc` 由 Travel Agency CRM tunnel 使用(memory:4 edge connected)
- **決定**:CRM 放棄使用,新網站完全接手
- **行動**:
  - DNS record 從 CRM 服務改指新網站
  - Tunnel 重新設定(若 CRM 仍需保留,可建新 tunnel `crm-cnamber.ccwu.cc`)
  - **不在本計劃書範圍**:CRM 端遷移計畫,需另行安排

---

## 3. i18n 與在地化(六語)

### 3.1 六個 locale

| Locale    | 語言           | 主要市場                       | 字體                         |
| --------- | -------------- | ------------------------------ | ---------------------------- |
| `zh-Hans` | 簡體中文(預設) | 中國、東南亞華人、中東華人     | Noto Sans SC + Noto Serif SC |
| `zh-Hant` | 繁體中文       | 馬/星華人、台灣、港澳          | Noto Sans TC + Noto Serif TC |
| `en`      | 英文           | 國際、UAE 非阿語用戶、GCC 主要 | Inter                        |
| `ms-MY`   | 馬來西亞馬來語 | 馬、星、汶萊                   | Inter(拉丁字母)              |
| `ms-ID`   | 印尼馬來語     | 印尼                           | Inter(拉丁字母)              |
| `ar`      | 阿拉伯語       | GCC 主要四國                   | Noto Naskh Arabic            |

### 3.2 雙中文策略

- **內容雙手動翻譯**:`zh-Hans` 與 `zh-Hant` 各自獨立維護
- **馬/星華人關鍵詞手動對照表**(不超過 30 個詞):例如「程序」→「流程」、「內存」→「記憶體」
- **不採 OpenCC 字型轉換**:馬/星華人對簡轉繁的「台式慣用詞」接受度不一

### 3.3 馬/印分離策略

- **兩套翻譯檔**:`ms-MY.json`、`id.json`(嚴格按 locale tag 區分)
- **內容差異點**:
  - 用詞:`kereta`(馬)/`mobil`(印)、`bilik`(馬)/`kamar`(印)
  - 敬語層級:馬來西亞較正式(`awak`、`saya`、`cik`)
  - 貨幣:馬幣 `RM` 與印尼盾 `Rp` 分別標示
- **預估工作量**:`ms-MY` ~80% 內容可重用於 `id`,但需逐一覆核

### 3.4 阿語 RTL 完整實作

- **CSS**:`dir="rtl"` 切換,Flexbox/Grid 反向
- **字體**:Noto Naskh Arabic(標題)、Inter(拉丁字符混排)
- **導航**:右側開始、返回箭頭反向
- **數字**:可選 `arabic` 或 `latn`(預設 latn,符合 GCC 商務慣例)
- **Logo**:需有 RTL 版本(若含文字)
- **內容翻譯**:由專業阿語翻譯提供(計畫書預算章節列入)

### 3.5 hreflang 結構

```html
<link
  rel="alternate"
  hreflang="zh-Hans"
  href="https://cnamber.ccwu.cc/zh-Hans/..."
/>
<link
  rel="alternate"
  hreflang="zh-Hant"
  href="https://cnamber.ccwu.cc/zh-Hant/..."
/>
<link rel="alternate" hreflang="en" href="https://cnamber.ccwu.cc/en/..." />
<link
  rel="alternate"
  hreflang="ms-MY"
  href="https://cnamber.ccwu.cc/ms-MY/..."
/>
<link
  rel="alternate"
  hreflang="ms-ID"
  href="https://cnamber.ccwu.cc/ms-ID/..."
/>
<link rel="alternate" hreflang="ar" href="https://cnamber.ccwu.cc/ar/..." />
<link
  rel="alternate"
  hreflang="x-default"
  href="https://cnamber.ccwu.cc/zh-Hans/..."
/>
```

### 3.6 翻譯流程

- **i18n key 結構**:namespaced(`product.title`, `nav.home`, `quiz.step1.q1`)
- **翻譯來源**:
  - `zh-Hans`:原生(您提供)
  - `zh-Hant`:原生(您提供)
  - `en`:您提供 + Grammarly 校稿
  - `ms-MY`/`ms-ID`:馬來西亞/印尼母語譯者(Fiverr/Upwork)
  - `ar`:阿語母語譯者(同上)
- **翻譯記憶庫**:Cloudflare KV 快取已翻譯字串,新增內容僅翻增量

---

## 4. 設計系統

### 4.1 色板 token

```css
/* 主色:森林綠 */
--color-primary-900: #1a2e1a; /* 最深森林(標題背景) */
--color-primary-700: #2d4a2b; /* 深森林(主要按鈕) */
--color-primary-500: #4a6b47; /* 中森林(連結) */
--color-primary-300: #8fa88c; /* 淺森林(輔助) */
--color-primary-100: #dce5dc; /* 極淺森林(背景) */

/* 背景:米白 */
--color-bg-base: #f5f1e8; /* 主背景(米白) */
--color-bg-card: #faf8f2; /* 卡片背景 */
--color-bg-elevated: #ffffff; /* 浮層背景 */

/* 點綴:琥珀金 */
--color-accent-700: #8c6b3e; /* 深琥珀(品牌強調) */
--color-accent-500: #c9925b; /* 中琥珀(價格、徽章) */
--color-accent-300: #e0bd93; /* 淺琥珀(分隔線) */

/* 文字 */
--color-text-primary: #1f2a1e; /* 主要文字(深炭) */
--color-text-secondary: #4a5748; /* 次要文字 */
--color-text-muted: #8a938a; /* 提示文字 */

/* 狀態 */
--color-success: #4a7c59; /* 自然綠 */
--color-warning: #c9925b; /* 琥珀橙 */
--color-error: #a85751; /* 溫潤紅棕 */
```

### 4.2 字體配對

| 用途    | 簡中/繁中          | 英文/馬/印 | 阿語                   |
| ------- | ------------------ | ---------- | ---------------------- |
| 標題    | Noto Serif SC / TC | Inter(700) | Noto Naskh Arabic(700) |
| 內文    | Noto Sans SC / TC  | Inter(400) | Noto Naskh Arabic(400) |
| UI/數字 | Inter              | Inter      | Inter                  |

**字體載入策略**:`font-display: swap` + Cloudflare R2 自託管(子集化)

### 4.3 留白與節奏

- **行高**:1.8(內文)、1.2(標題)
- **章節間距**:96-128px(慷慨留白)
- **卡片圜度**:12px
- **陰影**:`0 4px 24px rgba(45, 74, 43, 0.08)`(柔自然陰影)

### 4.4 攝影風格

- **背景**:自然光、米白/木質/森林場景
- **產品**:歐美靜物電影感、淺景深、暖色調
- **後製**:降低飽和、提高暖色調、保留細節
- **規範**:計畫書附件「拍攝指南」(長寬比、背景、後製)

### 4.5 阿語 RTL 設計考量

- **Logo 反向**(若含裝飾元素)
- **電話號碼、地址格式調整**
- **購物車 icon** 鏡像(由右至左)

### 4.6 深色模式策略

- **v1 不做深色模式**(森林系白天體驗已足,深色模式增加設計/測試工作量)
- **CSS 架構預留**:`prefers-color-scheme` 變數結構,日後加 dark theme

---

## 5. 商品資料模型

### 5.1 D1 Schema(核心表)

```sql
-- 商品
CREATE TABLE products (
  id TEXT PRIMARY KEY,           -- prod_<uuid>
  category TEXT NOT NULL,        -- 'jewelry' | 'incense'
  subcategory TEXT,              -- 'necklace' | 'bracelet' | ... | 'stick' | 'balm' | ...
  slug TEXT NOT NULL,
  status TEXT DEFAULT 'draft',   -- 'draft' | 'active' | 'archived'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 商品翻譯(多語)
CREATE TABLE product_translations (
  product_id TEXT NOT NULL,
  locale TEXT NOT NULL,          -- 'zh-Hans' | 'en' | ...
  name TEXT NOT NULL,
  description TEXT NOT NULL,     -- Markdown
  short_description TEXT,
  story TEXT,                    -- 品牌故事延伸
  meta_title TEXT,
  meta_description TEXT,
  PRIMARY KEY (product_id, locale),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 商品變體(SKU)
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,           -- var_<uuid>
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  attributes TEXT NOT NULL,      -- JSON: {color: 'green', size: 'M'}
  stock INTEGER NOT NULL DEFAULT 0,
  weight_grams INTEGER,
  price_base TEXT NOT NULL,      -- base currency (USD)
  image_urls TEXT NOT NULL,      -- JSON array of R2 URLs
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 多幣別定價(以當地幣別標示)
CREATE TABLE product_prices (
  variant_id TEXT NOT NULL,
  currency TEXT NOT NULL,        -- 'MYR' | 'SGD' | 'THB' | 'IDR' | 'PHP' | 'AED' | 'SAR'
  amount INTEGER NOT NULL,       -- 以最小單位儲存(sen/cents)
  tax_included INTEGER NOT NULL DEFAULT 1,  -- 是否含稅
  PRIMARY KEY (variant_id, currency),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- 分類
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  slug TEXT NOT NULL,
  display_order INTEGER,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE category_translations (
  category_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (category_id, locale)
);

-- 問答規則矩陣
CREATE TABLE quiz_rules (
  id TEXT PRIMARY KEY,
  quiz_type TEXT NOT NULL,       -- 'jewelry' | 'incense'
  attributes TEXT NOT NULL,      -- JSON: {face_shape: 'oval', personality: 'calm'}
  product_ids TEXT NOT NULL,     -- JSON array, ordered by score
  weights TEXT NOT NULL,         -- JSON: {prod_id: score}
  PRIMARY KEY (quiz_type, attributes)  -- composite via attributes JSON
);
```

### 5.2 多幣別策略

**目標幣別(7 種)**:

- `MYR`(馬幣)、`SGD`(新幣)、`THB`(泰銖)、`IDR`(印尼盾)、`PHP`(菲律賓披索)
- `AED`(阿聯酋迪拉姆)、`SAR`(沙烏地里亞爾)

**定價邏輯**:

- `price_base` 以 USD 儲存
- 各幣別價格由後台手動設定(預設依即時匯率換算 ± 5% 利潤緩衝)
- 顯示邏輯:商品頁顯示該幣別「含稅」價格,結帳時依收件地重新計算稅金

### 5.3 庫存管理

- **單一倉庫**:中國遼寧撫順
- **出口口岸**:大連港(海運)/瀋陽桃仙機場(空運)— 待您覆核
- **跨境稅務**:免稅出口(電商不收進口稅,由收件人付)
- **退款逆向物流**:撫順倉 → SF International 退運倉

### 5.4 評價系統

- **僅已購買者可評**:訂單狀態 `delivered` 後 7 天發評價請求信(Resend)
- **評價內容**:1-5 星 + 文字(最多 500 字)+ 可選圖片(最多 3 張)
- **審核**:管理者後台審核後顯示(防垃圾)
- **資料表**:`reviews` (id, product_id, user_id, order_id, rating, content, images, status, created_at)

---

## 6. 兩條互動路徑

### 6.1 飾品問答(臉型+個性)

**5 步流程**:

```
Step 1: 臉型選擇
  → 橢圓形 / 圓形 / 方型 / 長型 / 心型 / 鑽石型

Step 2: 膚色色調
  → 冷調(藍/紫底) / 暖調(黃/橙底) / 中性

Step 3: 個性偏好
  → 沉穩內斂 / 自由奔放 / 神秘深邃 / 清新自然 / 經典優雅

Step 4: 場合偏好
  → 日常通勤 / 正式場合 / 戶外自然 / 紀念贈禮

Step 5: 材質偏好(可選)
  → 純琥珀 / 琥珀+木 / 琥珀+金屬 / 不拘
```

**推薦演算法**:

- 規則矩陣預存在 `quiz_rules` 表
- 每個產品根據規則加權打分
- 顯示前 6 名(由高到低)
- 每個推薦附 1-2 句「為什麼推薦」解釋(預寫文案,i18n key)

### 6.2 香品問答(困擾+目的)

**5 步流程**:

```
Step 1: 目前困擾(可複選)
  → 焦慮失眠 / 工作疲憊 / 心情低落 / 空間沉悶 / 尋找平靜 / 提振專注

Step 2: 期望達到的目的(可複選)
  → 放鬆 / 入睡 / 冥想 / 提神 / 淨化空間 / 提升專注

Step 3: 香品形式
  → 線香 / 香膏 / 精油 / 薰香器具

Step 4: 使用時段
  → 早晨 / 午後 / 傍晚 / 睡前 / 全天

Step 5: 香味偏好(可選)
  → 木質調 / 花香調 / 草本調 / 琥珀/樹脂 / 不拘
```

**推薦邏輯**:同飾品,規則矩陣 + 加權評分

### 6.3 結果頁 UX

```
┌─────────────────────────────────────┐
│  「根據你的選擇,我們推薦:」         │
│  (i18n key: quiz.result.title)     │
├─────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐            │
│  │ 1  │  │ 2  │  │ 3  │            │
│  └────┘  └────┘  └────┘            │
│  ┌────┐  ┌────┐  ┌────┐            │
│  │ 4  │  │ 5  │  │ 6  │            │
│  └────┘  └────┘  └────┘            │
├─────────────────────────────────────┤
│  「為什麼推薦:」                    │
│  [產品 1 解釋]                      │
│  [產品 2 解釋]                      │
├─────────────────────────────────────┤
│  [重新測驗] [看更多飾品]           │
└─────────────────────────────────────┘
```

### 6.4 問答資料保存

- **匿名訪客**:結果存於 KV,7 天有效(可 Email 寄送結果連結)
- **登入會員**:存於 `quiz_results` 表,可隨時查歷史結果

---

## 7. 內容頁與部落格

### 7.1 品牌故事頁(5-6 頁)

| 頁面     | Slug         | 內容                    |
| -------- | ------------ | ----------------------- |
| 品牌故事 | `/story`     | 創辦理念、森林/手作連結 |
| 琥珀物語 | `/amber`     | 琥珀來源、形成、產地    |
| 香品哲學 | `/incense`   | 香文化、東方禪意        |
| 材質來源 | `/materials` | 木質、琥珀等級、金屬    |
| 手作工藝 | `/craft`     | 製作過程、工匠故事      |
| 願景     | `/vision`    | 永續、文化傳承          |

### 7.2 部落格系統

- **後台**:D1 + 自建簡單 CMS(文章 CRUD、標籤、預覽、發佈)
- **前台**:SSG 生成,每篇文章 6 語版
- **內容類型**(預設):
  - 材質知識(琥珀科學、香文化)
  - 製作日誌(工匠紀錄)
  - 風格指南(飾品搭配、香品使用情境)
  - 文化故事(東方禪意、自然)
- **SEO**:自動 sitemap、結構化資料 `BlogPosting`
- **頻率**:v1 上線後每月 2-4 篇

### 7.3 多語內容流程

- 後台每篇文章有 6 個 locale tab
- 任一 locale 完成即可發佈,未完成的 locale 顯示 fallback(英文)
- 「語言完成度」後台指標

---

## 8. 支付與物流

### 8.1 支付整合

**Stripe + Payment Methods**:

- **國際卡**:Visa / Mastercard / Amex / JCB
- **Apple Pay / Google Pay**
- **東南亞本地錢包**(透過 Stripe):
  - `my`:Touch'n Go eWallet、Boost
  - `sg`:GrabPay
  - `th`:PromptPay
  - `id`:OVO、DANA
  - `ph`:GCash(若 Stripe 支援)

### 8.2 物流整合

**中東(GCC)**:

- **Aramex**:API 即時運費、預約取件、追蹤
- 預計運費 zone:阿聯酋、沙烏地、科威特、卡達

**馬/星/全球**:

- **SF International**:API 即時運費、跨境清關、追蹤
- 馬、星、泰、印、菲

### 8.3 運費 zone 表(待您覆核具體金額)

| Zone | 地區                           | 預設運費(USD) | 預計到貨天數 |
| ---- | ------------------------------ | ------------- | ------------ |
| Z1   | 馬、星                         | 8             | 5-7          |
| Z2   | 泰、印、菲                     | 12            | 7-10         |
| Z3   | GCC(阿聯酋/沙烏地/科威特/卡達) | 18            | 7-14         |
| Z4   | 其他中東                       | 25            | 14-21        |

> 預設運費僅為初估,實作前由 SF International 與 Aramex 報價最終定案。

### 8.4 稅務處理(已確認:含稅顯示)

**顯示策略**:

- **商品頁**:以當地幣別顯示「含稅」價格(預先內含)
- **結帳頁**:依收件地重新計算
  - 馬來西亞 SST 10%
  - 印尼 PPN 11%
  - 菲律賓 VAT 12%
  - UAE VAT 5%
  - 沙烏地 VAT 15%
  - 新加坡 GST 9%(2026 起)
  - 泰國 VAT 7%
- **跨境進口稅**:由收件人於清關時支付(電商免稅出口)

---

## 9. 訂單流程

### 9.1 訂單狀態機

```
pending
  → paid(Stripe webhook)
    → processing(倉庫備貨)
      → shipped(取得 tracking,發出貨信)
        → delivered(物流商 webhook 或手動確認)
          → completed(7 天後自動,或客戶主動確認)
            → reviewed(已撰寫評價)

退款:
completed → refund_requested → refunding → refunded
```

### 9.2 Email 通知(Resend,僅交易信)

| 觸發                 | 模板               | i18n 6 語 |
| -------------------- | ------------------ | --------- |
| 訂單建立             | `order_created`    | ✓         |
| 付款成功             | `order_paid`       | ✓         |
| 商品出貨             | `order_shipped`    | ✓         |
| 預計到貨提醒         | `order_arriving`   | ✓         |
| 已到貨               | `order_delivered`  | ✓         |
| 評價請求(到貨 +7 天) | `review_request`   | ✓         |
| 退款申請確認         | `refund_requested` | ✓         |
| 退款完成             | `refund_completed` | ✓         |

### 9.3 退款流程(7 天有條件退貨)

**規則**:

- **7 天內**且**未拆封**商品可退貨
- 香品(線香、香膏、精油)**不退**(衛生因素)
- 客製商品**不退**
- 退貨運費:買家付

**流程**:

1. 客戶 Email 申請 → 後台建立退款單
2. 客戶寄回(提供 tracking)→ 後台確認收到
3. 檢驗商品 → 確認退款
4. Stripe refund API → 5-10 工作天到帳
5. 退款完成 Email

---

## 10. 會員中心

### 10.1 認證方式

**Magic Link(無密碼)**:

- 輸入 Email → 收一次性登入連結(15 分鐘有效)

**社群登入(透過 Clerk)**:

- Google
- Apple
- 微信(中國/東南亞華人)

### 10.2 會員功能

| 功能     | 說明                        |
| -------- | --------------------------- |
| 訂單歷史 | 訂單狀態查詢、物流追蹤連結  |
| 願望清單 | 儲存有興趣的商品            |
| 評價管理 | 查看自己寫過的評價          |
| 個人資料 | 姓名、地址、Email、語言偏好 |
| 問答歷史 | 已做過的飾品/香品問答結果   |

### 10.3 不做的功能(v2 再考慮)

- 會員等級 / 積分
- 生日禮
- 推薦碼

---

## 11. SEO 與分析

### 11.1 SEO 策略

- **hreflang**:六語完整標記
- **Sitemap**:動態生成,六語版本
- **robots.txt**:六語 sitemap 索引
- **Schema.org**:
  - `Product`(含價格、評價)
  - `Organization`(品牌)
  - `BlogPosting`(文章)
  - `BreadcrumbList`
  - `WebSite`(含 `SearchAction`)

### 11.2 站內搜尋(建議)

- **Workers + D1 FTS5**(全文搜尋,中文用 `jieba-wasm` 分詞)
- 不使用 Algolia(免費額度內可處理初期資料量)

### 11.3 分析(已確認:純 Cookie-free)

- **Cloudflare Web Analytics**(隱私友善、無 cookie banner)
- **Workers Analytics**(伺服器端事件)
- **不放 GA4 / Meta Pixel**(符合純 Cookie-free 決定)

---

## 12. 法務與合規

### 12.1 隱私政策

- **馬來西亞 PDPA 2010**
- **新加坡 PDPA 2012**
- **UAE PDPL**(2021 生效)
- **印尼 PDP Law**(2022)
- **泰國 PDPA**(2022 修訂)

### 12.2 退款政策(已確認)

- 7 天有條件退貨
- 商品頁明確標示「香品 / 客製商品不退」
- 客服 Email:`hello@cnamber.ccwu.cc`

### 12.3 Cookie 政策

- **純 Cookie-free**:不需要同意橫幅
- 但仍提供 Cookie 政策頁(說明使用情境為零)

### 12.4 中東齋戒月處理

- 齋戒月期間行銷暫停(尊重習俗)
- 配送時間延長預告
- 開齋節檔期促銷(可在開齋後 3-5 天開始)

---

## 13. 開發階段與時程

| Phase       | 名稱                       | 工時 | 主要產出                                  |
| ----------- | -------------------------- | ---- | ----------------------------------------- |
| **Phase 0** | 品牌定名 + Logo + 基礎準備 | 1 週 | 品牌名確認、Logo、域名 SSL 設定           |
| **Phase 1** | 基礎建設                   | 2 週 | Astro 專案、Workers API、D1 schema、CI/CD |
| **Phase 2** | 設計系統 + 商品資料        | 3 週 | Design tokens、商品 CRUD、6 語商品上架    |
| **Phase 3** | 互動路徑 + i18n            | 3 週 | 兩條問答路徑、6 語切換、阿語 RTL          |
| **Phase 4** | 支付 + 物流 + 訂單         | 3 週 | Stripe 整合、SF/Aramex 整合、訂單流程     |
| **Phase 5** | 內容頁 + 部落格 + 會員     | 2 週 | 5-6 品牌頁、部落格後台、Clerk 認證        |
| **Phase 6** | QA + 上線                  | 1 週 | 多語測試、跨境測試、SSL/DNS 設定          |

**總計:15 週**

### 13.1 Phase 0 細節

- **品牌定名**:實作前 1 週由您決定(本計劃書預留彈性)
- **Logo 設計**:由您提供或由 imagegen skill 協助
- **域名 SSL**:`cnamber.ccwu.cc` 從 CRM 遷移後,Cloudflare 自動 SSL

### 13.2 關鍵里程碑

- **M1(Phase 1 結束)**:可看到首頁 + 6 語切換(無商品)
- **M2(Phase 2 結束)**:可看到商品頁 + 加入購物車(無結帳)
- **M3(Phase 4 結束)**:可下單 + 付款 + 收到訂單確認信
- **M4(Phase 6 結束)**:正式上線

---

## 14. 風險與緩解

| 風險                               | 影響           | 緩解                                              |
| ---------------------------------- | -------------- | ------------------------------------------------- |
| CRM tunnel 遷移延遲                | 新網站部署卡住 | CRM 另行遷移計畫,本計劃書預設 CRM 已遷移          |
| 撫順倉 → 東南亞/中東運費過高       | 利潤壓縮       | Phase 4 報價後評估,必要時改雙倉(撫順+香港轉運)    |
| 阿語翻譯品質不佳                   | GCC 體驗差     | 母語譯者 + 校稿流程,Phase 3 早期驗證              |
| Stripe 東南亞本地錢包可用性變動    | 支付失敗       | 監控 Stripe 公告,預備 PayPal / 2Checkout fallback |
| Workers 免費額度超限               | 額外費用       | Workers Paid($5/月起),Phase 6 上線前升級          |
| SF International / Aramex API 變更 | 整合斷裂       | 鎖版本,監控公告,預備抽象層                        |
| 香品跨境海關檢疫(印尼/泰嚴格)      | 包裹退運       | 提前確認成分,標示清楚                             |
| 中東齋戒月期間行銷暫停             | 行銷節奏中斷   | 預先排程,避開齋月                                 |

---

## 15. 待您覆核的後續細節

以下項目不影響計劃書骨架,但實作開始前需要您表態或決定:

### 15.1 倉庫/物流(細節)

- [ ] 撫順倉 → 出口口岸:**大連港(海運) + 瀋陽桃仙機場(空運)** 是否接受?
- [ ] 是否考慮雙倉(撫順主力 + 香港轉運)?目前預設單倉。
- [ ] 運費 zone 表的具體金額(待 SF International + Aramex 報價)

### 15.2 技術執行

- [ ] 站內搜尋方案:**Workers + D1 FTS5**(免費額度內)是否接受?
- [ ] 錯誤監控:**Workers Analytics + Workers Logs**(免費)是否接受?是否要加 Sentry?
- [ ] 客服 Email:**`hello@cnamber.ccwu.cc`** 是否接受?
- [ ] 是否需要**預先生成內容**(部落格預先寫 4-6 篇 SEO 文章)?

### 15.3 CRM 遷移協助

- [ ] CRM 從 `cnamber.ccwu.cc` 遷出的時程?
- [ ] 是否需要保留 CRM 端的舊連結 redirect?(可在新 tunnel 上加 redirect rules)

### 15.4 內容與品牌

- [ ] 實作前 1 週的品牌命名時程表
- [ ] 是否預約阿語翻譯者?(建議 Phase 3 開始時確認)
- [ ] 是否預約馬/印翻譯者?
- [ ] Logo 是否需要多版本(簡中/英文/阿語 RTL)?

### 15.5 行銷準備

- [ ] 預計 v1 上線日(影響齋戒月、開齋節、雙 11、聖誕檔期規劃)
- [ ] 是否需要預先準備 Meta 廣告帳號/粉絲頁(雖不接 Pixel,但仍要粉絲頁)?

---

## 16. 月費/成本預估(v1 上線後)

| 項目                    | 預估月費(USD)   | 備註                         |
| ----------------------- | --------------- | ---------------------------- |
| Cloudflare Workers Paid | $5              | 基本方案,超額按用量          |
| Cloudflare D1           | ~$5             | 100M reads、1M writes/月後   |
| Cloudflare R2           | ~$3             | 10GB 儲存、1M Class A ops 後 |
| Cloudflare KV           | ~$1             | 少量 i18n 快取               |
| Resend                  | $20             | 50K emails/月(Pro)           |
| Stripe                  | 2.9% + $0.30/筆 | 交易手續費,非月費            |
| Clerk                   | $25             | 10K MAUs 後(可先免費)        |
| **合計月費**            | **~$59/月**     | 初期流量                     |

> 流量成長後,Workers + R2 用量增加,可能升至 $100-200/月。
> 阿語 / 馬/印翻譯者一次性費用預估:**$800-1500 USD**(取決於字數)。

---

## 17. 下一步

**請您檢視本計劃書後告訴我**:

1. 上述 15.x 待覆核項目中,有任何想現在就決定的嗎?
2. 計劃書章節中,有任何想調整或補充的嗎?
3. **確認後,我會等您下令「開工」才會進入實作階段**(依照您的指示「沒有我的命令不准開工」)。

---

## 附錄 A:參考記憶

本計劃書參考了以下記憶中的專案脈絡:

- Travel Agency CRM(v2.0u/v cycle,Cloudflare 全家桶實作經驗)
- Travel Agency CRM Cloudflare Tunnel SOP(`cnamber.ccwu.cc` tunnel)
- Travel Agency CRM partial build recovery SOP(Next.js 建置注意事項)

---

**版本歷史**

- v0.1(2026-09-28):初版,基於 28 題決策討論
