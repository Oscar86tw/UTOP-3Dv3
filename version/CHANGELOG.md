# UTOP-3Dv3 V0.9.0 Wiring Card Builder

## 新增
- 工程頁新增 **卡片式接線圖**
- 每個模組顯示為獨立卡片並列出端子群組
- 支援點選端子建立接線：先點來源，再點目標
- 新增接線建構器狀態顯示與清除按鈕
- 新增從接線卡片或接線清單直接切到 3D 顯示

## 改善
- 接線資料仍共用 `state.connections`，可被 3D Signal、Signal Trace 與 Skill Tree 共用
- 端子以輸入 / 輸出 / 通訊 / 電源分類顯示，手機更容易操作

## 延續保留
- 車輛方向 hotfix 保留
- 3D 模組庫、Signal Trace、Skill Tree 保留
