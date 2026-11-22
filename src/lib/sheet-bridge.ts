// 商品 ⇄ Google 試算表 雙向同步的共用邏輯（不用 Google Cloud API，靠試算表內建的 Apps Script）。
//   試算表 → 網站：Apps Script 在儲存格被編輯時 POST 到 /api/sheet-sync，由 applySheetRow 寫入資料庫。
//   網站 → 試算表：後台建立／儲存商品後，pushProductToSheet 把整列資料 POST 給 Apps Script 網頁應用程式。
// 這裡不 import "cloudflare:workers"，方便在 Node 內單元測試；環境變數由呼叫端傳入。

export const BRIDGE_LOCALES = ["zh-Hans", "en", "ms-MY", "id-ID"] as const;
export type BridgeLocale = (typeof BRIDGE_LOCALES)[number];

export interface BridgeFields {
  name?: string;
  short_description?: string;
  description?: string;
}

/** 試算表一列（Apps Script 送來的格式）。空字串／缺少 = 這格沒填，不會蓋掉網站現有內容。 */
export interface BridgeRow {
  slug?: string;
  /** 簡體中文名稱：slug 空白時用來比對商品 */
  name_zh?: string;
  /** 售價（人民幣，元） */
  price?: string | number;
  locales?: Partial<Record<BridgeLocale, BridgeFields>>;
}

export interface BridgeResult {
  slug: string;
  status: "ok" | "unchanged" | "not_found" | "ambiguous" | "error";
  updated: string[];
  note?: string;
}

const LIMITS = { name: 200, short_description: 500, description: 10000 };

export function cleanText(v: unknown): string {
  return typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim() : "";
}

/** 售價：容許「¥1,200」「1200 元」，必須是大於 0 的數字；不合格回 null。 */
export function parseBridgePrice(v: unknown): number | null {
  if (typeof v === "number") return v > 0 && v < 10_000_000 ? v : null;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/[¥￥,\s元]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? n : null;
}

