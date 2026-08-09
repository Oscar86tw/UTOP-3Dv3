# V1.5.4

- 規格參數輸入改為 120ms debounce 即時套用到真正 3D，不需每次先按套用才看到結果。
- 設備控制、DI/DO 後重新整理 Inspector 時保留目前捲動位置與輸入焦點，避免面板跳回頂端。
- 3D 名稱牌位置高度改為快取，只在設備幾何或標籤偏移真的變更時重新計算 Bounding Box。
- 正常 3D Render frame 不再重算每台設備的名稱高度，降低抖動與瞬間閃爍。
- Google Cloud clientVersion 同步為 1.5.4；verifyWrite / save / load / delete 流程保留。
