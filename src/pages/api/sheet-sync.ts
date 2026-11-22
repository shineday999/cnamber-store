import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDB } from "../../lib/db";
import {
  applySheetRow,
  tokenMatches,
  type BridgeResult,
  type BridgeRow,
} from "../../lib/sheet-bridge";

// POST /api/sheet-sync  —  試算表 → 網站
// 由試算表裡的 Apps Script 呼叫（不是瀏覽器），用共用密鑰 SHEET_SYNC_TOKEN 驗證。
// body: { token, rows: BridgeRow[] }；回傳每一列的處理結果，Apps Script 會寫回「同步状态」欄。
const MAX_ROWS = 100;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const expected =
    (env as unknown as Record<string, string | undefined>).SHEET_SYNC_TOKEN ??
    "";
  if (!expected) return json({ error: "SHEET_SYNC_TOKEN 还没有设置" }, 503);

  let body: { token?: unknown; rows?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "格式不正确" }, 400);
  }
  if (typeof body.token !== "string" || !tokenMatches(body.token, expected)) {
    return json({ error: "密钥不正确" }, 401);
  }
  if (!Array.isArray(body.rows) || body.rows.length > MAX_ROWS) {
    return json({ error: `rows 必须是最多 ${MAX_ROWS} 列的数组` }, 400);
  }

  const db = getDB();
  const results: BridgeResult[] = [];
  for (const raw of body.rows as BridgeRow[]) {
    try {
      results.push(await applySheetRow(db, raw ?? {}));
    } catch (e) {
      results.push({
        slug: String(raw?.slug ?? ""),
        status: "error",
        updated: [],
        note: e instanceof Error ? e.message : "写入失败",
      });
    }
  }
  return json({ ok: true, results });
};
