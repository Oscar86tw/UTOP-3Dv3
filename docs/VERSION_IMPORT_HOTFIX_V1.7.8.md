# V1.7.8 Version Import Hotfix

## 原錯誤
`ReferenceError: APP_VERSION_LABEL is not defined`

## 根因
`views.js` 在 `renderOverview()` / `renderProject()` 使用 `APP_VERSION_LABEL` 與 `SCHEMA_VERSION`，但沒有從 `core-version-01/version-info.js` 匯入。

## 修正
- views.js 補上版本常數 import。
- 所有 version-info.js query cache 統一 V1.7.8。
- index.html app.js/app.css cache 統一 V1.7.8。
