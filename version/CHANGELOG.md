# V1.7.6

- 新增全域錯誤覆蓋層：JavaScript 錯誤、Promise rejection、WebGL 啟動錯誤都會直接顯示在畫面。
- 新增 Boot Watchdog：5 秒後工作區仍空白時，自動顯示診斷資訊。
- 啟動階段加入 Phase Log，可看到卡在哪一個初始化步驟。
- 錯誤畫面提供「複製錯誤資訊」、「重新載入」、「清除工作區設定後重載」。
- app.js 啟動 Promise 改成 try/catch，不再讓初始化失敗變成純白畫面。
- 版本與快取參數同步為 V1.7.6。
