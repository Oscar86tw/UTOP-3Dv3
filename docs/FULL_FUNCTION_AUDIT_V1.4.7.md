# UTOP-3Dv3 V1.4.7 全功能稽核

## 事件綁定稽核
- 渲染頁面：13 頁
- 預設渲染 Button 實例：257
- 找不到對應 handler：0
- ID 型 handler：56 類
- data-* 型 handler：31 類

## 核心功能測試
共 59 項，59 PASS：
- 13 個頁面 render
- 29 類 Three.js 3D 模型建立
- 模組新增 / 刪除 / 設定
- Wiring Builder
- Scene Preset
- Road Marking 新增 / 修改 / 刪除
- Signal Trace
- Debug Audit
- Display 設定
- Saved View CRUD
- Floor / Group / Opacity

## 本版已修正的主要點擊問題
1. 不再使用 propX、scenePlace、roadX、traceDevice 等 HTML id 當作隱式 JavaScript 全域變數。
2. 「＋加入裝置」補上實際事件。
3. 新增模組後自動切到新模組並開啟設備設定。
4. 新增「刪除目前模組」，同步刪除相關 Connection。
5. Scene、Road Marking、Signal Trace 會等待真正 3D 掛載完成後再呼叫 API。
6. 2D Transform 改用穩定欄位存取。
7. Commissioning 全部 PASS 後摘要會同步顯示完成。
8. 移除設備設定側欄關閉按鈕的重複事件綁定。
9. UI 操作錯誤會顯示錯誤資訊，不再只是無反應。

## 測試限制
執行環境禁止 Chromium 對 localhost / file URL 導航，因此無法在此容器完成真正的瀏覽器滑鼠自動點擊。已改用「完整 render 事件覆蓋稽核 + ES Module / 核心函式實際執行」測試。正式部署後仍建議以 Chrome/Edge 做一次現場點擊驗收。
