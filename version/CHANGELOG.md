# UTOP-3Dv3 V0.9.1 3D Core Loading Hotfix

## 修正
- 修正 3D 核心載入只依賴單一 jsDelivr CDN 的問題。
- Three.js 改為多來源備援載入：本地 → jsDelivr → unpkg → esm.sh。
- 若某一來源失敗，會自動切換下一個來源，不再立即讓 3D 整頁失效。
- 若所有來源都失敗，畫面會列出各來源失敗原因，方便後續診斷。

## 保留
- V0.9.0 卡片式接線圖
- 3D 模組庫
- Signal Trace / Skill Tree
- 車輛四方向控制修正
