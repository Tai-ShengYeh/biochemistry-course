# 生物化學六幕互動實驗

W01–W08、W10–W17 共 16 週。W02 使用既有緩衝液實驗室；其他 15 週在 2026-10-15 改成各自的「預測、比較、機制、改條件、找界線、應用」六幕。W09、W18 為考試週。

三個入口共用同一模型：`site/animations.html`、`site/vi-a2/wNN.html#/animation`、`site/vi-a2/lessons/wNN.html#animation`。舊 MP4、字幕檔、封面與產生器已從公開版本移除。同步文字字幕，沒有本次合成旁白；不把互動教材宣稱為影片。

## 重建

```sh
node tools/build_learning_labs.cjs
python -X utf8 tools/embed_weekly_animations.py
```

無 npm 執行相依套件。每週 `simulation.html` 可用靜態 HTTP 或 file:// 載入同目錄的共用程式。

- `learning-labs/content.js`：15 週的腳本、題目、觀看任務、來源與模型範圍。
- `learning-labs/models.js`：時間／條件 → 圖像、計算值與相應檢核。
- `learning-labs/engine.js`：播放、暫停、上／下一幕、重播、全部重設、重試。
- `learning-labs/manifest.json`：16 週索引。
- `wNN/learning-storyboard.json`：完整六幕分鏡及每種條件的檢核；W02 見自己的 `storyboard.js`。

改條件會清除本幕已回答狀態。觀察後才可作答前進。W16 逐圈按鍵不能重複觸發或超過剩餘碳链。離開 Reveal 投影片時暫停；手機維持可讀的原生寬度。

## 教學界線

這是每週選定核心概念的輔助活動，不取代全章課程。所有圖像為概念示意；定量模型有標示任意單位或假設值。每週學生端提供自己的適用範圍與來源。詳見 `docs/learning-animation-audit.md`。
