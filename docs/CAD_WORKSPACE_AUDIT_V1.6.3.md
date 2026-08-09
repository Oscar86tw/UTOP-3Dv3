# UTOP-3Dv3 V1.6.3 CAD Workspace Layout Audit

## 本版目標
延續 Persistent Workspace，讓工具窗具有接近 CAD / 3D 工程軟體的停靠與工作區版型能力，且不重建 Three.js Canvas。

## 新增 / 調整
- 浮動工具窗吸附循環：浮動 → 右側 → 左側 → 下方 → 上方 → 浮動。
- 同一停靠側有多個工具窗時，自動分欄 / 分列配置，避免重疊。
- 停靠窗仍可最小化、置頂、關閉。
- 新增工作區版型：保存、套用、刪除。
- 工作區版型保存項目：工具窗開啟清單、工具窗位置/尺寸/停靠邊、模組庫與設備設定布局、左右抽屜開啟狀態。
- 工作區版型只存在本機 localStorage，不寫入 Google 工程專案。
- 手機版維持單欄底部浮窗，不強制使用桌面四邊停靠。

## 核心原則
- 工具窗布局變更不呼叫 unmountSimulator3D()。
- Three.js Canvas 持續存在。
- 工程 state 與本機工作桌 layout 分離。

## 檢查
- 全部 assets/js JavaScript：node --check PASS。
- Google Apps Script Code.gs：暫存 .js node --check PASS。
- 工作區停靠狀態資料：dockEdge = left/right/top/bottom/空白。
- 工作區版型資料不進入 cloudSerializableState()。
