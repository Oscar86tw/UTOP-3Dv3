# UTOP-3Dv3 V0.2.0

## 啟動方式
本專案是靜態 Web，可部署至 GitHub Pages / Netlify。
本機測試請使用 HTTP server，不建議直接雙擊 file:// 開啟：

```bash
python -m http.server 8080
```
然後開啟 `http://localhost:8080/`。

## V0.2.0 重點
- Three.js WebGL 3D 車道模擬
- W/A/S/D / 方向鍵 / 手機觸控駕駛
- 地感自動觸發柵欄機
- ETAG、DI/DO 曲線、感應區
- Saved Viewpoints / 跟車視角
- 模組快捷鍵
- 原 V0.1.0 手機介面、任務、場景、多螢幕、工程與 Debug 保留

## 外部依賴
3D 核心在執行時由 jsDelivr 載入 Three.js 0.180.0。若現場無外網，3D 頁會顯示離線提示；後續正式版可改為本地 vendor 套件。

## 檔案數規範
任一單一資料夾不得超過 90 個檔案。達到約 80–85 個即應提前拆分。
