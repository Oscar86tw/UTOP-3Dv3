# V1.7.6 Global Error & Boot Diagnostics

## 目的
任何 UTOP 啟動錯誤都必須在使用者畫面上可見。

## 捕捉範圍
- window.onerror
- unhandledrejection
- app boot Promise
- Persistent Workspace Render
- Three.js 本地模組載入
- WebGL Simulator 建立
- 5 秒空白畫面 Watchdog

## 錯誤畫面資訊
- 版本
- 啟動階段
- app.js 是否開始
- Workspace 是否建立
- Simulator 是否 Ready
- WebGL2 支援
- 網址 / User Agent
- 啟動階段記錄
- Error stack / 檔案 / 行列

## 操作
錯誤畫面可直接：
1. 複製錯誤資訊
2. 重新載入
3. 清除本機工作區布局後重新載入
