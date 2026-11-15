# 手機版 App 化計畫（進度追蹤）

> 目標：手機版（<768px）用「App 邏輯」操作：一個畫面做一件事、層級導覽、固定導覽列、沒有頁尾。
> 驗收標準：除商品列表外，每頁高度 ≤ 2 個螢幕。桌面版（≥768px）完全不受影響。

## 協作規則（多人請務必遵守）

1. **開工前先認領**：在下方表格把「負責人」填上自己的名字，單獨 commit 並 push，避免撞工。
2. **一個步驟一個分支**：`feat/app-shell-<步驟編號>`，例如 `feat/app-shell-1-2`。
3. **做完同一個 commit 內更新本文件**：狀態改 ✅、填日期，並在文末「更新紀錄」加一行。
4. commit 格式：`feat(app-shell): 1.2 add /more page`。
5. 合併前跑：`pnpm check && pnpm build`。部署由 GitHub Actions 的 deploy workflow 手動觸發。
6. 文案統一：購物流程用「预订」（預訂制），不要用「结账 / 购买」。
7. 手機專用樣式一律寫在 `src/styles/mobile.css` 的 `@media (max-width: 767.98px)` 內。

狀態符號：⬜ 未開始　🟡 進行中　✅ 完成

## 階段 1：App Shell

| 步驟 | 內容                                                                                 | 狀態 | 負責人           | 完成日     |
| ---- | ------------------------------------------------------------------------------------ | ---- | ---------------- | ---------- |
| 1.1  | 建立進度文件 + 修正首頁 Hero 白卡（白字白底）                                        | ✅   | Claude Fable 5.1 | 2026-11-14 |
| 1.2  | 新增「更多」頁 `/more`（品牌故事、愿景、手的工、材质来源、慢信、联络、语言、社群）   | ✅   | Claude Fable 5.1 | 2026-11-14 |
| 1.3  | Tab 第 5 個「故事」改為「更多」（4 語標籤）                                          | ✅   | Claude Fable 5.1 | 2026-11-14 |
| 1.4  | 手機版移除頁尾（需先完成 1.2）                                                       | ✅   | Claude Fable 5.1 | 2026-11-14 |
| 1.5  | 頂部列兩種狀態：根畫面 Logo / 子畫面 返回鍵 + 標題                                   | ✅   | Claude Fable 5.1 | 2026-11-14 |
| 1.6  | 購物車 Tab 數量角標                                                                  | ✅   | Claude Fable 5.1 | 2026-11-14 |
| 1.7  | 頁面轉場：原生 CSS View Transitions（導覽列固定，內容淡入滑入）；不採用 ClientRouter | ✅   | Claude Fable 5.1 | 2026-11-14 |

## 階段 2：首頁儀表板 + 產品列表

| 步驟 | 內容                                                                                                                                                             | 狀態 | 負責人            | 完成日     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------- | ---------- |
| 2.1  | 首頁 Hero 壓縮至約 60% 螢幕、按鈕並排；修正圓點變大、SCROLL 出現、垂直置中消失                                                                                   | ✅   | Claude Fable 5.1  | 2026-11-14 |
| 2.2  | 首頁「兩條手作路線」改為 2 欄磚塊                                                                                                                                | ✅   | Claude Fable 5.1  | 2026-11-14 |
| 2.3  | 首頁商品／第三區塊改橫向滑動列（scroll-snap）                                                                                                                    | ✅   | Claude Fable 5.1  | 2026-11-14 |
| 2.4  | 首頁問答入口橫幅卡；整頁高度驗收（≤ 2 螢幕）                                                                                                                     | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 2.4b | 首頁整頁高度再壓縮：精選橫滑卡縮窄（46vw、方圖、隱藏說明）、路線磚改方形、區塊留白與問答卡內距縮小（實測 2.3，目標 ≤ 2.0；部署後實測達標再把 2.4 與 2.4b 改 ✅） | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 2.5  | 產品列表：分類 chips（可橫滑）固定在頂部列下方                                                                                                                   | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 2.6  | 產品列表：2 欄緊湊商品卡（12px 內距、16px 標題、隱藏說明；永遠 2 欄）                                                                                            | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 2.7  | Hero 可左右滑動切換（touch swipe，不動既有輪播 script 的行為）                                                                                                   | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 2.8  | 產品列表：排序底部彈出層（原生 dialog；sort 參數白名單；4 語 i18n）。分類篩選維持 2.5 的 chips                                                                   | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 2.9  | （選用）圖片載入前 shimmer 占位。列表為 SSR 整頁載入，不做整頁骨架畫面                                                                                           | ✅   | Claude Sonnet 5.5 | 2026-11-15 |

