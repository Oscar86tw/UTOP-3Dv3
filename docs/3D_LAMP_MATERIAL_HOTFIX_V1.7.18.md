# V1.7.18 3D Lamp Material Hotfix

- 修正 `material.emissive?.setHex is not a function`。
- 新增安全材質更新函式，支援單一材質與材質陣列。
- 僅在 `emissive`/`color` 真正具備 `setHex` 或 `set` 時才更新。
- 所有 simulator3d 直接 emissive setHex 呼叫改走安全函式。
- 保留全域錯誤診斷。
