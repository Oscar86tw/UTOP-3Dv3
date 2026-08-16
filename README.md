# UTOP-3Dv3 V1.7.3 Official Module Behavior

本版延續 Persistent Workspace / CAD Workspace，強化設備 Transform 操作：可隱藏 3D 編輯操作線、RX/RY/RZ 提供 0/90/180/270 快速角度、XYZ 提供 -100～+300 即時拉桿。Google 雲端專案管理與浮動/停靠工具桌皆保留。


## V1.6.5
- 柵欄機新增左桿/右桿。
- 桿長由機箱樞紐點往車道方向延伸。
- 3D 畫質與光影品質提升。


## V1.6.6
- 升級場景材質與燈光，讓車道展示更接近實景。
- 車輛模型增加輪胎、玻璃、車尾等細節。
- Google Apps Script 橋接文件更新，明確區分 Drive 與 Sheet 的角色。


## V1.6.8
- 常用車道設備 3D 模型深化。
- 強化金屬、反光、燈罩、面板與發光材質。
- 保留所有既有工程操作與 Google 雲端。


## V1.6.8
- DI/DO 改為短暫脈衝觸發並自動回 OFF。
- 柵欄機新增可設定 5 秒起跳的自動關閉倒數。
- 修正 Persistent Workspace 中原生下拉選單容易立即收回的問題。


## V1.6.9
- 修正柵欄機桿長以機箱樞紐點為固定起點。
- 桿子不再左右同時增長，而是只往外延伸。


## V1.7.0
- 實體碰撞 / 樓層落地。
- 右桿升桿方向修正。
- 長距離紅外線與強化車道紅綠燈。
- Google 雲端完整儲存範例。


## V1.7.1
- 全站下拉選單改成 UTOP 自訂穩定選單，解決一點就收回。
- 修正 index 快取版本。


## V1.7.3
- 全系統版本顯示同步。
- 新增中央版本資訊模組與 Debug 版本同步檢查。


## V1.7.4
- 所有模組接線卡改為 DI / DO / 實體端子三層。
- 29 類模組全部檢查 DI/DO 定義。


## V1.7.5
- 接線卡新增 DI/DO 即時 ON/OFF 與 Connection 傳遞高亮。


## V1.7.7
- 新增全域錯誤畫面與 Boot Watchdog。
- 啟動失敗不再只顯示白畫面。


## V1.7.8
- 修正 views.js 版本常數未 import 的啟動錯誤。


## V1.7.9
- 全面同步 ES Module 快取版本，避免 app.js 新版但 views.js / simulator3d.js 還讀舊版。


## V1.7.11
- 新增部署版本一致性檢查，避免 GitHub Pages 混合載入舊版 index / app / views。


## V1.7.12
### 3D Module Reactions & Vehicle Types
- 所有 3D 模組都有可視 Runtime 反應；有專用燈號/機構者優先使用專用反應，其他使用狀態指示燈。
- 地感線圈感應車輛時，線圈與偵測燈會明顯亮起。
- 地感檢知器支援 POWER / DETECT / PULSE / FAULT LED。
- 車種可切換「汽車 / 機車」，兩者使用不同 3D 模型與碰撞尺寸。
- 地感判斷使用車體 Bounding Box。

## V1.7.15

- 車輛可選汽車／機車，車道可選混合／汽車／機車。
- 地感依車體重疊比例與地感檢知器靈敏度判斷。
- 3D HUD 與地感 LED 可直接顯示偵測成功或感應不足。


## V1.7.15
- Debug 版本同步不再依賴會被 Google 儲存狀態覆蓋的顯示文字。
- 新增獨立 projectStatus；版本欄固定保存版本識別。
- 部署 Manifest 未完成讀取時不誤判 FAIL；確定版本不同才失敗。


## V1.7.20 Vehicle Identity & Access Profiles
- UHF、LPR、Radar、紅外線掃描全部可見車輛並記錄 VEH-ID。
- VEH-ID 沿 Connection Runtime 傳遞到後續設備與事件紀錄。
- 柵欄機關閉時桿下有車觸發 SAFETY 並重新開啟。
- 自動關閉倒數在安全區有車時暫停，車離開後繼續。


## V1.7.18 Vehicle Identity & Access Profiles
每台車輛可設定車牌、eTag、住戶/訪客/廠商/黑名單、允許/拒絕、可通行車道與備註。UHF 與 LPR 會依設定輸出成功或失敗訊號。


## V1.7.20 車輛通行決策鏈
工程/接線頁可建立標準通行鏈：UHF/LPR 授權成功走 Controller DI1 → DO1 → Relay → Barrier OPEN；拒絕走 DI2 → DO2 → 警示。訊號全程保留 VEH-ID 與授權原因。