## 階段 3：商品詳情 + 購物車

| 步驟 | 內容                                                                     | 狀態 | 負責人            | 完成日     |
| ---- | ------------------------------------------------------------------------ | ---- | ----------------- | ---------- |
| 3.1  | 商品詳情：頭圖壓縮至約 42% 螢幕、隱藏重複的第二張圖與圖上「Back to all」 | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 3.2  | 商品詳情：規格改大按鈕選項、數量改 −／＋ 步進器                          | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 3.3  | 商品詳情：底部固定操作列（價格 + 「预订」按鈕，疊在 Tab 上方）           | ✅   | Claude Fable 5.1  | 2026-11-15 |
| 3.4  | 商品詳情：故事、常見問題改可展開（accordion）                            | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 3.5  | 購物車：左滑刪除、± 數量、底部固定合計與「预订」按鈕                     | ✅   | Claude Sonnet 5.5 | 2026-11-15 |

## 階段 4：問答 + 预订流程

| 步驟 | 內容                                                                                       | 狀態 | 負責人           | 完成日     |
| ---- | ------------------------------------------------------------------------------------------ | ---- | ---------------- | ---------- |
| 4.1  | 問答一題一畫面（進度條、點選自動下一題、底部固定操作列）；新增 QuizWizard 元件與 quiz.next | ✅   | Claude Fable 5.1 | 2026-11-15 |
| 4.2  | 問答結果頁手機版（結果卡 + 底部固定「看推薦商品」）                                        | ✅   | Claude Fable 5.1 | 2026-11-15 |
| 4.2b | 問答結果頁顯示商品圖（SQL 補 image_urls 子查詢，傳給 ProductCard；桌面版同步受惠）         | ✅   | Claude Fable 5.1 | 2026-11-15 |
| 4.3  | 预订流程第 1 步：聯絡資料（checkout 分步）                                                 | ✅   | Claude Fable 5.1 | 2026-11-15 |
| 4.4  | 预订流程第 2 步：配送                                                                      | ✅   | Claude Fable 5.1 | 2026-11-15 |
| 4.5  | 预订流程第 3 步：確認並送出（底部固定「预订」）                                            | ✅   | Claude Fable 5.1 | 2026-11-15 |
| 4.6  | 預訂成功頁手機版                                                                           | ✅   | Claude Fable 5.1 | 2026-11-15 |

## 階段 5：品牌內容頁

| 步驟 | 內容                                                                                                                                     | 狀態 | 負責人            | 完成日     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------- | ---------- |
| 5.1  | 品牌內容頁共通手機版排版：標題靠左、字級與段距壓縮、引言區塊縮小（story / vision / craft / about / amber / incense / materials；純 CSS） | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 5.2  | About、Contact 的常見問題改可展開（沿用 3.4 做法；新增共用 AccordionInit 元件）                                                          | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 5.3  | Materials 六張材質卡改可展開（桌面版外觀不變）                                                                                           | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 5.4  | 「選一件」頁（/quiz）手機版重新設計 + 頁尾「繼續閱讀」卡片壓縮                                                                           | ✅   | Claude Sonnet 5.5 | 2026-11-15 |

## 階段 6：品質與 PWA

| 步驟 | 內容                                                                                                   | 狀態 | 負責人            | 完成日     |
| ---- | ------------------------------------------------------------------------------------------------------ | ---- | ----------------- | ---------- |
| 6.1  | body 背景層次：改 body 背景為手機版淺灰（--m-bg），白色卡片與頁面分出層次；同步 2.5 chips 列顏色       | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 6.2  | 子畫面標題改由伺服器渲染（Layout 把 title 傳給 MobileNav，換頁不再延遲出現；原待辦 1.7b）              | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 6.3  | Lighthouse 無障礙 0.91 → ≥ 0.95：Hero 圓點 role=tablist 改 group（部署後重測再改 ✅）                  | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 6.4  | Lighthouse 效能 0.66 → ≥ 0.9：橫幅圖壓縮 + 768 手機版、字型 CSS 非阻塞、gtag 延後（部署後重測再改 ✅） | 🟡   | Claude Sonnet 5.5 | 2026-11-15 |
| 6.5  | PWA：manifest、圖示、theme-color、apple-touch-icon（可加入主畫面）                                     | ✅   | Claude Sonnet 5.5 | 2026-11-15 |
| 6.6  | PWA：service worker（靜態資源快取 + 離線提示頁）；整頁骨架畫面不做（SSR 整頁載入，與 2.9 的決定一致）  | ✅   | Claude Sonnet 5.5 | 2026-11-15 |

