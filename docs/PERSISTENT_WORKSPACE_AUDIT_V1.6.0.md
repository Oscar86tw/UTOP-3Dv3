# V1.6.0 Persistent Workspace Audit

## 核心變更
- Three.js Simulator 僅在 Persistent Workspace 首次建立時 mount。
- 開啟總覽、2D同步、場景、樓層、快捷鍵、多螢幕、任務、接線、網路、圖表、現場、專案/Debug 時，不再 unmount 3D。
- 工具頁改為 Floating Tool Window，支援拖曳、resize、最小化、靠右與關閉。
- 模組庫 / 設備設定使用顯示與隱藏，不以整頁 render 開關。
- 新增模組後直接呼叫現有 Simulator 的 applyProjectState，不重新建立 Canvas。

## 驗證
- 13 個 render route 均可輸出。
- app.js / views.js / simulator3d.js / cloud client / validator 語法檢查通過。
- Apps Script Code.gs 以暫存 .js 進行語法檢查通過。
- 專案程式不再在 go(route) 中呼叫 unmountSimulator3D。
- Persistent Workspace 中 Three.js mount 入口只有首次 ensurePersistentWorkspace。
