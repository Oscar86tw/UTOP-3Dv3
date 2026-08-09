# UTOP-3Dv3 V1.3.0 Real Device Model & Direct Control

本版把 29 種模組的正式 3D 外觀拆成獨立設備建模核心，不再使用統一 Generic 方塊。

## 重點
- 29 種模組都有自己的 3D 幾何外觀。
- 新增 `device-model-factory.js`，設備模型與 3D 場景核心分離。
- UHF、紅外線、LPR、攝影機、控制器、PoE、Relay、Timer、燈箱、鐵捲門等皆使用不同結構。
- 未定義的新類型只顯示特殊多面體提示，不會用正式方塊假裝設備。
- 點 3D 設備後，3D 下方直接顯示該設備自己的快速控制列。
- 快速控制與右側設備設定、Runtime、快捷鍵使用同一份資料。
- 保留本地 Three.js r180、Connection、Signal Trace、Skill Tree、道路標線、場景庫與 Local 3D 備援。
