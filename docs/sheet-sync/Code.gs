/**
 * 商品 ⇄ 网站 双向同步（贴进 Google 试算表的 Apps Script，不需要 Google Cloud API）
 *
 * 试算表 → 网站：编辑储存格后自动把那一列送到网站（也可手动：菜单「商品同步 → 全部同步到网站」）
 * 网站 → 试算表：后台新增／保存商品后，网站自动把那一列写进这张表（没有就新增一列）
 *
 * 每个储存格「空白 = 不覆盖」；「同步状态」栏会告诉你这一列同步得怎么样。
 * 安装步骤见 docs/PRODUCT-SHEET-SYNC.md
 */

var LOCALES = ["zh-Hans", "en", "ms-MY", "id-ID"];
var FIELDS = [
  { key: "name", label: "名称" },
  { key: "short_description", label: "简介" },
  { key: "description", label: "描述" },
];
var H_SLUG = "slug";
var H_REF = "名称（仅供参考）";
var H_PRICE = "售价";
var H_STATUS = "同步状态";

function headers_() {
  var h = [H_SLUG, H_REF];
  LOCALES.forEach(function (loc) {
    FIELDS.forEach(function (f) {
      h.push(loc + " " + f.label);
    });
  });
  h.push(H_PRICE, H_STATUS);
  return h;
}

function props_() {
  return PropertiesService.getScriptProperties();
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = props_().getProperty("SHEET_NAME");
  return (name && ss.getSheetByName(name)) || ss.getSheets()[0];
}

/** 确保标题列有所有需要的栏位（缺的接在最后面），回传 {标题: 栏号(1 起算)} */
function colMap_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var row = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  row.forEach(function (v, i) {
    var t = String(v).replace(/\s+/g, " ").trim();
    if (t) map[t] = i + 1;
  });
  var next = Object.keys(map).length ? lastCol + 1 : 1;
  headers_().forEach(function (h) {
    if (!map[h]) {
      sh.getRange(1, next).setValue(h);
      map[h] = next;
      next++;
    }
  });
  return map;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("商品同步")
    .addItem("全部同步到网站", "syncAll")
    .addSeparator()
    .addItem("初始设定（只做一次）", "setup")
    .addToUi();
}

/** 初始设定：填网站网址、产生密钥、安装「编辑时自动同步」触发器 */
function setup() {
  var ui = SpreadsheetApp.getUi();
  var p = props_();
  var r = ui.prompt(
    "网站网址",
    "请输入网站网址（例如 https://cnamber-store.pages.dev）",
    ui.ButtonSet.OK_CANCEL,
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var base = r.getResponseText().trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(base)) {
    ui.alert("网址要以 https:// 开头");
    return;
  }
  p.setProperty("SITE_URL", base);
  var token = p.getProperty("TOKEN");
  if (!token) {
    token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, "");
    p.setProperty("TOKEN", token);
  }
  // 安装触发器（已存在就不重复装）
  var has = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === "onEditInstalled";
  });
  if (!has) {
    ScriptApp.newTrigger("onEditInstalled")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
  }
  colMap_(sheet_());
  ui.alert(
    "设定完成",
    "请把下面这串密钥设定到网站（Cloudflare secret：SHEET_SYNC_TOKEN）：\n\n" +
      token +
      "\n\n之后到「部署 → 新增部署作业 → 网页应用程式」取得网址，设定到 SHEET_SCRIPT_URL。",
    ui.ButtonSet.OK,
  );
}

// ---------- 表格 → 网站 ----------

function rowToPayload_(sh, map, r) {
  var width = sh.getLastColumn();
  var v = sh.getRange(r, 1, 1, width).getValues()[0];
  var get = function (h) {
    var c = map[h];
    return c ? String(v[c - 1] == null ? "" : v[c - 1]).trim() : "";
  };
  var locales = {};
  LOCALES.forEach(function (loc) {
    var o = {};
    FIELDS.forEach(function (f) {
      o[f.key] = get(loc + " " + f.label);
    });
    locales[loc] = o;
  });
  return {
    slug: get(H_SLUG),
    name_zh: locales["zh-Hans"].name || get(H_REF),
    price: get(H_PRICE),
    locales: locales,
  };
}

