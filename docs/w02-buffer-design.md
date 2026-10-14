# W02 緩衝液互動實驗室

入口仍是 `site/vi-a2/w02.html#/animation`。六幕的腳本、字幕、時間錨點、hero、觀看任務與驗收時間在 `site/assets/animations/w02/storyboard.js`；`simulation.js` 用同一個暫停時鐘計算所有畫面，不用隨機粒子或延遲回呼。

| 幕 | 流程與學生動作 | 主要觀看任務 | 檢核 |
|---|---|---|---|
| Challenge | 先選預測；不先公布答案 | 同體積、同量酸 | 提交任何預測可前進 |
| Compare | 播放左右比較 | 水與緩衝液 pH 變化 | 選變化較小的一杯 |
| Mechanism | 追蹤橘色 H⁺ | A⁻ + H⁺ → HA | 排除「H⁺ 消失」迷思 |
| Base challenge | 先猜 pH 方向，再播放 | HA 釋出 H⁺，再中和 OH⁻ | 誰提供 H⁺？ |
| Buffer capacity | 一次加一份酸，共九次 | A⁻ 剩餘量與 pH 趨勢 | 解釋容量限制 |
| Transfer | 兩題形成性評量 | 酮酸與有限的血液緩衝 | 酸負荷與大量加鹼的方向 |

學生介面使用繁體中文短句，加少量英文／越南文詞彙。每幕只有一個觀看任務。字幕與圖像事件共用時間軸；本版沒有合成旁白。播放／暫停、上一幕／下一幕、重播本幕與全部重設皆由狀態機管理。緩衝容量反應未結束時不能重複加酸；重設會取消動畫。離開投影片時暫停，返回不自動播放。

## 科學範圍

- pH、八份 A⁻ 與每次加入量都是教學示意，不是精確平衡計算或實測。
- H⁺ 是水中 H₃O⁺ 的簡寫；「接住」指形成 HA，沒有消滅物質。
- 加鹼的兩步是教學拆解，淨反應為 HA + OH⁻ → A⁻ + H₂O。
- 容量模型使用有限份數；真實溶液的組成與平衡連續改變，不存在通用「第九滴」門檻。
- 血液情境用來遷移容量概念。血液還受肺、腎與多種緩衝系統調節；不把密閉燒杯當成完整人體模型。

來源（2026-10-14 查閱）：[OpenStax Buffers](https://openstax.org/books/chemistry-2e/pages/14-6-buffers)、[Endotext DKA](https://www.ncbi.nlm.nih.gov/books/NBK620701/)。設計參考：[FW1201/code-animation-explainer](https://github.com/FW1201/code-animation-explainer) 的分鏡、hero、時間→狀態與 QA 思路。本次自行實作，未引入該專案的執行相依套件。

## 整合與驗證

保留 Reveal.js 架構與既有 `#/animation`。新增 `#/blood` 供最後一幕返回本課血液內容。W02 使用 `scrollActivationWidth:null`，避免 [Reveal 手機自動 scroll view](https://revealjs.com/scroll-view/) 改動內嵌實驗室 DOM；動畫路由以原生手機寬度顯示，其他投影片保留原畫布。

2026-10-14，使用本機 HTTP 預覽及 Playwright／Edge 驗證。Browser plugin 未列於本次技能，因此使用現有 Playwright。桌面 1366×900；手機 390×844、320×740；橫式 844×390。16 項檢查通過：入口、預測、同步暫停、加酸比較、迷思重試、加鹼兩步、加鹼重播、九次容量反應、兩題應用與回課程、離開路由暫停、全域重設、三種響應尺寸、手機操作與反應中重設、執行錯誤。無水平溢出；截圖已檢視。測試伺服器為 favicon 回覆 204；未將既有網站缺少 favicon 視為實驗室錯誤。

尚未實測 Safari／iOS 或真人課堂學習成效。此版無配音、MP4 輸出；互動模擬不能由影片代替。

## 部署

W02 舊 MP4、SRT、VTT、封面與舊分鏡已移除。動畫總覽與互動課程共用新版實驗室。2026-10-15，其他 15 週也改為各自的六幕互動實驗，見 `learning-animation-audit.md`；重建索引不會恢復舊影片。

將變更分支合併到 `main`。既有 `.github/workflows/pages.yml` 會在 `site/**` 改變時部署 `site/` 到 GitHub Pages。部署完成後檢查 `https://tai-shengyeh.github.io/biochemistry-course/vi-a2/w02.html#/animation`；若瀏覽器保留舊版，重新整理。分支推送本身不會更新正式網址。
