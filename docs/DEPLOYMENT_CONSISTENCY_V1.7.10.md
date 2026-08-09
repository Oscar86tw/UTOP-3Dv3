# V1.7.11 Deployment Consistency Audit

## 問題來源
線上 GitHub main 與 GitHub Pages / 瀏覽器曾同時出現不同版本：index、app.js、views.js 不一致。

## 新增保護
- `document.documentElement.dataset.utopIndexVersion`
- `document.documentElement.dataset.utopVersion`
- `assets/build-info.json`
- `window.__utopBuild`

三者必須都是 `1.7.10`。

## 部署後正確診斷
- index: 1.7.10
- app.js: ?v=1.7.11
- views.js: ?v=1.7.11
- Runtime: 1.7.10
- Manifest: 1.7.10
