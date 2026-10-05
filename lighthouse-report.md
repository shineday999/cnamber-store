# cnamber-store Lighthouse 跑分報告 (2026-10-04)

測試時間:2026-10-04T20:25:49
Preset:desktop (default) | Chrome headless

## home.report

- **performance**:65/100 ⚠ 中等
- **accessibility**:92/100 ✓ 良好
- **best-practices**:100/100 ✓ 良好
- **seo**:100/100 ✓ 良好

- FCP:3.8 s | LCP:11.9 s | CLS:0 | TBT:0 ms

## pagecart.report

- **performance**:79/100 ⚠ 中等
- **accessibility**:90/100 ✓ 良好
- **best-practices**:100/100 ✓ 良好
- **seo**:100/100 ✓ 良好

- FCP:3.9 s | LCP:3.9 s | CLS:0 | TBT:0 ms

## pageproducts.report

- **performance**:71/100 ⚠ 中等
- **accessibility**:90/100 ✓ 良好
- **best-practices**:100/100 ✓ 良好
- **seo**:100/100 ✓ 良好

- FCP:3.9 s | LCP:5.2 s | CLS:0.002 | TBT:10 ms

## 改善建議 (Top 3)

1. Performance:看 LCP 是否 < 2.5s,hero 圖用 picture preload (Wave 64 已 ship)
2. Accessibility:確保所有 img 有 alt + button 有 aria-label
3. Best Practices:確認 HTTPS / no console errors / no deprecated APIs

## 後續

完整 HTML 報告在 /tmp/lh-reports/lh*.report.html (本機存)
