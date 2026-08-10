# V1.7.16 Vehicle Sensor Identity Runtime

## 完成項目
- UHF、LPR、Radar、紅外線感應全部車輛，Runtime 顯示 VEH-ID。
- Connection Signal 保留來源 VEH-ID，後續控制器、Relay、柵欄等可追蹤來源車輛。
- 柵欄機 SAFETY 區域掃描全部車輛；關閉時有車即重新開啟。
- 自動關閉倒數於安全區有車時暫停。

## 感應模型
此版本使用工程模擬用幾何感應區判斷，不宣稱為原廠射頻或影像辨識精度模型。設備的 range / angle / fov 設定用於 3D 模擬範圍。
