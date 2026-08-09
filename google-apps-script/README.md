# UTOP-3Dv3 Google 雲端專案服務

1. 在 UTOP-3D 專用 Google Sheet 的 Apps Script 專案貼上 `Code.gs`。
2. 確認 `DRIVE_FOLDER_ID` 與 `SPREADSHEET_ID`。
3. 部署 > 新增部署 > 網頁應用程式。
4. 執行身分選擇擁有者；存取權限依你的使用環境設定。
5. 把部署後 `/exec` 網址貼到 UTOP-3Dv3「專案 / Debug > Google 雲端」設定。

## 這個 Google Sheet 是不是橋接？
是，可以把你提供的試算表當作 **橋接索引層**：

- **Google Drive 資料夾**：真正存放每一個專案的 `.utop3d.json` 檔。
- **Google Sheet（UTOP3D_Projects）**：當作索引表，記錄 `projectId / projectName / fileId / updatedAt / version`。
- **Apps Script Web App**：前端網頁和 Google Drive / Sheet 之間的橋接 API。

也就是說：
- 專案內容本體放在 **Drive**
- 專案清單、查詢、同步比對放在 **Sheet**
- 前端存檔 / 開啟 / 刪除 透過 **Apps Script** 呼叫

## 目前流程
- `save`：把目前專案狀態寫入指定 Drive 資料夾，並同步更新 Sheet 索引。
- `list`：列出 Drive 內專案，前端可直接顯示。
- `load`：依 `projectId` 載入對應 JSON。
- `delete`：刪除 Drive 檔案並同步清除索引。
- `verifyWrite / selfTest / repairIndex`：用來驗證寫入權限與修復索引。
