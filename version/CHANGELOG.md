# V1.5.1

## Cloud Project & 3D UX Fix
- 修正 3D 視角操作後被拉回預設位置：相機 yaw / pitch / radius / target 會保存到 `state.simulator.liveCamera`。
- 取消 3D 啟動時自動 `focusFloor()`。
- 名稱牌高度改為依設備本體頂部計算，並加入高度限制。
- 對面橘色出口車預設隱藏。
- 預設設備、設備座標、Runtime、Hotkey、Connection 全部清空；設備由模組庫自行加入。
- 快捷鍵選單不再在 change 後重新 render 整頁。
- 3D 工作區新增場景 / 視野 select，原地切換，不重新掛載 3D。
- 新增 Google 雲端專案管理：Drive JSON + Sheets 索引 + Apps Script Web App。
- 新增舊版 localStorage 專案手動匯入功能。
