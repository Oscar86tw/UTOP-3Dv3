# UTOP-3Dv3 V0.7.0 Module Designer & Wiring

## 3D 模組庫
- 新增搜尋欄與分類篩選。
- 新增模組圖形縮圖，手機上更容易辨識。
- 模組加入後仍可立即選取、拖移、旋轉、刪除。

## 模組參數
- 新增通用尺寸：寬、高、深。
- 柵欄機：桿長、速度。
- ETAG/UHF：讀取距離、水平角。
- Camera：有效距離、FOV。
- 顯示每個模組支援的端子清單。

## Wiring
- 新增 `state.connections` 正式連線資料。
- 工程頁可選擇來源設備/端子與目標設備/端子建立連線。
- 可刪除連線。
- 3D DI/DO / Signal 線改為依 Connection 自動繪製。
- 後續 Signal Trace、Mission、Skill Tree 可直接沿用同一份連線資料。

## 修正
- 保留 3D 車輛前進/後退正確方向。
