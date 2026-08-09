# V1.7.1 Global Select Stability Audit

## 設計
- 原生 `<select>`：保留資料與事件邏輯，但隱藏操作介面。
- `.utop-select-trigger`：使用者實際點擊的選單按鈕。
- `.utop-select-popover`：固定在 body 最上層的選項清單，不受浮窗 overflow / contain / pointer drag 影響。
- MutationObserver：任何動態 Render 新增的 Select 都會自動升級。

## 適用範圍
- 手動情境調整：地點 / 時間 / 天氣 / 事件
- 3D 快速場景 / 視野
- 樓層 / 群組
- 快捷鍵設備與功能
- 模組分類
- 設備設定
- Road Marking
- Signal Trace
- Google Drive 專案清單
- 工作區版型

## Cache
- index.html CSS / app.js query string 同步為 V1.7.1。
