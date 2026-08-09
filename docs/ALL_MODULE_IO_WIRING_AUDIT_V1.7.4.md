# V1.7.4 全模組 DI/DO 接線卡稽核

## 結論
目前 29 類模組定義均具有至少一組 Input 與 Output。

## 接線卡新結構
1. DI / 輸入：來自 module definition `inputs`
2. DO / 輸出：來自 module definition `outputs`
3. 實體端子：來自 module definition `terminals`

因此不會再發生「模組有 DO 功能，但卡片只顯示實體端子所以看不到」的情況。
