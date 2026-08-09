# V1.5.4 Interaction Stability Audit

## 本版檢查
- 規格參數：輸入後 120ms debounce 即時寫入 state 並套用到 Three.js。
- Inspector：設備控制 / DI/DO 後重新整理時保留捲動位置。
- DI/DO：沿用 V1.5.3 simulateIo 與 Connection 傳遞。
- 3D：名稱牌 Bounding Box 高度只在幾何/偏移變更時重新計算，不再每 frame 計算。
- Cloud：ping / selfTest / verifyWrite / list / save / load / delete / repairIndex API 保留，clientVersion 更新為 1.5.4。
