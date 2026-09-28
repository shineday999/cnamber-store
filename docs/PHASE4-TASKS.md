# Phase 4 Tasks — 預訂制訂單 + Email + 內容頁

> **狀態**:✅ 完成 (commit `c65c018`+ 包含 Phase 4 內容)
> **建立**:2026-09-29

## 完成項目

- ✅ **T1**:Cookie-based 購物車(`src/lib/cart.ts` + `/cart` + `/api/cart/add` + `/api/cart/remove`)
- ✅ **T2**:預訂制結帳流程(`/checkout` + `/checkout/success` + `/api/orders/create`)
- ✅ **T3**:訂單寫入 D1(`orders` 表),Phase 5 接 Resend 寄信
- ✅ **T4**:5 個品牌頁:`/story` `/amber` `/incense` `/materials` `/craft` `/vision`
- ✅ **T5**:聯絡表單(`/contact` + `/api/contact`,寫入 `inquiries` 表)
- ✅ **T6**:完整 i18n messages(zh-Hans 完整)
- ✅ **T7**:基本防濫發驗證(message 長度上限 5000、email 格式檢查)

## 已知限制

- Email 通知(Resend)未接 — 目前只寫 DB,後台手動查看 inquiries + orders
- Stripe / 物流 API 未接(計畫書已砍預訂制模式)
- 部落格前台未實作(Phase 4 PRD 列為可選,Phase 5 再加)
- 訂單狀態切換 UI 簡化(後台只有列表,詳細狀態切換在 `/admin/orders/[id]` 待實作)