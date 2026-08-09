# V1.7.9

- 修正 V1.7.8 主程式已更新但子 ES Module 仍指定 `?v=1.7.7` 的快取混用問題。
- `app.js` 對 views / simulator3d / state-integrity / cloud client 的 import query 全部同步到 V1.7.9。
- Validator 對 connection-runtime 的 import query 同步到 V1.7.9。
- 全專案 Runtime `?v=` 掃描統一為 V1.7.9，避免主檔新版、子模組舊版混合載入。
- `APP_VERSION / APP_VERSION_LABEL / APP_TITLE` 同步為 V1.7.9 Module Cache Sync Hotfix。
