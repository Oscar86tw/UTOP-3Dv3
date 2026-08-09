# UTOP-3Dv3 V1.1.2 Local Three Core Hotfix

## 3D 核心修正
- 將 Three.js r180 真正放入專案：
  - `vendor/three/three.module.min.js`
  - `vendor/three/three.core.min.js`
- 修正原本「本地 Three.js」實際檔案不存在與相對路徑錯誤問題。
- 3D 正式核心現在優先且只依賴專案本地檔案，不再需要外部 CDN 才能啟動。
- 若 WebGL / Three.js 建立仍失敗，自動切換 `core-local3d-01` 備援核心。

## 相容性修正
- Local 3D 不再強制依賴 Canvas `roundRect()`。
- 沒有 `ResizeObserver` 時改用 window resize 備援。
- app / views / simulator / local3d 加入 v1.1.2 快取更新路徑。

## 驗證
- 本地 Three.js ES Module 實際 import 成功，REVISION = 180。
- simulator3d ES Module import 成功。
- 保留 V1.1.1 的 JS Import Hotfix 與 V1.1.0 工作區功能。
