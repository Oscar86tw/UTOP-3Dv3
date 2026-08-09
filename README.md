# UTOP-3Dv3 V1.4.5 Startup Order Hotfix

修正真正 WebGL 3D 啟動時的 JavaScript TDZ 初始化順序錯誤：`loopOn` / `selectedId` 等 Runtime 狀態現在會在 `ensureDevices()` 與 `applyTraceFocus()` 首次執行前完成宣告。
