# V1.7.5 Live IO Wiring Status

## 行為
- DI：藍色脈衝，高亮時顯示 ON。
- DO：橘色脈衝，高亮時顯示 ON。
- Connection：訊號經過時顯示「● 訊號傳遞中」。
- 狀態結束後自動回 OFF / 待命。

## 技術
- 使用既有 `state.activeSignals` 與 `deviceRuntime.io`。
- 工程/接線面板採 110ms DOM 狀態刷新，不重新生成面板 HTML。
- 因此保留捲動、端子 Builder 選取、浮窗位置。