/** 常數時間比對，避免從回應時間猜出 token。 */
export function tokenMatches(given: string, expected: string): boolean {
  if (!expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

async function findProduct(
  db: D1Database,
  row: BridgeRow,
): Promise<{ id: string; slug: string } | "not_found" | "ambiguous"> {
  const slug = cleanText(row.slug);
  if (slug) {
    const p = await db
      .prepare("SELECT id, slug FROM products WHERE slug = ?")
      .bind(slug)
      .first<{ id: string; slug: string }>();
    if (p) return p;
  }
  const name = cleanText(row.name_zh ?? row.locales?.["zh-Hans"]?.name);
  if (!name) return "not_found";
  const hits = await db
    .prepare(
      `SELECT p.id, p.slug FROM products p
         JOIN product_translations t ON t.product_id = p.id AND t.locale = 'zh-Hans'
        WHERE t.name = ? LIMIT 2`,
    )
    .bind(name)
    .all<{ id: string; slug: string }>();
  const list = hits.results ?? [];
  if (list.length === 0) return "not_found";
  if (list.length > 1) return "ambiguous";
  return list[0] as { id: string; slug: string };
}

/** 把試算表一列寫進資料庫：只更新有填的格子；翻譯不存在時要名稱與描述都有才新增。 */
export async function applySheetRow(
  db: D1Database,
  row: BridgeRow,
): Promise<BridgeResult> {
  const label = cleanText(row.slug) || cleanText(row.name_zh) || "(空白)";
  const found = await findProduct(db, row);
  if (found === "not_found" || found === "ambiguous") {
    return {
      slug: label,
      status: found,
      updated: [],
      note:
        found === "ambiguous"
          ? "有多个商品同名，请填写 slug"
          : "找不到这个商品（slug 或简体名称对不上）",
    };
  }

  const updated: string[] = [];
  const notes: string[] = [];
  const stmts: D1PreparedStatement[] = [];

  for (const loc of BRIDGE_LOCALES) {
    const f = row.locales?.[loc];
    if (!f) continue;
    const name = cleanText(f.name);
    const short = cleanText(f.short_description);
    const desc = cleanText(f.description);
    if (!name && !short && !desc) continue;
    if (
      name.length > LIMITS.name ||
      short.length > LIMITS.short_description ||
      desc.length > LIMITS.description
    ) {
      notes.push(`${loc} 内容太长，已略过`);
      continue;
    }
    const cur = await db
      .prepare(
        "SELECT name, description, short_description FROM product_translations WHERE product_id = ? AND locale = ?",
      )
      .bind(found.id, loc)
      .first<{
        name: string;
        description: string;
        short_description: string | null;
      }>();
    if (cur) {
      const next = {
        name: name || cur.name,
        description: desc || cur.description,
        short: short || cur.short_description,
      };
      if (
        next.name === cur.name &&
        next.description === cur.description &&
        next.short === cur.short_description
      ) {
        continue;
      }
      stmts.push(
        db
          .prepare(
            "UPDATE product_translations SET name = ?, description = ?, short_description = ? WHERE product_id = ? AND locale = ?",
          )
          .bind(next.name, next.description, next.short, found.id, loc),
      );
      updated.push(loc);
    } else if (name && desc) {
      stmts.push(
        db
          .prepare(
            "INSERT INTO product_translations (product_id, locale, name, description, short_description) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(found.id, loc, name, desc, short || null),
      );
      updated.push(loc);
    } else {
      notes.push(`${loc} 还没有这个语言，要同时填名称和描述才会新增`);
    }
  }

  const rawPrice = row.price;
  if (rawPrice !== undefined && String(rawPrice).trim() !== "") {
    const price = parseBridgePrice(rawPrice);
    if (price === null) {
      notes.push("售价不是大于 0 的数字，已略过");
    } else {
      const v = await db
        .prepare(
          "SELECT pv.id AS vid, pp.amount AS amount FROM product_variants pv LEFT JOIN product_prices pp ON pp.variant_id = pv.id AND pp.currency = 'CNY' WHERE pv.product_id = ? ORDER BY pv.sku LIMIT 1",
        )
        .bind(found.id)
        .first<{ vid: string; amount: number | null }>();
      const fen = Math.round(price * 100);
      if (!v) {
        notes.push("商品还没有规格，请先在后台存一次规格才能设定售价");
      } else if (v.amount !== fen) {
        stmts.push(
          db
            .prepare(
              "INSERT INTO product_prices (variant_id, currency, amount, tax_included) VALUES (?, 'CNY', ?, 1) ON CONFLICT (variant_id, currency) DO UPDATE SET amount = excluded.amount",
            )
            .bind(v.vid, fen),
          db
            .prepare("UPDATE product_variants SET price_base = ? WHERE id = ?")
            .bind((fen / 100).toFixed(2), v.vid),
        );
        updated.push("售价");
      }
    }
  }

  if (stmts.length > 0) {
    stmts.push(
      db
        .prepare("UPDATE products SET updated_at = ? WHERE id = ?")
        .bind(Math.floor(Date.now() / 1000), found.id),
    );
    await db.batch(stmts);
  }
  return {
    slug: found.slug,
    status: updated.length > 0 ? "ok" : "unchanged",
    updated,
    note: notes.length > 0 ? notes.join("；") : undefined,
  };
}

// ---------- 網站 → 試算表 ----------

export interface BridgeSnapshot {
  slug: string;
  status: string;
  price: number | null;
  locales: Partial<Record<BridgeLocale, Required<BridgeFields>>>;
}

export async function loadSnapshot(
  db: D1Database,
  productId: string,
): Promise<BridgeSnapshot | null> {
  const p = await db
    .prepare("SELECT slug, status FROM products WHERE id = ?")
    .bind(productId)
    .first<{ slug: string; status: string }>();
  if (!p) return null;
  const tr = await db
    .prepare(
      "SELECT locale, name, description, short_description FROM product_translations WHERE product_id = ?",
    )
    .bind(productId)
    .all<{
      locale: string;
      name: string;
      description: string;
      short_description: string | null;
    }>();
  const pr = await db
    .prepare(
      "SELECT pp.amount AS amount FROM product_variants pv JOIN product_prices pp ON pp.variant_id = pv.id AND pp.currency = 'CNY' WHERE pv.product_id = ? ORDER BY pv.sku LIMIT 1",
    )
    .bind(productId)
    .first<{ amount: number }>();
  const locales: BridgeSnapshot["locales"] = {};
  for (const r of tr.results ?? []) {
    if ((BRIDGE_LOCALES as readonly string[]).includes(r.locale)) {
      locales[r.locale as BridgeLocale] = {
        name: r.name,
        short_description: r.short_description ?? "",
        description: r.description,
      };
    }
  }
  return {
    slug: p.slug,
    status: p.status,
    price: pr ? pr.amount / 100 : null,
    locales,
  };
}

/**
 * 把商品最新資料推到試算表（Apps Script 網頁應用程式）。
 * 盡力而為：沒設定、逾時、失敗都只記 log，不影響後台儲存。
 */
export async function pushProductToSheet(
  db: D1Database,
  cfg: { url?: string; token?: string },
  productId: string,
  prevSlug?: string,
): Promise<void> {
  if (!cfg.url || !cfg.token) return;
  try {
    const snap = await loadSnapshot(db, productId);
    if (!snap) return;
    const res = await fetch(cfg.url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: cfg.token,
        action: "upsert",
        prev_slug: prevSlug && prevSlug !== snap.slug ? prevSlug : undefined,
        ...snap,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`[sheet-push] HTTP ${res.status}`);
  } catch (e) {
    console.warn("[sheet-push] failed", e instanceof Error ? e.message : e);
  }
}
