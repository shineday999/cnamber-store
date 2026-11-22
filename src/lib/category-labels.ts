import { ensureCategoryTable, listCategories } from "./categories";

// 前台商品卡片 / 商品页上的分类名称：后台「分类图片」页设定的标题（依语言），
// 内建的 jewelry / incense 仍用语言档（nav.amber / nav.incense）。
// 在 Worker 内存里缓存 60 秒，避免每张卡片都查一次资料库。
type DB = Parameters<typeof listCategories>[0];

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; labels: Record<string, string> }>();

export async function getCategoryLabels(
  db: DB,
  locale: string,
): Promise<Record<string, string>> {
  const hit = cache.get(locale);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) return hit.labels;
  const labels: Record<string, string> = {};
  try {
    await ensureCategoryTable(db);
    for (const c of await listCategories(db)) {
      const title = c.titles[locale] || c.titles["zh-Hans"];
      if (title) labels[c.code] = title;
    }
  } catch {
    // 读不到就空着，调用端会退回代码 / 内建名称
  }
  cache.set(locale, { at: now, labels });
  return labels;
}