function post_(rows) {
  var p = props_();
  var res = UrlFetchApp.fetch(p.getProperty("SITE_URL") + "/api/sheet-sync", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ token: p.getProperty("TOKEN"), rows: rows }),
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  var body = {};
  try {
    body = JSON.parse(res.getContentText());
  } catch (e) {}
  if (code !== 200 || !body.results) {
    throw new Error(body.error || "网站回应 " + code);
  }
  return body.results;
}

function stamp_() {
  return Utilities.formatDate(new Date(), "Asia/Taipei", "MM/dd HH:mm");
}

function syncRows_(sh, rowNums) {
  var map = colMap_(sh);
  var rows = [];
  var nums = [];
  rowNums.forEach(function (r) {
    var pl = rowToPayload_(sh, map, r);
    if (pl.slug || pl.name_zh) {
      rows.push(pl);
      nums.push(r);
    }
  });
  if (!rows.length) return;
  var results;
  try {
    results = post_(rows);
  } catch (e) {
    nums.forEach(function (r) {
      sh.getRange(r, map[H_STATUS]).setValue("✗ " + e.message);
    });
    return;
  }
  results.forEach(function (res, i) {
    var msg;
    if (res.status === "ok") {
      msg = "✓ " + stamp_() + " 已更新：" + res.updated.join("、");
    } else if (res.status === "unchanged") {
      msg = "✓ " + stamp_() + " 没有变动";
    } else {
      msg = "✗ " + (res.note || res.status);
    }
    if (res.status === "ok" && res.note) msg += "（" + res.note + "）";
    if (res.status === "unchanged" && res.note) msg += "（" + res.note + "）";
    // 用名称比对到商品时，把 slug 补回表格
    if (res.slug && res.status !== "not_found" && res.status !== "ambiguous") {
      var sc = sh.getRange(nums[i], map[H_SLUG]);
      if (!String(sc.getValue()).trim()) sc.setValue(res.slug);
    }
    sh.getRange(nums[i], map[H_STATUS]).setValue(msg);
  });
}

/** 安装型触发器：编辑任何储存格后，把受影响的列送到网站 */
function onEditInstalled(e) {
  if (!props_().getProperty("TOKEN") || !e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getSheetId() !== sheet_().getSheetId()) return;
  var map = colMap_(sh);
  var status = map[H_STATUS];
  // 只改了「同步状态」栏就不用处理
  if (e.range.getColumn() === status && e.range.getNumColumns() === 1) return;
  var first = Math.max(e.range.getRow(), 2);
  var last = Math.min(e.range.getLastRow(), first + 99);
  var nums = [];
  for (var r = first; r <= last; r++) nums.push(r);
  syncRows_(sh, nums);
}

/** 手动：整张表全部送到网站（每次 50 列） */
function syncAll() {
  var sh = sheet_();
  var last = sh.getLastRow();
  for (var start = 2; start <= last; start += 50) {
    var nums = [];
    for (var r = start; r < Math.min(start + 50, last + 1); r++) nums.push(r);
    syncRows_(sh, nums);
  }
  SpreadsheetApp.getActive().toast("已全部送到网站", "商品同步", 5);
}

// ---------- 网站 → 表格 ----------

function findRow_(sh, map, slug) {
  if (!slug) return 0;
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var col = sh.getRange(2, map[H_SLUG], last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]).trim() === slug) return i + 2;
  }
  return 0;
}

/** 网站呼叫：新增或更新一列（有填的值才写入） */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.token || body.token !== props_().getProperty("TOKEN")) {
      return out_({ error: "unauthorized" });
    }
    var sh = sheet_();
    var map = colMap_(sh);
    var row = findRow_(sh, map, body.slug) || findRow_(sh, map, body.prev_slug);
    if (!row) row = Math.max(sh.getLastRow(), 1) + 1;
    var set = function (h, v) {
      if (v === undefined || v === null || String(v) === "") return;
      sh.getRange(row, map[h]).setValue(v);
    };
    set(H_SLUG, body.slug);
    var locales = body.locales || {};
    set(H_REF, (locales["zh-Hans"] || {}).name);
    LOCALES.forEach(function (loc) {
      var f = locales[loc] || {};
      FIELDS.forEach(function (fd) {
        set(loc + " " + fd.label, f[fd.key]);
      });
    });
    set(H_PRICE, body.price);
    sh.getRange(row, map[H_STATUS]).setValue("↑ 网站更新 " + stamp_());
    return out_({ ok: true, row: row });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
