# UTOP-3Dv3 V0.9.1 3D Core Loading Hotfix

這一版專門修正「3D 核心載入失敗」。

Three.js 不再只使用單一 jsDelivr 來源，而是依序嘗試：
1. 專案本地 Three.js（若未來有放入）
2. jsDelivr
3. unpkg
4. esm.sh

其中一個成功後就會直接啟動 3D；全部失敗時會顯示每一個來源的錯誤訊息。
