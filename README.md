# UTOP-3Dv3 V1.0.0 Legacy Workflow Merge

本版以使用者提供的 **UTOP V5.1.3.27** 為主要操作與功能參考，將舊版成熟工作流程移植到目前 UTOP-3Dv3 架構，同時保留新版 Connection、Signal Trace、Skill Tree 等核心。

## 3D 工作區
- 左側：模組庫，可搜尋、分類、加入設備、收合。
- 中央：寬滿版 3D / 2D 工作區。
- 右側：設備設定抽屜，可收合。
- 工作區模式：兩區 / 看3D / 看2D / 3D滿版。

## 模組
目前建立 29 類模組定義，並沿用 V5 模組 SVG 圖片資產。每個模組定義包含：
- 名稱 / 型號
- 圖片
- 功能與控制
- 工程參數
- 實體尺寸
- DI / DO
- 端子
- runtime 狀態

點選 3D 設備後，可直接開啟該設備的相關設定與控制。

## 快捷鍵
快捷鍵改為「設備 + 功能」層級：
1. 選設備。
2. 選該設備實際擁有的功能。
3. 直接按下想設定的鍵。

所有設備預設都沒有快捷鍵，不會因模組數量增加而自動佔用按鍵。

## 接線與分析
仍使用新版核心：
- 卡片式端子接線
- `state.connections`
- 3D Signal
- Signal Trace
- Focus Network
- Skill Tree

## 部署注意
3D 核心會依序嘗試本地 Three.js、unpkg、jsDelivr、esm.sh。若部署環境完全禁止外部 CDN，需再把 Three.js module 本體放入 `assets/vendor/three/`。
