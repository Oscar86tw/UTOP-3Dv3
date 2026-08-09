# UTOP-3Dv3 Google 雲端專案服務

1. 在 UTOP-3D 專用 Google Sheet 的 Apps Script 專案貼上 `Code.gs`。
2. 確認 `DRIVE_FOLDER_ID` 與 `SPREADSHEET_ID`。
3. 部署 > 新增部署 > 網頁應用程式。
4. 執行身分選擇擁有者；存取權限依你的使用環境設定。
5. 把部署後 `/exec` 網址貼到 UTOP-3Dv3「專案 / Debug > Google 雲端」設定。

資料會以 `.utop3d.json` 儲存在指定 Drive 資料夾，Sheet `UTOP3D_Projects` 保存索引。
