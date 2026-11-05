# 第 1–8 週手寫動畫

學生入口：`site/handwrite/index.html`。共 32 章、234 幕、234 段中文旁白、64 個作答停頓，配少量越南語關鍵詞。時長約 54 分鐘，另加作答思考時間。

入口整合於課程首頁、互動實驗總覽、互動講義目錄、每週互動講義，以及投影片的 `#/handwrite` 命名路由。新路由附在各週末端，保留既有數字頁次、`#/animation` 與 `#/learning-return`。播放器可返回同週投影片、講義或原網站的互動實驗。

`handwrite/` 只包含學生播放所需資產、可編輯課程 JSON、各章備註與授權資料。沒有上傳原手寫技能原始碼、配音快取或教科書。科學校核與來源見 `site/handwrite/notes/`；製作來源的 SHA-256 見 `reports/handwrite/integration.json`。

已有兩包核對完成的教材時，從 repository 根目錄執行：

```powershell
python -X utf8 tools/integrate_handwrite.py --source-root <兩包教材的上層資料夾>
```

來源目錄應包含 `biochemistry-w01-w02` 及 `biochemistry-w03-w08`。工具以已完成的 `course-manifest.json`、`layout.json` 檢查音訊數量，複製公開播放檔案並加入入口。若重跑原互動實驗的 build/embed 或其他網站輸出工具，請最後再跑本工具。

整合驗收：

```powershell
python -X utf8 tools/check_handwrite.py
python -X utf8 tools/check_handwrite.py --base https://tai-shengyeh.github.io/biochemistry-course/
```

需要 Playwright 與已安裝的 Microsoft Edge。檢查八個週次路由、每週四章、32 個播放器、音訊、跳轉、作答停頓、桌面／手機導覽，並保留既有互動實驗入口。報告在 `reports/handwrite/`。
