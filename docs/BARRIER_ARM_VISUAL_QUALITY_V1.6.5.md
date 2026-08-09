# BARRIER ARM / VISUAL QUALITY AUDIT V1.6.5

## 完成項目
- 柵欄機規格頁新增 `barrierArmSide`：`left` / `right`
- `boomLength` 維持從機箱樞紐點開始往外延伸
- `applyModuleSettings` 與即時 `change` 都會同步 `armSide`
- Three.js Renderer 啟用：
  - ACES Filmic Tone Mapping
  - physicallyCorrectLights
  - 2048 shadow map
  - 改善 pixel ratio / fill light / material roughness

## 影響檔案
- assets/js/views.js
- assets/js/app.js
- assets/js/core-3d-01/simulator3d.js
- version/version.json
- version/CHANGELOG.md
- README.md
- 版本說明.txt

## 測試重點
1. 柵欄機切換左桿 / 右桿，桿子方向要正確翻轉。
2. 修改桿長時，應從機箱樞紐點向外延伸，而不是向兩側平均縮放。
3. 畫面需保留 WebGL 3D，且不得影響既有移動 / 旋轉 / 控制功能。
