# cnamber-store 設計系統 v1

> 對齊用戶 brief:自然動感 / 手作 / 通透 / 留白 / 東方禪意 + 歐美靜物電影感
> **不要拖太長** — 首頁 4 區塊、產品頁 2 區塊。

---

## 1. 配色方案(Color Palette)

**核心原則**:大地色 + 低飽和森林綠,**不用純白**,主色給人「手工紙 + 霧感森林」。

### Forest(主色,低飽和度森林綠)

| Token        | Hex       | 用途                     |
| ------------ | --------- | ------------------------ |
| `forest-50`  | `#F2EFE5` | 紙感背景基底             |
| `forest-100` | `#DDD8C7` | 米白/亞麻                |
| `forest-200` | `#BFB89E` | 沙岩 / 邊框              |
| `forest-300` | `#9A9175` | 描邊文字                 |
| `forest-400` | `#73704D` | 次要文字                 |
| `forest-500` | `#4F5C36` | **Moss Green**(主品牌色) |
| `forest-600` | `#3D4828` | 深 moss                  |
| `forest-700` | `#2D3520` | 森林背景                 |
| `forest-800` | `#1F2615` | Hero 深色底              |
| `forest-900` | `#161A0F` | 最深                     |

### Cream(背景,暖手工紙)

| Token       | Hex       | 用途                      |
| ----------- | --------- | ------------------------- |
| `cream-50`  | `#FAF7EE` | 卡片底 / 主背景(替代純白) |
| `cream-100` | `#F2EDDF` | 次背景                    |
| `cream-200` | `#E8E2D0` | 邊框 / 分隔線             |
| `cream-300` | `#D8D1BB` | 弱分隔                    |

### Terra(陶土 / 暖砂點綴)

| Token       | Hex       | 用途                            |
| ----------- | --------- | ------------------------------- |
| `terra-300` | `#D29E7B` | 裝飾                            |
| `terra-500` | `#A45E3D` | **Terracotta**(CTA hover、強調) |
| `terra-700` | `#5F3220` | 深棕                            |

### Bamboo(竹青通透色,極少用)

| Token        | Hex       | 用途     |
| ------------ | --------- | -------- |
| `bamboo-400` | `#6F9353` | 點綴     |
| `bamboo-500` | `#4F7A38` | 罕用強調 |

### Stone(冷灰輔助)

| Token       | Hex       | 用途     |
| ----------- | --------- | -------- |
| `stone-400` | `#8B8275` | 弱化文字 |
| `stone-600` | `#4A4538` | 邊框暗   |

### ❌ 不用

- `#FFFFFF`(純白)— 太亮,破壞手工紙感
- 高飽和綠(像森林 #228B22)— 太「可愛」不夠霧感
- 高飽和琥珀 — 點綴用 `terra-500` 已夠

---

## 2. 字體

### 標題(英文):**Cormorant Garamond**

- 古典義式襯線,纖細高對比
- Light/Regular weight 給大標題,Italic 給副標
- 透過 Google Fonts CDN 載入(`wght@300;400;500;700`)

### 標題(中文):**Noto Serif SC** + **思源宋體 TC**

- 已有載入
- Weight: 300 / 400 / 500 / 700
- TC 給馬星華人市場

### 內文:**Inter**(無襯線,清晰)

- Weight: 300 / 400 / 500
- 用於 description、按鈕文字、kicker label

### 排版尺寸

| 元素        | size                               | line-height | tracking               |
| ----------- | ---------------------------------- | ----------- | ---------------------- |
| Hero 主標題 | `text-5xl md:text-7xl lg:text-8xl` | `1.05`      | `-0.02em`              |
| 區塊標題    | `text-3xl md:text-5xl`             | `1.15`      | `-0.01em`              |
| 副標        | `text-xl italic`                   | `1.4`       | `0`                    |
| 內文        | `text-base`                        | `1.85`      | `0`(東方禪意寬鬆行高)  |
| Kicker      | `text-xs uppercase`                | `1`         | `0.4em`(間距寬,奢牌感) |
| 按鈕        | `text-sm font-medium`              | `1`         | `0.04em`               |

---

## 3. 質感(Texture & Materiality)

### Film Grain — 全站覆蓋

```css
.bg-grain {
  background-image: url("data:image/svg+xml;utf8,<svg...feTurbulence...>");
  background-size: 240px 240px;
  opacity: 0.06;
  mix-blend-mode: overlay;
}
```

### Handmade Paper Texture(背景區塊)

```css
.bg-paper {
  background-image: url("data:image/svg+xml;utf8,<feTurbulence baseFrequency='0.04' numOctaves='5'/>");
  background-size: 300px;
  opacity: 0.04;
}
```

### Glassmorphism(玻璃擬態 — 卡片 / overlays)

```css
.glass {
  background: rgba(250, 247, 238, 0.65);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(115, 112, 77, 0.12);
}
.glass-dark {
  background: rgba(31, 38, 21, 0.5);
  backdrop-filter: blur(20px) saturate(110%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Cinematic Image Filter

```css
.cinematic {
  filter: saturate(0.85) brightness(0.92) contrast(1.05);
}
```

---

## 4. 排版規則(Layout)

### 留白節奏

| 區塊         | padding                  | 用途                |
| ------------ | ------------------------ | ------------------- |
| Hero         | `h-[88vh] min-h-[640px]` | 滿版森林底          |
| 區塊間距     | `py-16 md:py-20`         | 比之前 `py-24` 緊湊 |
| 內容間距     | `mb-12 md:mb-16`         | 標題到內容          |
| Section 內部 | `max-w-6xl mx-auto px-6` | 固定                |

### 構圖 — **非對稱 grid**(Asymmetric Grid)

Hero 文案區: **左 60% / 右 40%** 留白呼吸區
Categories: **5/7 + 7/5** 不均分
Product Detail: **8/4** 圖大 / 文小(電影劇照感)
Featured Products: **3-2-3-2** 交錯排列

### 首頁結構(4 區塊,**不要更多**)

1. **Hero** — 全幅森林底 + 大標題 + 一個 CTA
2. **Two craft paths** — 兩個大型非對稱 category cards
3. **Recent highlights** — 4 個 featured products(asymmetric 3-2-3-2)
4. **Brand** — 一句話 + 兩個小 CTA(合併 Find Yours + 故事)

---

## 5. 動效(Motion Design)

### 慢速有機曲線

```css
transition-timing-function: cubic-bezier(
  0.16,
  1,
  0.3,
  1
); /* "expo out" — 慢起慢收 */
transition-duration: 1.1s;
```

### 微風拂動(Ken Burns on Hero)

```css
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}
.animate-breathe {
  animation: breathe 16s ease-in-out infinite;
}
```

### Scroll Reveal(IntersectionObserver)

```css
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 1.1s ease,
    transform 1.1s ease;
}
.reveal-on-scroll.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

