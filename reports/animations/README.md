# 每週生物化學動畫驗收

涵蓋 A2 班 W01–W08、W10–W17，共 16 支概念動畫；W09/W18 為考試週，不新增動畫。台灣班尚未建置，不另造課程。

- 960×540、12 fps、H.264/AAC；每支約 30–41 秒。
- 繁體中文旁白與燒錄字幕，另附逐句完整 SRT/WebVTT；術語含中文、英文、越南文。
- 同一週動畫共用於簡報和互動課程；新增 animations.html 總覽。
- 16 支完整解碼、旁白／字幕時序、結尾保留、中文字型與圖形運動檢查通過：media-verification.json。
- 32 次桌機／手機最終 MP4 播放與結尾跳轉通過，SHA-256 記錄於 final-media-browser-verification.json。
- 64 次簡報／互動課程 × 桌機／手機測試通過：browser-verification.json；含字幕載入、版面、簡報鍵盤隔離和離頁暫停。
- review-group-1.jpg 至 review-group-4.jpg 為各週開頭／中段／結尾的視覺檢查摘要。

重新驗收：

```sh
python tools/verify_weekly_animations.py
python tools/browser_final_media_smoke.py
python tools/browser_verify_animations.py
```

瀏覽器檢查需 Playwright Chromium 與系統函式庫。無 sudo 時可透過 LD_LIBRARY_PATH 使用使用者目錄內的相依函式庫。長批次若因工具時限中斷，未變更影片與 HTML 的前提下，可使用 BIO_VERIFY_RESUME=1 接續 browser_verify_animations.py；一般執行預設從頭驗收。

旁白重製目前需要 Windows Hanhan TTS；Pillow/fontTools 和 ffmpeg 用於繪圖與編碼。所有動畫為概念示意，不是精確分子模擬。
