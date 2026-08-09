# UTOP-3Dv3 V1.5.0 3D Action Chain Audit

## 已驗證鏈路
- 入口進車：DEV-003 vehicle → DEV-004 DI1 → DEV-001 open + DEV-007 green → DEV-008 start
- 入口離車：DEV-003 clear → DEV-004 DI2 → DEV-001 close + DEV-007 red + DEV-008 reset
- 出口進車：DEV-009 vehicle → DEV-010 DI1 → DEV-006 open + DEV-011 green → DEV-012 start
- 出口離車：DEV-009 clear → DEV-010 DI2 → DEV-006 close + DEV-011 red + DEV-012 reset

## 規則
- Demo 不可跳過 Connection 直接驅動下游設備。
- Timer DI1 / DI2 / DI3 分別對應 START / PAUSE / RESET。
- Connection 被觸發時 3D 線會短暫高亮。
