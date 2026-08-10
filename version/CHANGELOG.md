## V1.7.18
- 新增每台車輛的車牌、eTag、身分類型、通行授權、可通行車道與備註。
- UHF / eTag 依車輛資料判斷 TAG_OK / TAG_FAIL。
- LPR 依車牌與授權判斷 PLATE_OK / PLATE_FAIL。
- VEH-ID、車牌與授權結果保留在 Runtime，並沿 Connection 傳遞。
- 舊專案自動補齊車輛身份欄位。

## V1.7.18
- Multi-vehicle sensor identity runtime for UHF/LPR/Radar/infrared.
- Propagate VEH-ID through connection runtime.
- Barrier safety-zone vehicle blocking and auto-close hold.

## V1.7.15 Multi Vehicle Runtime
- 多車輛獨立ID、選擇控制、新增/刪除汽車與機車。
- 地感偵測改為掃描全部車輛並顯示 VEH-ID。

## V1.7.15 Debug Audit Consistency Hotfix
- 修正版本同步與部署一致性 Debug 誤判。
- 將 Google 儲存/錯誤提示與版本欄拆開。
- build-info 非同步讀取加入 loading/error 狀態。

# V1.7.13

- 新增混合車道／汽車道／機車道選擇。
- 新增車種與車道不符警告。
- 地感偵測改用車體與線圈實際重疊比例。
- 地感檢知器靈敏度會影響汽車／機車觸發門檻。
- 新增「感應不足」3D 燈號與 HUD 狀態。
- 版本與 ES Module 快取同步至 V1.7.13。

# V1.7.12
- 29 類 3D 模組加入統一可視反應保底，並保留各設備專屬機械／燈號反應。
- 地感線圈加入明顯偵測發光、角落偵測燈與光暈；車輛進入／離開會同步切換。
- LK-109 類地感檢知器 3D 面板加入 POWER / DETECT / PULSE / FAULT LED 狀態。
- 車輛新增「汽車／機車」選擇；機車使用獨立 3D 模型與較小碰撞尺寸。
- 地感自動偵測改為車體 Bounding Box 與線圈區域相交判斷。
- 維持 W/S/A/D：W 前進、S 後退、A 左轉、D 右轉。
- 修正 LK-1045 倒數上限回到 99 秒。
- 版本與 ES Module 快取同步到 V1.7.12。

# V1.7.11

- 接線卡 DI / DO 保留原始訊號代號，並新增中文用途名稱。
- SOYAL 門禁控制器補上 Egress、Door Status、Door Lock、Alarm 等工程語意標註。
- Garrison LK-103 / LK-103A 補上 A/B/C 車道偵測與各車道紅綠燈輸出名稱。
- 倒數計時器 DI1/DI2/DI3 標註為開始、暫停/繼續、重設；DO1 標註倒數完成，DO2~DO4 標註可程式輸出（目前未指派）。
- 接線卡、設備 DI/DO 頁、實體端子三處同步顯示語意名稱。
- 新增 IO 語意標註核心 `io-semantic-labels.js`。

## V1.7.18
- 3D Lamp Material Hotfix：安全更新 color/emissive，避免 setHex 型態錯誤。
