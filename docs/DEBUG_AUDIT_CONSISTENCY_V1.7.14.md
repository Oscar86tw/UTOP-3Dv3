# V1.7.14 Debug Audit Consistency Hotfix

- 版本同步改用 data-version 與 Runtime 版本比較。
- projectMeta 不再被 Google 儲存/錯誤訊息改寫。
- projectStatus 專門顯示操作狀態。
- build-info manifest 狀態分成 loading / loaded / error。
- 只有已載入且版本不一致才判定部署 FAIL。
