# V1.4.9

- 新增 State Migration / Integrity Repair，舊 localStorage 專案資料自動補齊新版必要欄位。
- 新增功能狀態驗證中心：檢查設備六軸、Settings、Runtime、Hotkey、Connection、道路、場景、樓層、WebGL、Simulator API、本機儲存。
- 3D 控制、Editor Mode、Snap、DI/DO線、感應區、跟車視角改為等待 Simulator Ready 後執行。
- 快捷鍵設備控制同樣使用 Simulator Ready 保護。
- 真正 WebGL 啟動後寫入 Runtime Health 狀態。
