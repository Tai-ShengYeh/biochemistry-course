const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),assets=path.join(root,'site/assets/animations'),shared=path.join(assets,'learning-labs');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(shared,'content.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(shared,'models.js'),'utf8'),sandbox);
const labs=sandbox.window.LEARNING_LABS,manifest={2:{week:2,title:'緩衝液實驗室',hero:'H⁺',simulation:'w02/simulation.html'}};
for(const [week,lab]of Object.entries(labs)){
 const slug='w'+week.padStart(2,'0'),dir=path.join(assets,slug);fs.mkdirSync(dir,{recursive:true});
 const html=`<!doctype html><html lang="zh-Hant" data-week="${week}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${slug.toUpperCase()} · ${lab.title}</title><link rel="stylesheet" href="../learning-labs/styles.css"></head><body>
<main id="lab"><header class="lab-header"><strong id="brand"></strong><span id="gloss"></span></header><nav class="scene-map" aria-label="六幕學習進度"></nav>
<section class="scene-heading"><p id="flow"></p><h1 id="title"></h1><p id="task"></p></section><section id="stage" aria-label="可操作的概念模型"></section>
<div class="caption" aria-live="off"><p id="caption"></p></div><div class="timeline"><progress id="progress" max="1" value="0" aria-label="本幕動畫進度"></progress><span id="time"></span></div>
<div id="parameters" class="parameters" hidden></div><section id="activity" aria-label="預測與理解檢核"></section><p id="feedback" role="status" aria-live="polite"></p>
<footer class="controls"><button id="back" type="button">上一幕</button><button id="play" type="button">播放</button><button id="replay" type="button">重播本幕</button><button id="reset" type="button">全部重設</button><button id="next" class="primary" type="button">下一幕 →</button></footer>
<p class="model-note">概念模型；圖像與字幕同步。本版使用文字字幕，沒有合成配音。</p><details class="teacher-notes"><summary>模型範圍與來源</summary><p id="scope"></p><p id="sources"></p><p>先預測，再觀察、解釋與應用。答錯可重試。圖像是示意，不代表實測或完整細胞反應。</p></details></main>
<script src="../learning-labs/content.js"></script><script src="../learning-labs/models.js"></script><script src="../learning-labs/engine.js"></script></body></html>\n`;
 fs.writeFileSync(path.join(dir,'simulation.html'),html);
 const storyboard=JSON.parse(JSON.stringify(lab));
 for(const index of [3,4])storyboard.scenes[index].condition_checks=lab.cases.map((c,i)=>({condition:c.label,parameters:{case:i},question:sandbox.window.LEARNING_MODELS.question(lab,index,{case:i})}));
 fs.writeFileSync(path.join(dir,'learning-storyboard.json'),JSON.stringify(storyboard,null,2)+'\n');
 manifest[week]={week:Number(week),title:lab.title,hero:lab.hero,simulation:`${slug}/simulation.html`};
}
fs.writeFileSync(path.join(shared,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Built ${Object.keys(labs).length} new labs; W02 retained.`);