### Hover 微互動

- 圖片:`group-hover:scale-[1.04]`(1.4s)
- 邊框/底色:漸變(不要 snap)
- 文字 underline:從無到有(300ms)

### 平滑捲動

```css
html {
  scroll-behavior: smooth;
}
```

---

## 6. 組件架構(Components)

### `Layout.astro`

- 載入 `global.css`
- 載入字體(Cormorant Garamond + Noto Serif SC + Inter)
- 設定 hreflang / OG / Twitter
- `<slot />` 內容區

### `HomeContent.astro`

- `<Hero>`(full-bleed forest + grain + Ken Burns)
- `<Categories>`(asymmetric 5/7 + 7/5 cards)
- `<FeaturedProducts>`(3-2-3-2 asymmetric grid)
- `<Brand>`(compact 1 sentence + 2 mini CTAs)

### `GlassCard.astro`(新組件)

```astro
<GlassCard>{children}</GlassCard>
```

應用:`background: rgba(crag, 0.65) + backdrop-blur(20px) + 細邊框`

### `AsymmetricGrid.astro`(新組件)

```astro
<AsymmetricGrid left="5/7" right="7/5">{children}</AsymmetricGrid>
```

### `ProductCard.astro`

- 編輯式排版:小 Kicker + 大 Serif Name + 簡短描述 + 小 Price
- 圖片 `group-hover:scale-[1.04]`(1.4s)
- 邊框細 1px forest-200,hover 時變 forest-500
- 大量 padding 給「靜物感」

### `RevealOnScroll.astro`(已存在)

- IntersectionObserver fade-up + 延遲
- 用於區塊與卡片進場

---

## 7. 產品詳情頁結構(`/products/[slug]`)

```
┌────────────────────────────────────────────┐
│ [Hero image 80vh]                          │ ← 全幅大圖(cinematic filter)
│ [Image + thumb strip]                       │
└────────────────────────────────────────────┘
┌────────────────────┬───────────────────────┐
│ [60% 圖 + slider]  │ [40% info]            │
│  - amber in glass  │ - kicker(category)    │
│  - 8/4 split      │ - name (serif large)  │
│                   │ - short description   │
│                   │ - price (1 USD)        │
│                   │ - story excerpt       │
│                   │ - size select (variants)│
│                   │ - [Reserve button]    │
└────────────────────┴───────────────────────┘

Footer (簡潔,2 行)
```

**不要**寫長篇 story / reviews / related products / FAQ — 一頁就兩區塊,留白呼吸。

---

## 8. 圖片風格指引(Image Style Guide)

### 風格

- **歐美靜物電影感**:自然光、淺景深、桌面攝影感
- **東方禪意**:留白、單一主體、線香煙霧、琥珀在亞麻布上
- **真實感**:用真實產品照(不要 stock photo),飽和度降 15%,對比略壓低

### 來源建議

- **Unsplash 搜尋關鍵字**:`amber jewelry`, `incense smoke`, `forest path`, `linen fabric`, `still life natural`
- **Picsum**(暫用 placeholder):`seed/{concept-name}/{size}`,ex: `cnamber-amber-pendant/800/800`
- **未來**:您提供真實產品照後,我上傳到 R2

### 處理

```css
img.cinematic {
  filter: saturate(0.85) brightness(0.92) contrast(1.05);
}
```

### 比例

| 用途          | 比例         |
| ------------- | ------------ |
| Hero          | 16:9 或 21:9 |
| Category card | 5:4          |
| Product card  | 1:1 或 4:5   |
| Detail hero   | 4:5 直式     |

---

## 9. 不做的事(Anti-patterns)

- ❌ 純白背景(破壞手工紙感)
- ❌ 高飽和原色(太「網頁」不夠奢)
- ❌ Emoji / 卡通插畫
- ❌ 多於 4 個區塊的首頁
- ❌ 大量文字段落(尤其 6+ 句)
- ❌ 自動輪播 / 動態彈窗 / cookie 同意橫幅
- ❌ Tailwind v3 已能用,**不引入** Tailwind v4(避免 migrate 風險)
- ❌ 任何破壞「手作感」的自動化生圖感
- ❌ 過度陰影 / glow effect(用 opacity 而非 shadow)
