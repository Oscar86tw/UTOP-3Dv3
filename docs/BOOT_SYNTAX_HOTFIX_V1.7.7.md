# V1.7.7 Boot Syntax Hotfix

## 原始錯誤
`SyntaxError: Identifier 'autoClose' has already been declared`

位置：`assets/js/app.js` 的 `applyModuleSettings` handler。

## 根因
V1.7.6 合併自動關閉功能時，同一作用域重複宣告：
- `const autoClose`
- `const autoSeconds`

同時也存在兩組重複的 auto-close change/input event listener。

## 修正
- 保留單一組事件監聽。
- 保留單一組 autoClose / autoSeconds 宣告。
- 對全專案 JS 執行語法檢查。
