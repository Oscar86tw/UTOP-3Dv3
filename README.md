# UTOP-3Dv3 V1.1.0 Offline 3D Workspace

本版重點是讓 3D 工作區不再因 CDN 或外部 Three.js 載入失敗而整個無法使用。

## 啟動順序
1. 嘗試專案 Three.js 路徑
2. 嘗試外部 Three.js 來源
3. 若全部失敗，自動啟動專案內建 `Local 3D` 備援核心

Local 3D 會直接讀目前 UTOP 的 `devices`、`deviceTransforms`、`connections`、`signalTrace` 與 `deviceRuntime`，因此不是獨立示意畫面，而是同一份專案資料的備援 3D 工作區。
