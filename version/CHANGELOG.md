# V1.7.4

- 接線卡片改為固定顯示「DI / 輸入」「DO / 輸出」「實體端子」三層。
- 29 類模組全部依模組定義顯示自己的 Inputs / Outputs，不再只依 physical terminals 猜測。
- 柵欄機現在完整顯示 OPEN/CLOSE/STOP/SAFETY/RESET 與 FULLY_OPEN/FULLY_CLOSED/RUNNING/FAULT。
- `connectableTerminals()` 擴充支援功能 I/O 訊號，可直接用功能訊號建立 Connection。
- Debug Function State 增加「全模組 DI/DO 定義」檢查。
