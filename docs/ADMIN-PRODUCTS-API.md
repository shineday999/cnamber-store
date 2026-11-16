# 後台商品 API 規格（步驟 0.6）

所有端點在 `/api/admin/*` 底下，登入與 CSRF 由 `src/middleware.ts` 處理（同源才能寫入）。
寫入需要 `editor` 或 `super_admin`；`viewer` 回 403。請求與回應皆為 JSON（圖片上傳除外）。
契約的唯一來源是 `src/lib/schemas/product.ts`，修改前請開 PR 並通知全員。

## 端點

| 方法   | 路徑                                                 | 請求內容                                 | 成功回應           |
| ------ | ---------------------------------------------------- | ---------------------------------------- | ------------------ |
| POST   | `/api/admin/products`                                | `ProductCreateSchema`                    | 201 `{ id }`       |
| PATCH  | `/api/admin/products/:id`                            | `ProductPatchSchema`（不含 variants）    | 200 `{ ok }`       |
| DELETE | `/api/admin/products/:id?confirm=<slug>`             | 無                                       | 200 `{ ok }`       |
| POST   | `/api/admin/products/:id/variants`                   | `VariantInputSchema`                     | 201 `{ id }`       |
| PUT    | `/api/admin/products/:id/variants/:variantId`        | `VariantInputSchema`（價格整組取代）     | 200 `{ ok }`       |
| DELETE | `/api/admin/products/:id/variants/:variantId`        | 無                                       | 200 `{ ok }`       |
| PUT    | `/api/admin/products/:id/variants/:variantId/prices` | `{ "prices": { "USD": 12800 } }`         | 200 `{ ok }`       |
| POST   | `/api/admin/uploads/image`                           | multipart：`image`、`product_id`（選填） | 201 `{ url, key }` |

- 金額是各幣別的最小單位整數（USD 12800 = 128.00 美元）；支援幣別見 `CURRENCIES`。
- `PATCH` 有帶 `translations` 時整組取代；沒帶的欄位維持原值；沒有任何可更新欄位回 400 `empty_patch`。
- 刪除商品會連帶刪除翻譯、變體、價格、評論；必須帶 `confirm` 等於該商品的 slug。
- 刪除變體：商品至少要保留一個，刪最後一個回 409 `last_variant`。
- 上傳：僅限 JPG／PNG／WebP／GIF、5MB 以內；以檔案開頭位元組判斷格式，不信任瀏覽器宣告的類型。
  回傳的 `url`（`/api/images/<key>`）直接存進 `variants[].image_urls` 或 `image_url`。
- 分類與子分類見 `src/lib/product-taxonomy.ts`，不在清單內回 400 `invalid_category`。

## 錯誤格式

```json
{
  "error": {
    "code": "validation_failed",
    "message": "栏位验证失败",
    "issues": [{ "path": "slug", "message": "..." }]
  }
}
```

| HTTP | code                              | 情境                                 |
| ---- | --------------------------------- | ------------------------------------ |
| 400  | `invalid_json`                    | 請求內容不是有效 JSON                |
| 400  | `validation_failed`               | 欄位不符 schema（`issues` 指出欄位） |
| 400  | `invalid_category`                | 分類或子分類不在 taxonomy            |
| 400  | `empty_patch`                     | PATCH 沒有任何可更新欄位             |
| 400  | `confirm_required`                | 刪除商品沒帶或帶錯 `confirm`         |
| 400  | `no_file` / `missing_id`          | 沒有檔案／缺少網址參數               |
| 401  | `unauthorized`                    | 未登入                               |
| 403  | `forbidden`                       | viewer 沒有編輯權限                  |
| 404  | `not_found`                       | 商品或變體不存在（或不屬於該商品）   |
| 409  | `slug_taken`                      | slug 重複                            |
| 409  | `sku_taken`                       | SKU 重複                             |
| 409  | `last_variant`                    | 刪除最後一個變體                     |
| 413  | `too_large`                       | 圖片超過 5MB                         |
| 415  | `invalid_image_type`              | 不是支援的圖片格式                   |
| 500  | `internal_error` / `r2_not_bound` | 伺服器錯誤／R2 未綁定                |

## 範例

```bash
# 建立（需帶登入 cookie 與同源 Origin）
curl -X POST https://<host>/api/admin/products \
  -H 'Content-Type: application/json' -H 'Origin: https://<host>' -b cookies.txt \
  -d '{"category":"jewelry","subcategory":"necklace","slug":"demo-pendant",
       "translations":[{"locale":"zh-Hans","name":"示范吊坠","description":"描述"}],
       "variants":[{"sku":"DEMO-S","stock":5,"prices":{"USD":12800,"CNY":92000}}]}'
```
