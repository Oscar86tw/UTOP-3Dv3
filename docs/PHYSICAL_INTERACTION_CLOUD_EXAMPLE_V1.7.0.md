# V1.7.0 Physical Interaction & Cloud Example

## 3D 實體互動
- 同一樓層設備使用實體 Bounding Box 做碰撞判定。
- 預設不可互相重疊。
- `allowOverlap=true` 時可穿透/重疊，用於特殊示意配置。
- 未允許穿透時，設備 local Y 最低為 0，因此會落在所屬樓層地面以上。

## 柵欄機
- 左桿 OPEN：-90°
- 右桿 OPEN：+90°
- CLOSE：0°

## 紅外線
- TX / RX 間距直接使用 `range` 公尺。
- 例：30m = 左右各 15m；60m = 左右各 30m。

## Google 儲存範例
1. 在專案 / Debug 貼上 Apps Script `/exec`。
2. 按「執行完整儲存範例」。
3. 系統自動測試連線與 Drive 權限。
4. 建立 `UTOP_儲存範例_日期時間` 並存到指定 Google Drive。
5. 專案清單自動更新，可直接開啟測試。
