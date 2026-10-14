# 每週生物化學動畫驗收

涵蓋 A2 班 W01–W08、W10–W17。2026-10-14 起，W02 改成六幕互動實驗並移除舊影片；保留其餘 15 支概念影片。W09/W18 為考試週，不新增動畫。台灣班尚未建置，不另造課程。W02 的新版設計与驗證見 `docs/w02-buffer-design.md`。

- 960×540、12 fps、H.264/AAC；每支約 30–41 秒。
- 繁體中文旁白與燒錄字幕，另附逐句完整 SRT/WebVTT；術語含中文、英文、越南文。
- 同一週動畫共用於簡報和互動課程；新增 animations.html 總覽。
- 15 支保留影片的原驗收結果：media-verification.json。
- 30 次保留影片的桌機／手機最終 MP4 播放與結尾跳轉原驗收結果，SHA-256 記錄於 final-media-browser-verification.json。
- 60 次保留影片的簡報／互動課程 × 桌機／手機原驗收結果：browser-verification.json；含字幕載入、版面、簡報鍵盤隔離和離頁暫停。
- review-group-1.jpg 至 review-group-4.jpg 為原製作批次的歷史視覺摘要，不代表 W02 現行版本。新版 W02 另做互動驗證。

重新驗收：

```sh
python tools/verify_weekly_animations.py
python tools/browser_final_media_smoke.py
python tools/browser_verify_animations.py
```

瀏覽器檢查需 Playwright Chromium 與系統函式庫。無 sudo 時可透過 LD_LIBRARY_PATH 使用使用者目錄內的相依函式庫。長批次若因工具時限中斷，未變更影片與 HTML 的前提下，可使用 BIO_VERIFY_RESUME=1 接續 browser_verify_animations.py；一般執行預設從頭驗收。

旁白重製目前需要 Windows Hanhan TTS；Pillow/fontTools 和 ffmpeg 用於繪圖與編碼。所有動畫為概念示意，不是精確分子模擬。