## 後續階段（尚未拆步驟）

| 階段 | 內容                                                   | 狀態 |
| ---- | ------------------------------------------------------ | ---- |
| 5    | 品牌內容頁 accordion / 章節卡                          | ✅   |
| 6    | PWA（manifest、service worker）+ 骨架畫面 + Lighthouse | 🟡   |

## 已知問題

- 商品詳情頁只讀每個商品第一張圖（variants[0] 的 image_urls[0]），原本還重複顯示一次；因此「圖片可左右滑」暫不做，待確認資料有多張圖再評估

- <body> 有 Tailwind 的 bg-white，蓋掉 mobile.css 的 body 淺灰背景（--m-bg），白色卡片與頁面背景分不出層次；2.5 的 chips 列因此暫用白色底。待單獨一步處理（改 body 背景並同步 chips 列顏色）

- 整頁高度驗收方法（首頁，375×812 手機模式，部署後在 DevTools Console 執行）：
  `Math.round(document.documentElement.scrollHeight / innerHeight * 10) / 10`
  目標 ≤ 2.0（即 scrollHeight ≤ 1624px）。達標後把 2.4 改 ✅；未達標開 2.4b 針對最高的區塊再壓縮（發現就加進來）

- 子畫面標題由 JS 填入，換頁時會稍晚出現；可改由 Layout 把 title 傳給 MobileNav 由伺服器渲染（待辦 1.7b）

- Lighthouse CI（審計線上站）：Performance 0.66、Accessibility 0.91，未達 0.9 / 0.95（階段 2、6 處理）

- 商品詳情頁：頂部大圖與下方圖片重複，返回鍵疊在圖片上（階段 3 處理）
- 購物車等頁面底部仍有頁尾（步驟 1.4 處理）

## 更新紀錄

