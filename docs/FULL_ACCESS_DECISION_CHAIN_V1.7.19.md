# V1.7.19 Full Access Decision Chain

- 標準 ALLOW：UHF TAG_OK 或 LPR PLATE_OK → Controller DI1 → DO1 → Relay ON → NO → Barrier OPEN。
- 標準 DENY：UHF TAG_FAIL 或 LPR PLATE_FAIL → Controller DI2 → DO2 → Beacon FLASH；若場景已有 Traffic 模組，同時可接 RED。
- 標準模式為 OR：UHF 或 LPR 任一授權成功即可形成允許訊號。需要雙重驗證（AND）時應另建邏輯模組，不在本版假設。
- VEH-ID、plate、etag、identity、ALLOW/DENY、reason 會跟隨 Connection Runtime 傳遞。
- 工程/接線頁提供「檢查通行決策鏈」與「建立標準通行決策鏈」。
- Debug 只有在已開始配置標準通行鏈但不完整時才判 FAIL；尚未配置時顯示可建立，不視為錯誤。
