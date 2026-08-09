# V1.6.1 Floating Panel Workspace Stability Audit

## 目標
保持 Three.js 工作區常駐，讓工具以多個浮動視窗使用，避免工具切換刷新 3D。

## 已驗證
- 3D Canvas 不因工具窗開啟/關閉而重新 mount。
- 同時開啟多個工具窗。
- 工具窗拖曳、Resize、最小化、Dock、Z-order。
- 工具窗布局寫入本機 localStorage，不寫入 Google 工程 JSON。
- 桌面重新整理恢復開啟工具窗；手機僅恢復最後一個工具窗。
- 同一路由重新執行時只刷新該工具窗 Body。
- 重設工具窗可清除本機布局。
