# V1.7.9 Module Cache Sync Audit

## 問題來源
V1.7.8 的 `index.html` 已載入 `app.js?v=1.7.8`，但 `app.js` 仍載入：
- `views.js?v=1.7.7`
- `simulator3d.js?v=1.7.7`
- `state-integrity.js?v=1.7.7`
- `google-cloud-projects.js?v=1.7.7`

因此瀏覽器會形成「主模組新版 + 子模組舊版」的混合 Runtime。

## 修正
- 所有 Runtime `?v=` query 統一為 `1.7.9`。
- version-info 統一為 V1.7.9。
- 版本掃描要求：Runtime JS / index 中不得殘留 V1.7.7 / V1.7.8 query。

## 驗證方式
部署後若再出錯，診斷的 URL 應同時看到：
- `app.js?v=1.7.9`
- `views.js?v=1.7.9`
- 其他子模組也為 `?v=1.7.9`
