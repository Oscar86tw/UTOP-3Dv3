# UTOP-3Dv3 V1.4.8 穩定化檢查

## 本版處理
- Navigation race guard：快速切頁時，舊 3D 掛載結果不再覆蓋新頁。
- Simulator readiness gate：重要 3D 按鈕等待 WebGL 初始化完成後再執行。
- Local project persistence：Save 會真正保存 state 與 devices 到 localStorage；重新載入自動還原。
- Mission timer deduplication：重複按播放不會產生多個計時器。

## 驗證
- 全部 assets/js JavaScript 語法檢查通過。
- simulator3d.js ES Module import 通過。
- 版本與快取參數同步至 V1.4.8。
