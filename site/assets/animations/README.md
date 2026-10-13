# 每週生物化學教學動畫

範圍：現有越南學生班中文 A2 的 **W01–W08、W10–W17，共 16 週**。W09、W18 是考試週，完全不加入動畫。台灣學生班仍保留「建置中」。

## 學生入口與共用媒體

- `site/animations.html`：手機友善的動畫總覽。
- `site/vi-a2/wNN.html#/animation`：投影片中的動畫。
- `site/vi-a2/lessons/wNN.html#animation`：互動課程的動畫（插在本週重點之前，不改遊戲或計分）。
- `site/assets/animations/wNN/`：每週 **一份** MP4、SRT、VTT、`poster.jpg`、`storyboard.json`，所有入口共用。

每段影片約 30–41 秒，960×540、12 fps，H.264 + AAC。不是文字卡輪播：有移動的分子／離子、摺疊鏈、結合與釋放、速率曲線、膜運輸、循環與燃料流向。圖形是概念示意，不是原子尺度模擬，也不是整堂課的替代品。

旁白為繁體中文 A2；三語關鍵詞同步出現在畫面及播放器旁。字幕逐句使用完整旁白，不是摘要。每句分別合成 WAV，再以實測長度安排燒錄字幕、SRT 與 VTT；結尾至少保留兩秒。已燒錄字幕，因此原生字幕預設關閉，學生仍可自行開啟。W07 明確區分「純」非競爭性抑制；不把 Km 一概等同親和力。W03 標註細胞胜肽合成不只是直接脫水；W12 不把斷鍵本身當作放能原因。

## 重建

需求：Python 3、Pillow、fonttools、ffmpeg/ffprobe、繁體中文字型。聲音製作目前使用 WSL 可呼叫的 Windows PowerShell 與 Microsoft Hanhan Desktop（System.Speech），不依賴付費服務。

```sh
python -m pip install Pillow fonttools playwright
python tools/render_weekly_animations.py
python tools/embed_weekly_animations.py
python tools/verify_weekly_animations.py
python -m playwright install chromium
# 在一般 Linux 上可能還需要 playwright install-deps chromium。
python tools/browser_verify_animations.py
```

可用 `BIO_FONT` 指定字型；預設 `/mnt/c/Windows/Fonts/msjh.ttc`。`render_weekly_animations.py 5 7` 可只重建指定週。`animation_content.py` 保存逐週原稿，`storyboard.json` 保存每段來源頁面、旁白、術語與實測時間。`make_narration.ps1` 是共用語音腳本。中間 WAV 和 `.render-cache/` 已排除版控。

## 驗證證據

- `reports/animations/media-verification.json`：精確 16 份、每段 ffprobe、完整解碼、影音軌、完整字幕文本／時間、結尾保留時間、圖形區移動測試、檔案大小。
- `reports/animations/wNN-frames.jpg`：每段開頭／中段／結尾截圖，供逐週視覺審閱。
- `reports/animations/browser-verification.json`：桌機 1365×900 與手機 390×844，逐週投影片與互動頁共 64 次真實播放／字幕載入測試；投影片鍵盤隔離、切頁暫停及影片不溢出；兩種尺寸的動畫總覽各有 16 個播放器。
- `reports/animations/browser-{desktop,mobile}-w{01,15}.png`：代表性的互動頁瀏覽器畫面。

這些是 **PR 分支的本機測試**。Pages workflow 只部署 main；在 PR 合併前，公開網站不會更新。本批次僅開 PR，不自動合併。
