# UTOP-3Dv3 V1.7.20 — 3D Signal Graph

## 本版重點
- 圖表／流程新增 3D Signal Graph。
- 設備為主節點，DI / DO 為分支節點。
- Connection 依 DI / DO / POWER / COMM 類型顯示不同訊號色。
- activeSignals 觸發時，連線出現發光與流動光點。
- Runtime 的 VEH-ID 會顯示在正在傳遞的路徑與設備節點。
- 支援全部系統／目前 Trace／只看傳遞中三種顯示模式。
- 點擊節點選取設備，雙擊節點可返回 3D 場景定位設備。
- 保留原本 Signal Trace、Dependency Skill Tree 與卡片式接線圖。

## 操作
- 拖曳：旋轉 Graph
- 滾輪：縮放
- 點節點：選取設備
- 雙擊節點：定位到 3D 場景設備

## 設計原則
3D Signal Graph 與卡片接線圖共用 state.connections、deviceRuntime、activeSignals 與 signalTrace，不建立第二套假資料。
