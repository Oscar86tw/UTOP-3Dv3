# V1.6.9 Barrier Arm Pivot Hotfix

## 修正內容
- `boomLength` 變更時，柵欄機桿體中心位置會同步更新為 `-boom/2`。
- 桿底黑色下緣件會同步更新為 `-boom/2 - 0.06`。
- 端蓋位置固定在桿尾端。
- 條紋超出實際桿長範圍時會自動隱藏，避免視覺延伸錯亂。

## 影響檔案
- assets/js/core-3d-01/device-model-factory.js
- version/version.json
- version/CHANGELOG.md
- README.md
- 版本說明.txt
