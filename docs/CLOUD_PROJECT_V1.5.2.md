# Google 雲端專案 V1.5.2

## 操作流程
1. 部署 `google-apps-script/Code.gs` 為 Web App。
2. 在 UTOP 專案頁貼上 `/exec` 網址。
3. 按「測試連線」與「雲端自我檢查」。
4. 建立空白專案或編輯目前場景。
5. 輸入專案名稱後按「儲存到 Google」。
6. 使用「重新整理清單」後可開啟或刪除 Google Drive 專案。

## V1.5.2 保護
- 專案更新採用 updatedAt 版本檢查。
- 多分頁或其他裝置已更新同一專案時，舊畫面儲存會提示衝突。
- Apps Script 使用 LockService 避免同時寫入。
- Load/Delete 僅接受指定 UTOP Drive 資料夾中的 `.utop3d.json`。
- 可使用「重建索引」重新同步 UTOP3D_Projects 工作表。
