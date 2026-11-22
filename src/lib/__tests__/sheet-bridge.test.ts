import { describe, expect, it } from "vitest";
import { cleanText, parseBridgePrice, tokenMatches } from "../sheet-bridge";

describe("sheet-bridge helpers", () => {
  it("parseBridgePrice 容許符號與千分位，拒絕 0／負數／非數字", () => {
    expect(parseBridgePrice("¥1,200")).toBe(1200);
    expect(parseBridgePrice("650 元")).toBe(650);
    expect(parseBridgePrice(550)).toBe(550);
    expect(parseBridgePrice("0")).toBeNull();
    expect(parseBridgePrice("-5")).toBeNull();
    expect(parseBridgePrice("abc")).toBeNull();
    expect(parseBridgePrice("")).toBeNull();
  });
  it("tokenMatches 長度或內容不同都不通過，空密鑰永遠不通過", () => {
    expect(tokenMatches("abc123", "abc123")).toBe(true);
    expect(tokenMatches("abc124", "abc123")).toBe(false);
    expect(tokenMatches("abc", "abc123")).toBe(false);
    expect(tokenMatches("", "")).toBe(false);
  });
  it("cleanText 統一換行並去頭尾空白", () => {
    expect(cleanText("  a\r\nb \r")).toBe("a\nb");
    expect(cleanText(undefined)).toBe("");
  });
});
