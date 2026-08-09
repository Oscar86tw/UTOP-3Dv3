# V1.4.5

- 修正 `Cannot access loopOn before initialization`。
- 同步把 selectedId、editor/runtime state 提前初始化，避免下一個 TDZ 啟動錯誤。
- 保留 True WebGL Only，不恢復 Local 3D 平面備援。
- 更新快取參數至 1.4.5。
