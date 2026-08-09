# UTOP-3Dv3 V1.5.3 Interaction Core Fix

本版專門修正模組設定、DI/DO互動、3D統一操作、3D閃爍與Google雲端寫入驗證。

重點：
- 規格參數輸入即時寫入狀態，套用後不再跳回舊值。
- DI/DO可直接點擊ON/OFF；DI ON執行設備輸入動作，DO ON沿Connection傳遞。
- 3D改為選取＋拖移＋旋轉統一模式，XYZ與RX/RY/RZ操作器同時顯示。
- 3D動畫frame不再重建全部設備與Connection，降低旋轉/移動時閃爍。
- Google雲端新增「測試儲存權限」：實際建立、讀取、刪除臨時Drive檔案。