| 日期       | 人                | 內容                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-14 | Claude Fable 5.1  | 1.1 建立進度文件；修正首頁 Hero 白卡                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-14 | Claude Fable 5.1  | 1.1b 修正 Hero 白卡根因：排除 grid-cols-12 版面格線與 .hero-text                                                                                                                                                                                                                                                                                                                            |
| 2026-11-14 | Claude Fable 5.1  | 1.2 新增 /more 頁（探索 / 我們 / 語言 / 同在）                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-14 | Claude Fable 5.1  | 1.2b MobileNav 與 /more 改用站台 i18n（locals.locale、createT、localizedPath），新增 nav.more，語言連結寫入 cnamber_locale                                                                                                                                                                                                                                                                  |
| 2026-11-14 | Claude Fable 5.1  | 1.3 底部 Tab 第 5 個改為「更多」(/more)，「更多」底下頁面皆高亮此 Tab                                                                                                                                                                                                                                                                                                                       |
| 2026-11-14 | Claude Fable 5.1  | 1.3b /more 移除語言分組（頂部地球圖示已可切換語言）                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-14 | Claude Fable 5.1  | 1.4 手機版隱藏頁尾（footer[data-site-footer]）；慢信訂閱與版權搬進 /more，訂閱成功提示顯示在 /more 頂部                                                                                                                                                                                                                                                                                     |
| 2026-11-14 | Claude Fable 5.1  | 1.5 頂部列雙狀態：根畫面（/、/products、/quiz、/cart、/more）顯示 Logo，其餘顯示返回鍵 + 標題；返回鍵優先 history.back()，直接開啟時退到上一層                                                                                                                                                                                                                                              |
| 2026-11-14 | Claude Fable 5.1  | 1.6 購物車 Tab 角標：伺服器讀 cnamber_cart 渲染 + 瀏覽器 cookie 同步（pageshow）；超過 99 顯示 99+                                                                                                                                                                                                                                                                                          |
| 2026-11-14 | Claude Fable 5.1  | 1.7 手機版頁面轉場改用原生 View Transitions（@view-transition navigation:auto）。決策：不採用 Astro ClientRouter，因 Layout / HomeContent / Tabs / products/[slug] 有多段只執行一次的 script，需逐一改為 astro:page-load，風險高。階段 1 完成                                                                                                                                               |
| 2026-11-14 | Claude Fable 5.1  | 2.1 首頁 Hero 手機版：高度 60dvh、內容垂直置中、CTA 並排；修正 1.1b 與通用按鈕／連結規則造成的圓點變大、SCROLL 出現（Hero <section> 加 data-home-hero）                                                                                                                                                                                                                                     |
| 2026-11-14 | Claude Fable 5.1  | 2.2 首頁路線卡手機版改 2 欄磚塊（3:4、16px 圓角，隱藏說明文字）；第二區塊 <section> 加 data-home-paths。「选一件」兩張問答卡留待 2.4                                                                                                                                                                                                                                                        |
| 2026-11-14 | Claude Fable 5.1  | 2.3 首頁最近亮點改橫向滑動列（scroll-snap，卡片寬 64vw、露出下一張）；標題列改左右排；第三區塊 <section> 加 data-home-featured。ProductCard 與資料查詢未動                                                                                                                                                                                                                                  |
| 2026-11-14 | Claude Fable 5.1  | 2.4 首頁「选一件」兩張問答卡手機版改橫幅卡（約 90px，隱藏說明與按鈕、右側箭頭）；區塊標題靠左並隱藏說明。實作完成，整頁高度待實測，狀態暫為 🟡                                                                                                                                                                                                                                              |
| 2026-11-15 | Claude Fable 5.1  | 2.5 產品列表：分類改 sticky 橫滑 chips（top = 頂部列高度、每顆 ≥44px）；標題區靠左並隱藏說明；<header>、<nav> 加 data-products-head / data-products-chips，分類連結補 aria-current                                                                                                                                                                                                          |
| 2026-11-15 | Claude Fable 5.1  | 2.6 產品列表手機版 2 欄緊湊卡（網格加 data-products-grid）。原 2.6 拆分：排序／篩選彈出層 → 2.8，圖片 shimmer → 2.9（選用；SSR 頁面不做整頁骨架）                                                                                                                                                                                                                                           |
| 2026-11-15 | Claude Fable 5.1  | 2.8 產品列表排序：?sort=new                                                                                                                                                                                                                                                                                                                                                                 | price_asc | price_desc（白名單對應 SQL，無價格排最後）；手機版 chips 列右側「排序」按鈕開底部彈出層；products.sort_* 新增於 4 語翻譯檔；桌面版不顯示按鈕 |
| 2026-11-15 | Claude Fable 5.1  | 3.1 商品詳情手機版：頭圖 42dvh、隱藏重複第二張圖與圖上英文「Back to all」（頂部列已有返回鍵）；[slug].astro 加 data-pd-hero / data-pd-back / data-pd-info / data-pd-gallery2。下單表單與 /api/cart/add 未動                                                                                                                                                                                 |
| 2026-11-15 | Claude Fable 5.1  | 3.2 + 3.3 商品詳情下單表單：規格 56px 大按鈕列（單選鈕縮回 22px，修正通用 input 規則誤傷）、數量 −／＋ 步進器（桌面隱藏）、價格 + 「预订」固定在 Tab 列上方（data-pd-bar）。表單與 /api/cart/add 未動                                                                                                                                                                                       |
| 2026-11-15 | Claude Sonnet 5.5 | 2.4b 首頁手機版高度壓縮：實測 2.3（scrollHeight 1862）；路線磚 3:4 改方形、問答區塊標題與橫幅卡內距縮小、精選橫滑卡改 46vw 方圖並隱藏說明、兩區塊上下留白縮小。只改 mobile.css 手機 media query，待部署後重測                                                                                                                                                                               |
| 2026-11-15 | Claude Sonnet 5.5 | 2.4 與 2.4b 驗收：首頁整頁高度實測 2.0（目標 ≤ 2.0），標為完成                                                                                                                                                                                                                                                                                                                              |
| 2026-11-15 | Claude Sonnet 5.5 | 3.4 商品詳情手機版：故事與常見問題改原生 details 可展開（預設收合，桌面版永遠展開、外觀不變）；新增 product.story_title 4 語；資訊區底部留白移到 FAQ 區塊，避免被固定操作列遮住                                                                                                                                                                                                             |
| 2026-11-15 | Claude Sonnet 5.5 | 3.5 購物車手機版：± 數量（新增 /api/cart/update，含庫存檢查，按鈕為 POST form 無 JS）、左滑顯示移除（CSS scroll-snap）、底部固定合計與結帳按鈕（疊在 Tab 上方）；修正購物車列原本顯示 slug，改顯示商品名稱。桌面版版面不變                                                                                                                                                                  |
| 2026-11-15 | Claude Fable 5.1  | 4.1 問答手機版一題一畫面：QuizWizard.astro（漸進增強：JS 啟動後才分步；無 JS／桌面維持原表單）；jewelry（及 incense，若錨點相符）加 data-quiz / data-qw-pending / data-quiz-page；新增 quiz.next 4 語。表單與 /api/quiz/recommend 未動                                                                                                                                                      |
| 2026-11-15 | Claude Fable 5.1  | 4.2 問答結果頁手機版：結果改單欄橫向列表（104px 圖 + 文字），標題區壓縮，底部固定「重新測驗／再看看 →」；result.astro 加 data-quiz-result-page / data-quiz-results / data-quiz-old-retake；無新增翻譯 key，資料查詢未動                                                                                                                                                                     |
| 2026-11-15 | Claude Fable 5.1  | 4.2b 問答結果頁補 image_urls 子查詢（同 products/index.astro）並加 firstImage()，ProductCard 改傳 firstImage(p.image_urls)；移除「結果卡沒有商品圖」已知問題。資料範圍與排序未動                                                                                                                                                                                                            |
| 2026-11-15 | Claude Fable 5.1  | 4.3 + 4.4 + 4.5 預訂（結帳）3 步精靈：CheckoutWizard.astro（漸進增強；聯絡資料 → 配送地址 → 確認：資料回顧 + 明細 + 底部固定合計與送出）；每步以 checkValidity 驗證必填；欄位補 autocomplete / inputmode；新增 checkout.step_* 4 語。欄位名稱與 /api/orders/create 未動                                                                                                                     |
| 2026-11-15 | Claude Fable 5.1  | 4.6 預訂成功頁手機版：置中完成畫面 + 勾勾彈出動畫（尊重 reduced-motion）、訂單編號膠囊、底部固定「首页／再看看 →」；MobileNav 的 ROOTS 加入 /checkout/success（頂部列顯示 Logo，避免返回鍵退回已清空的結帳頁）。階段 4 完成                                                                                                                                                                 |
| 2026-11-15 | Claude Sonnet 5.5 | 2.7 Hero 左右滑動：HomeContent 輪播 script 只加 window.__heroGo hook，另以獨立 inline script 偵測 touch swipe（橫向 ≥50px 且 > 1.5 倍直向）；手機版 Hero 加 touch-action: pan-y。既有自動輪播與圓點邏輯未改                                                                                                                                                                                 |
| 2026-11-15 | Claude Sonnet 5.5 | 2.9 圖片載入前 shimmer：純 CSS，套在商品卡圖片容器與首頁路線磚的背景，圖片載入後自然蓋住；只在手機版且 prefers-reduced-motion: no-preference 啟用，動畫跑 4 圈後停止。未改 ProductCard.astro                                                                                                                                                                                                |
| 2026-11-15 | Claude Sonnet 5.5 | 5.1 品牌內容頁手機版共通排版（純 CSS，以 main article.py-section 為範圍）；階段 5 拆為 5.1 ~ 5.4                                                                                                                                                                                                                                                                                            |
| 2026-11-15 | Claude Sonnet 5.5 | 5.2 About、Contact 常見問題改原生 details 可展開（預設收合，桌面版永遠展開、外觀不變）；新增共用 AccordionInit 元件（與 3.4 相同邏輯）。商品詳情頁仍用自己的 inline script，後續可改用此元件                                                                                                                                                                                                |
| 2026-11-15 | Claude Sonnet 5.5 | 5.3 Materials 六張材質卡手機版改可展開（預設收合，桌面版永遠展開、外觀不變），使用 5.2 的 AccordionInit                                                                                                                                                                                                                                                                                     |
| 2026-11-15 | Claude Sonnet 5.5 | 5.4 /quiz 手機版重新設計（白色圓角卡、柔和陰影、圖示淡色圓底、說明限 2 行、時長沿用 home.cta_meta、「开始 →」膠囊按鈕；移除黑框與雙箭頭）；kicker 改 quiz.kicker 4 語；ContinueReading 加 data-continue 並壓縮手機版卡片。桌面版外觀不變（桌面版雙箭頭維持原樣）                                                                                                                            |
| 2026-11-15 | Claude Sonnet 5.5 | 階段 5 於「後續階段」表標為完成；階段 6 拆為 6.1 ~ 6.6（body 背景、子畫面標題 SSR、Lighthouse 無障礙與效能、PWA manifest、service worker）                                                                                                                                                                                                                                                  |
| 2026-11-15 | Claude Sonnet 5.5 | 6.1 body 背景層次：手機版以 html body.bg-white 覆蓋 Tailwind 的 bg-white，改回 --m-bg 淺灰；2.5 chips 列同步為 --m-bg。純 CSS，桌面版不受影響                                                                                                                                                                                                                                               |
| 2026-11-15 | Claude Sonnet 5.5 | 6.2 子畫面標題改伺服器渲染（待辦 1.7b）：Layout 傳 title 給 MobileNav，伺服器取「頁面標題 — 站名」前半段輸出到 .m-title；JS 僅在伺服器標題為空時用 h1 補。已知問題中的 1.7b 已解決                                                                                                                                                                                                          |
| 2026-11-15 | Claude Sonnet 5.5 | 6.3 修正 aria-required-children：Hero 圓點容器 role=tablist 改 role=group（圓點是按鈕、非 tab）。線上實測 a11y 0.94，此為唯一未過項目                                                                                                                                                                                                                                                       |
| 2026-11-15 | Claude Sonnet 5.5 | 6.4 效能（實測 0.59、LCP 12.5s、CLS 0.151、圖片可省 4.4MB）：slide-1/slide-3/bamboo 由 2752px 約 1.5MB 壓成 1920px q72，並新增 -768.jpg 手機版（HomeContent 在沒有 mobile_image_url 時自動使用）；Google Fonts CSS 改 media=print 非阻塞；gtag.js 延後到 load + idle。CLS 來源未確認，部署後重測，若仍 > 0.1 再用 Performance 面板找出元素                                                  |
| 2026-11-15 | Claude Sonnet 5.5 | 6.5 PWA：新增 manifest.webmanifest（standalone、scope /、背景 #f3f1ea）、icon-192 / icon-512 / apple-touch-icon（依 Layout logo 繪製，logo 佔 52% 以落在 maskable 安全區）；Layout head 加 manifest、apple-touch-icon、iOS 全螢幕 meta、手機版 theme-color 白色（桌面維持 #2d4a3e，以 media 區分）。body 內原有的 theme-color meta 未動                                                     |
| 2026-11-15 | Claude Sonnet 5.5 | 6.3b 線上實測 a11y 0.96 達標（Hero 角色修正生效），6.3 標為完成；另修 color-contrast：底部 Tab 文字 #6b7a70 對 #fefefe 僅 4.48，--m-muted 改 #5f6f64（對白 5.28、對 --m-bg 4.71）。純 CSS 變數，桌面版不受影響                                                                                                                                                                              |
| 2026-11-15 | Claude Sonnet 5.5 | 6.4c 首頁 LCP preload 分流：index.astro 與 [lang]/index.astro 原本一律 preload 桌面版橫幅（高優先），手機因此多載 393KB 並與真正的手機版搶頻寬；改為手機（≤768px）preload mobile_image_url、桌面（≥769px）preload image_url。實測（R2 換圖後）傳輸量 1,786 KiB、LCP 9.3s、效能 0.61，6.4 仍待達標                                                                                           |
| 2026-11-15 | Claude Sonnet 5.5 | 1.2 補標 ✅：/more 頁已於 2026-11-14 完成（見 1.2、1.2b 更新紀錄），當時漏改表格狀態                                                                                                                                                                                                                                                                                                        |
| 2026-11-15 | Claude Sonnet 5.5 | 6.6 PWA service worker：public/sw.js（導覽 network-first，斷線回 /offline.html；/_astro、/api/images 為 cache-first；/images 與圖示為 stale-while-revalidate；不快取 HTML、購物車、/api、/admin、跨網域）、四語 public/offline.html、_headers（sw.js no-cache）、Layout 載入後註冊。快取名 cnamber-static-v1，改行為時遞增 VERSION。整頁骨架畫面不做（SSR）。階段 6 待 6.4 實測達標後標完成 |
| 2026-11-15 | Claude Sonnet 5.5 | 6.4d 減少首屏資源競爭 LCP 圖：輪播第 2、3 張改 data-src / data-srcset，頁面載完並閒置後才啟用（show() 也會先啟用）；cat-jewelry / cat-incense 重壓縮並新增 480px 版（srcset）；ProductCard 的 Unsplash 圖 w/h 800 → 640。實測 6.4c 後：傳輸量 1,393 KiB、LCP 4.9s、效能 0.67、CLS 0.151（來源待查）。6.4 仍待達標                                                                           |
