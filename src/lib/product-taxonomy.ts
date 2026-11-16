// 商品分類與子分類（與原本 new.astro / API 寫死的清單一致）
// 資料庫的 categories、product_categories 兩張表目前都沒有程式使用，分類改由這裡統一管理。
export const PRODUCT_TAXONOMY = {
  jewelry: ["necklace", "bracelet", "earring", "ring"],
  incense: ["stick", "balm", "oil"],
} as const;

export type ProductCategory = keyof typeof PRODUCT_TAXONOMY;

export const PRODUCT_CATEGORIES = Object.keys(
  PRODUCT_TAXONOMY,
) as ProductCategory[];

export function isValidTaxonomy(
  category: string,
  subcategory: string | null | undefined,
): boolean {
  if (!(category in PRODUCT_TAXONOMY)) return false;
  if (subcategory === null || subcategory === undefined || subcategory === "")
    return true;
  return (
    PRODUCT_TAXONOMY[category as ProductCategory] as readonly string[]
  ).includes(subcategory);
}
