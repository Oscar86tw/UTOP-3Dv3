# V1.4.4

- 淘汰 LOCAL 3D 平面備援顯示，3D 頁面只接受真正 WebGL2 / Three.js 立體 3D。
- 本地 Three.js 路徑改用 import.meta.url + new URL()，避免部署子路徑解析錯誤。
- WebGL2 建立加入兩階段模式：高品質 antialias → 相容模式。
- WebGL2 真正失敗時顯示明確診斷與「重新啟動真正 3D」按鈕，不再假裝成 3D。
- 原有 XYZ / RX RY RZ、Transform Gizmo、設備動畫、雙車道連動全部保留。
