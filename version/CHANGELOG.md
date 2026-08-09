# UTOP-3Dv3 V0.8.0 Signal Trace & Skill Tree

## 新增
- 新增 `core-signal-01/signal-trace.js`
- 新增 Signal Trace：完整鏈 / 上游 / 下游
- 新增 3D Focus Network：相關設備保持高亮，無關設備淡化
- 3D Connection 線加入 Connection ID，可精準對應追蹤結果
- 新增 Dependency Skill Tree，自動依 Connection 生成節點深度與依賴
- 圖表/流程頁可直接指定設備與追蹤方向，再切到 3D 顯示
- Mission 頁的依賴節點改為由目前專案設備與 Connection 自動建立

## 改善
- 地感事件亮線與 Focus Network 顯示分離，追蹤模式優先顯示追蹤結果
- 修正 V0.7.0 app.js 中殘留的重複模組按鈕監聽，避免呼叫不存在的舊函式

## 延續
- 保留 3D 模組庫、模組參數、端子系統、Wiring、2D/3D同步與車輛方向修正
