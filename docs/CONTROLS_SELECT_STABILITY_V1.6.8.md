# Controls / Select Stability Audit V1.6.8

## DI / DO
- 預設 OFF
- 點擊後 ON 脈衝
- 450ms 自動回 OFF
- DI ON 時執行該端子對應動作
- DO ON 時沿 Connection 傳遞一次訊號
- 29 類模組共用同一 `simulateIo()` 核心

## Barrier Auto Close
- `autoCloseEnabled`: boolean，預設 false
- `autoCloseSeconds`: number，預設 5 秒
- 柵欄完全開啟後才開始倒數
- 倒數完成呼叫標準 `close` 動作
- STOP / RESET / CLOSE / SAFETY 會取消目前自動關閉倒數

## Select Stability
- 浮動工具窗 pointer capture 不再碰 select / option / input / textarea / button / label / link
- 移除 floating tool window 的 layout/style containment，避免原生下拉互動異常
- quick Scene / View 控制尺寸放大
