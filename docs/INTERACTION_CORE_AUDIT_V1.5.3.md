# V1.5.3 Interaction Core Audit

## 修正範圍
- 模組規格參數輸入與套用
- DI / DO 手動模擬
- 29 類模組定義完整性
- 3D Unified 選取 / 拖移 / 旋轉
- 3D Frame rebuild / flicker
- Google Drive 寫入權限驗證

## 驗證結果
- MODULE_DEFINITIONS：29 / 29 PASS
- 每類模組具備 controls / inputs / outputs / parameters 陣列：PASS
- 所有 parameter 預設值為有效數字：PASS
- simulator3d.js ES Module import：PASS
- Google Cloud client verifyWrite request：PASS（mock transport）
- Apps Script verifyWrite_ handler：存在，語法 PASS
- 3D animation frame 不再呼叫 ensureDevices()：PASS
- Unified editor mode migration：PASS
- DI/DO simulateIo API：PASS（靜態/API存在驗證）

## Google 雲端實機驗證方式
因測試環境沒有使用者已部署的 Apps Script `/exec` 網址，無法替使用者執行其 Google 帳號的實際 Drive 寫入。
V1.5.3 專案頁新增「測試儲存權限」。部署新版 Code.gs 後，按此按鈕會：
1. 在指定 Drive 資料夾建立臨時檔。
2. 讀回並驗證內容。
3. 將臨時檔移到垃圾桶。
只有三步皆成功才顯示 Google Drive 寫入／讀取／刪除權限正常。
