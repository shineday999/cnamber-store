// 後台產品資料契約（zod）
// 後台 API、repository、表單共用。修改請開 PR 並在 docs/ADMIN-PRODUCTS-PLAN.md 更新紀錄註明。
import { z } from "zod";

export const LOCALES = ["zh-Hans", "en", "ms-MY", "id-ID"] as const;
export const CURRENCIES = [
  "USD",
  "CNY",
  "MYR",
  "IDR",
  "AED",
  "SAR",
  "TWD",
] as const;
export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

export const LocaleSchema = z.enum(LOCALES);
export const ProductStatusSchema = z.enum(PRODUCT_STATUSES);

export const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能用小寫英數與連字號");

export const TranslationSchema = z.object({
  locale: LocaleSchema,
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
  short_description: z.string().trim().max(500).nullable().default(null),
  story: z.string().nullable().default(null),
  meta_title: z.string().trim().max(120).nullable().default(null),
  meta_description: z.string().trim().max(300).nullable().default(null),
});

// 幣別 → 金額（最小單位，整數）
export const PricesSchema = z
  .record(z.string(), z.number().int().nonnegative())
  .refine(
    (o) =>
      Object.keys(o).every((k) =>
        (CURRENCIES as readonly string[]).includes(k),
      ),
    "不支援的幣別",
  );

export const VariantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1).max(64),
  attributes: z.record(z.string(), z.string()).default({}),
  stock: z.number().int().min(0).default(0),
  weight_grams: z.number().int().min(0).nullable().default(null),
  image_urls: z.array(z.string()).default([]),
  prices: PricesSchema.default({}),
});

// faq 形狀待 0.1 盤點後確認；目前先用「語言 → 問答陣列」
export const FaqSchema = z.record(
  z.string(),
  z.array(z.object({ q: z.string(), a: z.string() })),
);

export const ProductCreateSchema = z.object({
  category: z.string().trim().min(1).max(50),
  subcategory: z.string().trim().max(50).nullable().default(null),
  slug: SlugSchema,
  status: ProductStatusSchema.default("draft"),
  tags: z.array(z.string().trim().min(1)).default([]),
  image_url: z.string().nullable().default(null),
  faq: FaqSchema.default({}),
  translations: z
    .array(TranslationSchema)
    .min(1)
    .refine(
      (ts) => ts.some((t) => t.locale === "zh-Hans"),
      "必須包含 zh-Hans 翻譯",
    ),
  variants: z.array(VariantInputSchema).min(1),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
export type VariantInput = z.infer<typeof VariantInputSchema>;
export type TranslationInput = z.infer<typeof TranslationSchema>;

// tags 與 quiz.ts 的 scoreProducts 使用相同的分隔規則
export const tagsToDb = (tags: string[]): string => tags.join(",");
export const tagsFromDb = (s: string | null | undefined): string[] =>
  (s ?? "").split(/[,;\s]+/).filter(Boolean);
