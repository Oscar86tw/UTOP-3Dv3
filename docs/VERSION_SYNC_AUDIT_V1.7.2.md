# V1.7.3 Version Sync Audit

## 同步項目
- index.html title
- 首頁 projectMeta
- Overview 目前整合版
- Project / Debug 整合版本
- 3D 啟動提示
- Google Cloud Client clientVersion
- Apps Script service version
- CSS / JS / ES Module cache query
- version/version.json
- README / CHANGELOG / 版本說明

## 防止再次不同步
新增 `assets/js/core-version-01/version-info.js` 作為主要前端版本常數來源，Function State Audit 加入「版本同步」檢查。
