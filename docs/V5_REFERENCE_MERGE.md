# V5.1.3.27 Reference Merge

## 已移植的操作概念
- 左模組庫 / 中央 Workspace / 右 Inspector。
- 模組庫分類、圖片卡片與搜尋。
- 設備 Inspector 五分頁。
- 選取設備後顯示對應控制。
- 兩區 / 3D / 2D / 3D滿版切換。
- 模組圖片資產與模組化定義概念。
- 每台設備獨立 runtime 與控制。

## 目前新版保留的能力
- Connection 資料模型。
- Signal Trace / Skill Tree。
- 新版卡片式接線。
- 2D/3D 共用設備 Transform。

## 後續逐步深化
V5 共有大量舊 runtime、場景插件、儲存與 Debug 邏輯。本版以操作流程與核心資產為第一輪整合，不直接把舊 runtime 464 個檔案原封不動覆蓋，以避免破壞目前新版核心。後續可再逐項對照補入場景插件、道路標線、針球連線、雲端儲存等成熟功能。
