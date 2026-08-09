# UTOP-3Dv3 V1.6.1 Floating Panel Workspace Stability

本版將原本多頁切換改為「單一持續工作區 + 抽屜 / 浮動工具窗」。Three.js 3D Canvas 在操作期間保持掛載，開啟場景、快捷鍵、接線、Debug、Google 雲端等工具時不再卸載或重新建立 3D。

重點：
- 3D 工作區持續存在，不因工具切換刷新。
- 功能頁改成可拖曳、縮放、最小化、靠右的浮動工具窗。
- 模組庫與設備設定改為顯示/隱藏，不重新建立 WebGL Canvas。
- Google 雲端專案管理保留在浮動工具窗，可在 3D 保持原視角時儲存/開啟/刪除。
