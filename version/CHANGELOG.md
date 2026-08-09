# UTOP-3Dv3 V1.1.0 Offline 3D Workspace

## 核心修正
- 新增 `core-local3d-01/local3d.js` 本地 3D 備援核心。
- Three.js 本地/外部來源全部失敗時，不再顯示空白 `3D OFFLINE`，會自動進入 Local 3D。
- Local 3D 不依賴 CDN，可直接使用目前專案的設備座標、Connection、Signal Trace 與 Runtime 狀態。

## Local 3D 可用功能
- 設備選取
- 拖移設備位置
- 車輛前進 / 後退 / 左 / 右
- 接線曲線顯示
- Focus Network 淡化/高亮
- 柵欄、地感、ETAG 等基本 Runtime 控制

## 工作區
- 3D 維持寬滿版。
- 左側模組庫與右側設備設定維持浮動抽屜，不縮小中央 3D。
- 保留 V5 風格 Workspace：3D、2D、兩區、3D滿版。
