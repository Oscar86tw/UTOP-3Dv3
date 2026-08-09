# UTOP-3Dv3 V1.1.2 Local Three Core Hotfix

本版專門修正「3D 核心載入失敗」。

## 根因
前一版雖然程式會先嘗試「本地 Three.js」，但壓縮檔內沒有真正的 Three.js 核心檔，且相對路徑也不正確，因此仍會落到外部 CDN；當 CDN 無法使用時就會顯示 3D 核心載入失敗。

## 本版修正
- Three.js r180 已真正打包至 `vendor/three/`
- 使用本地 `three.module.min.js` + `three.core.min.js`
- 不再把外部 CDN 當正式 3D 核心依賴
- WebGL 無法建立時自動切 Local 3D 備援核心
- 加入快取版本參數 v1.1.2

部署 `1.完整程式碼` 即可。
