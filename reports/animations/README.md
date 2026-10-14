# 動畫驗收記錄

此資料夾的 MP4、字幕、播放及 contact sheet 記錄來自原影片製作批次，屬歷史證據。2026-10-14 W02 改成互動實驗；2026-10-15 其他 15 週也完成互動改造，舊影片已移除。舊紀錄不代表現行網站或學生學習成效；其中引用的原資產可在 Git 歷史 `e2728e0` 回溯。

現行介面、逐週判斷及科學界線見 `docs/learning-animation-audit.md`。W02 的 16 項控制、同步及響應檢查保留；新 15 週經桌面／手機共 30 次完整六幕流程、73 項模型性質與獨立算術檢查、15 個 Reveal 手機入口驗證。條件變更、字幕與圖像暫停、錯誤重試、反應中重播／重設皆通過。本機詳細結果與截圖由本次 Codex 輸出包提供，不把歷史影片驗收當成新版的驗收。

目前未測 Safari／iOS 或真人課堂學習效果。新建置指令：

```sh
node tools/build_learning_labs.cjs
python -X utf8 tools/embed_weekly_animations.py
```
