/* ==========================================================================
   生物化學 A（越南學生班・中文 A2）— 統一課程引擎 bio_engine.js
   移植自 食品營養華語 寫作 I 課程的 lesson_engine.js（同一套資料/引擎分離模式）。
   用法：每週 HTML 先定義 const WEEK = {...}，再 <script src="bio_engine.js">。
   引擎會注入 CSS 並依 WEEK 渲染：本週重點、三語詞彙、5 種遊戲、計分板。
   全離線可用（file://），不需網路與 fetch（雲端記錄除外，離線會安靜降級）。
   ========================================================================== */
(function(){
  // 相容性：頂層 const/let 不會掛在 window 上，因此先讀詞法綁定 WEEK，再退而求其次讀 window.WEEK。
  const W = (typeof WEEK !== 'undefined') ? WEEK : (typeof window !== 'undefined' ? window.WEEK : undefined);
  if(!W){document.body.innerHTML='<p style="padding:40px;font-family:sans-serif">找不到 WEEK 資料。</p>';return;}
  const ACC = W.accent || '#1F4E5F';

  /* ---------- inject CSS ---------- */
  const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#F7FBFC;--ink:#1F2933;--brown:#1F4E5F;--mut:#7A8C93;--red:#C8532B;--teal:#2E7D8A;--gold:#E8B84B;--brand:${ACC};--line:#D9E7EC;--card:#fff;}
  body{font-family:'Noto Sans TC',-apple-system,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7;padding:0 0 60px;}
  .wrap{max-width:960px;margin:0 auto;padding:0 18px;}
  .top{background:linear-gradient(135deg,${shade(ACC,-30)},${ACC} 70%,${shade(ACC,22)});color:#fff;padding:28px 0 24px;}
  .top .wrap{display:flex;flex-direction:column;gap:6px;}
  .kick{font-size:.78rem;font-weight:700;letter-spacing:.14em;color:rgba(255,255,255,.85);}
  .top h1{font-size:1.6rem;font-weight:900;}
  .top .sub{font-size:.92rem;color:rgba(255,255,255,.92);}
  .top .meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
  .top .meta span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:4px 12px;border-radius:20px;font-size:.78rem;}
  .nav{position:sticky;top:0;z-index:50;background:rgba(247,251,252,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);}
  .nav .wrap{display:flex;gap:6px;overflow-x:auto;padding:10px 18px;}
  .nav a{white-space:nowrap;text-decoration:none;color:var(--brown);font-weight:700;font-size:.84rem;padding:7px 12px;border-radius:18px;border:1px solid var(--line);background:#fff;transition:.15s;}
  .nav a:hover{border-color:var(--brand);color:var(--brand);}
  .score-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 18px;margin:18px 0;box-shadow:0 2px 8px rgba(0,0,0,.04);flex-wrap:wrap;}
  .score-strip b{font-size:1.02rem;}
  .stars{font-size:1.2rem;letter-spacing:2px;color:var(--gold);}
  .total-pill{background:${tint(ACC)};color:${shade(ACC,-40)};font-weight:900;padding:6px 16px;border-radius:20px;font-family:monospace;}
  section{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px 22px;margin:18px 0;box-shadow:0 2px 10px rgba(0,0,0,.04);}
  section h2{font-size:1.28rem;color:${shade(ACC,-34)};margin-bottom:4px;display:flex;align-items:center;gap:9px;}
  section .lead{color:var(--mut);font-size:.9rem;margin-bottom:16px;}
  .kp{margin-bottom:20px;}
  .kp:last-child{margin-bottom:0;}
  .kp h3{font-size:1.06rem;color:${shade(ACC,-34)};margin:0 0 8px;padding-left:10px;border-left:4px solid var(--brand);}
  .kp p{font-size:1.06rem;line-height:1.95;margin-bottom:8px;}
  .kw{background:#FEF3C7;border-bottom:2px solid var(--gold);border-radius:3px;padding:0 2px;font-weight:700;}
  .kp img{max-width:100%;display:block;border-radius:10px;border:1px solid var(--line);margin-top:8px;}
  .kp .imgcap{font-size:.8rem;color:var(--mut);text-align:center;margin:6px 0 4px;}
  .note{background:${tint(ACC)};border-left:4px solid var(--brand);border-radius:8px;padding:12px 16px;font-size:.92rem;color:var(--brown);margin-top:8px;}
  .vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
  .vc{border:1px solid var(--line);border-radius:12px;padding:14px;background:#FCFEFE;}
  .vc .w{font-size:1.22rem;font-weight:900;}
  .vc .py{font-family:monospace;color:${shade(ACC,-30)};font-size:.82rem;margin:2px 0 6px;}
  .vc .vn{color:var(--red);font-size:.85rem;font-weight:700;}
  .vc .en{color:${shade(ACC,-20)};font-size:.85rem;font-weight:700;margin-top:2px;}
  .vc .ex{color:var(--brown);font-size:.85rem;margin-top:5px;}
  .bar{display:flex;justify-content:space-between;align-items:center;background:#FCFEFE;border:1px solid var(--line);border-radius:10px;padding:9px 15px;margin-bottom:14px;font-weight:700;font-size:.9rem;}
  .bar .v{font-family:monospace;color:var(--teal);}
  .bar .e{font-family:monospace;color:var(--red);}
  .btn{display:inline-block;padding:11px 26px;background:var(--brand);color:#fff;border:none;border-radius:22px;font-weight:700;cursor:pointer;font-size:.95rem;margin-top:6px;}
  .btn:hover{filter:brightness(.93);}
  .btn.ghost{background:#fff;color:${shade(ACC,-34)};border:2px solid var(--brand);}
  .fb{margin-top:12px;padding:12px;border-radius:10px;text-align:center;font-weight:700;display:none;}
  .fb.show{display:block;}
  .fb.ok{background:#E8F4F2;color:var(--teal);}
  .fb.no{background:#FFE5E7;color:var(--red);}
  .done{display:none;margin-top:14px;background:${tint(ACC)};border:1px solid ${tint(ACC,true)};border-radius:12px;padding:16px;text-align:center;}
  .done.show{display:block;}
  .done .pts{font-size:1.5rem;font-weight:900;color:var(--teal);}
  .board{display:grid;grid-template-columns:1fr 1.4fr;gap:14px;}
  .col h3{font-size:.92rem;color:var(--brown);margin-bottom:9px;padding-bottom:5px;border-bottom:2px solid var(--gold);}
  .item{background:#fff;border:2px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:9px;cursor:pointer;min-height:54px;display:flex;align-items:center;justify-content:space-between;transition:.18s;}
  .item:hover{border-color:var(--gold);}
  .item.sel{border-color:var(--brand);background:${tint(ACC)};}
  .item.ok{background:#E8F4F2;border-color:var(--teal);color:var(--teal);opacity:.6;cursor:default;}
  .item.ok::after{content:'✓';font-size:1.3rem;}
  .item.bad{animation:shake .4s;border-color:var(--red);}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
  .item .zh{font-weight:900;font-size:1.12rem;}
  .item .py{display:block;color:var(--mut);font-family:monospace;font-size:.72rem;}
  .item .df{font-size:.92rem;color:var(--red);font-weight:700;}
  .q{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px;background:#FCFEFE;}
  .q .stem{font-size:1.04rem;font-weight:700;margin-bottom:12px;}
  .q .stem .n{display:inline-block;width:26px;height:26px;background:var(--brand);color:#fff;border-radius:50%;text-align:center;line-height:26px;font-size:.84rem;margin-right:8px;}
  .opts{display:flex;flex-wrap:wrap;gap:10px;}
  .opt{flex:1;min-width:120px;border:2px solid var(--line);border-radius:10px;padding:11px 14px;cursor:pointer;text-align:center;font-weight:700;transition:.15s;background:#fff;}
  .opt:hover{border-color:var(--brand);}
  .opt.pick{border-color:var(--brand);background:${tint(ACC)};}
  .opt.right{border-color:var(--teal);background:#E8F4F2;color:var(--teal);}
  .opt.wrong{border-color:var(--red);background:#FFE5E7;color:var(--red);}
  .exp{font-size:.88rem;color:var(--brown);margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);display:none;}
  .exp.show{display:block;}
  .pool,.answer{display:flex;flex-wrap:wrap;gap:8px;min-height:54px;border:2px dashed var(--line);border-radius:10px;padding:12px;margin-bottom:10px;}
  .answer{border-style:solid;background:#FCFEFE;}
  .tok{background:#fff;border:2px solid var(--brand);color:${shade(ACC,-34)};border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:1rem;}
  .tok:hover{background:${tint(ACC)};}
  .rlabel{font-size:.82rem;color:var(--mut);margin-bottom:5px;font-weight:700;}
  .spk{border:0;background:transparent;cursor:pointer;font-size:1rem;padding:2px 5px;border-radius:6px;line-height:1;}
  .spk:hover{background:${tint(ACC)};}
  .pager{display:flex;justify-content:space-between;gap:10px;margin:18px 0;}
  .pager a{text-decoration:none;font-weight:700;font-size:.9rem;color:${shade(ACC,-34)};background:#fff;border:1px solid var(--line);border-radius:22px;padding:10px 18px;}
  .pager a:hover{border-color:var(--brand);}
  .pager a.disabled{opacity:.4;pointer-events:none;}
  footer{text-align:center;color:var(--mut);font-size:.8rem;margin-top:24px;}
  @media(max-width:600px){
    .board{grid-template-columns:1fr 1.25fr;gap:8px;}
    .item{padding:9px 10px;min-height:46px;}
    .item .zh{font-size:1rem;}
    .item .df{font-size:.82rem;}
    .item .py{font-size:.64rem;}
    .opts{flex-direction:column;}
    .nav::after{content:'';position:absolute;right:0;top:0;bottom:0;width:26px;background:linear-gradient(90deg,rgba(247,251,252,0),rgba(247,251,252,.95));pointer-events:none;}
  }
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  // 字型改用 <link> 非同步載入（取代 CSS @import）：無網路時自動退回系統字，不阻塞渲染
  const fl=document.createElement('link');fl.rel='stylesheet';
  fl.href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
  document.head.appendChild(fl);
  document.title=`第 ${W.week} 週 · ${W.theme}｜生物化學 A2 互動課程`;

  /* ---------- helpers ---------- */
  function shade(hex,amt){ // amt -100..100 (neg darker)
    const c=hex.replace('#','');const r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);
    const f=v=>Math.max(0,Math.min(255,Math.round(v+(amt/100)*(amt<0?v:255-v))));
    return '#'+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function tint(hex,border){return border?hexA(hex,.32):hexA(hex,.12);}
  function hexA(hex,a){const c=hex.replace('#','');const r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);return `rgba(${r},${g},${b},${a})`;}
  function esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  /* ---------- build skeleton（每個區塊都是「有資料才渲染」） ---------- */
  const hasReview=!!(W.review&&W.review.length);
  const hasKP=!!(W.keypoints&&W.keypoints.length);
  const hasVocab=!!(W.vocab&&W.vocab.length);
  const hasG1=!!(W.g1&&W.g1.length),hasG2=!!(W.g2&&W.g2.length),hasG3=!!(W.g3&&W.g3.length),
        hasG4=!!(W.g4&&W.g4.length),hasG5=!!(W.g5&&W.g5.length);

  document.body.innerHTML=`
  <div class="top"><div class="wrap">
    <span class="kick">${esc(W.course)} ｜ ${esc(W.unit)}</span>
    <h1>${esc(W.icon||'🧬')} 第 ${W.week} 週 · ${esc(W.theme)}</h1>
    <div class="meta">
      <span>🎯 CEFR A2</span>
      <span>🇻🇳 含越南文對照</span>
      <span>🇬🇧 含英文術語</span>
    </div>
  </div></div>
  <div class="nav"><div class="wrap">
    ${hasReview?'<a href="#review">🔄 上週複習</a>':''}
    ${hasKP?'<a href="#keypoints">📌 本週重點</a>':''}
    ${hasVocab?'<a href="#vocab">🔑 三語詞彙</a>':''}
    ${hasG1?'<a href="#g1">🎮 詞義配對</a>':''}
    ${hasG2?'<a href="#g2">✅ 對或錯</a>':''}
    ${hasG3?'<a href="#g3">🧩 步驟排序</a>':''}
    ${hasG4?'<a href="#g4">🧠 情境題</a>':''}
    ${hasG5?'<a href="#g5">✏️ 選詞填空</a>':''}
    <a href="index.html">📚 全部課程</a>
  </div></div>
  <div class="wrap">
    <div class="score-strip">
      <div><b>🏆 今日總分</b> <span class="stars" id="stars">☆☆☆☆☆</span></div>
      <div>完成遊戲：<span id="doneCount" style="font-weight:900;color:var(--brand)">0</span> / ${[hasG1,hasG2,hasG3,hasG4,hasG5].filter(Boolean).length}</div>
      <div id="stuChip" style="cursor:pointer;font-size:.86rem" title="點一下可以改姓名">👤 <span id="stuName">點我登記姓名</span> <span id="cloudSt"></span></div>
      <div class="total-pill"><span id="totalPts">0</span> / ${[hasG1,hasG2,hasG3,hasG4,hasG5].filter(Boolean).length*100}</div>
    </div>

    ${hasReview?`<section id="review"><h2>🔄 上週複習</h2>
      <p class="lead">開始新課之前，先回想一下。點選答案馬上知道對不對，不算分。</p>
      <div id="revHost"></div>
    </section>`:''}

    ${hasKP?`<section id="keypoints"><h2>📌 本週重點</h2>
      <p class="lead">先讀一遍重點，再進入詞彙與遊戲。黃色的詞是本週重點。</p>
      <div id="kpHost"></div>
    </section>`:''}

    ${hasVocab?`<section id="vocab"><h2>🔑 三語詞彙 · ${W.vocab.length} 個</h2>
      <p class="lead">中文、拼音、越南文（tiếng Việt）與英文對照，附解釋與例句。</p>
      <div class="vgrid" id="vgrid"></div>
    </section>`:''}

    ${hasG1?`<section id="g1"><h2>🎮 遊戲一 · 詞義配對</h2>
      <p class="lead">點左邊的中文詞 → 再點右邊對應的越南文意思。配錯會扣分喔！</p>
      <div class="bar"><div>進度 <span class="v" id="g1prog">0 / ${W.g1.length}</span></div><div>錯誤 <span class="e" id="g1err">0</span></div></div>
      <div class="board"><div class="col"><h3>📚 中文</h3><div id="g1L"></div></div><div class="col"><h3>🇻🇳 越南文</h3><div id="g1R"></div></div></div>
      <div class="fb" aria-live="polite" id="g1fb"></div>
      <div class="done" aria-live="polite" id="g1done"><div class="pts">+<span id="g1pts">100</span> 分</div><p>配對完成！</p><button class="btn ghost" id="g1reset">🔄 再玩一次</button></div>
    </section>`:''}

    ${hasG2?`<section id="g2"><h2>✅ 遊戲二 · 對或錯</h2><p class="lead">根據本週重點，判斷對 ✔ 或 錯 ✘。</p>
      <div id="g2host"></div><button class="btn" id="g2btn">送出答案</button>
      <div class="done" aria-live="polite" id="g2done"><div class="pts">+<span id="g2pts">0</span> 分</div><p id="g2msg"></p><button class="btn ghost" id="g2reset">🔄 再玩一次</button></div>
    </section>`:''}

    ${hasG3?`<section id="g3"><h2>🧩 遊戲三 · 步驟排序</h2><p class="lead">點詞語，把步驟排成正確的順序。</p>
      <div id="g3host"></div>
      <div class="done" aria-live="polite" id="g3done"><div class="pts">+<span id="g3pts">0</span> 分</div><p>排序完成！</p><button class="btn ghost" id="g3reset">🔄 再玩一次</button></div>
    </section>`:''}

    ${hasG4?`<section id="g4"><h2>🧠 遊戲四 · 情境題</h2><p class="lead">遇到下面的情況，選一個最好的答案。</p>
      <div id="g4host"></div><button class="btn" id="g4btn">送出答案</button>
      <div class="done" aria-live="polite" id="g4done"><div class="pts">+<span id="g4pts">0</span> 分</div><p id="g4msg"></p><button class="btn ghost" id="g4reset">🔄 再玩一次</button></div>
    </section>`:''}

    ${hasG5?`<section id="g5"><h2>✏️ 遊戲五 · 選詞填空</h2><p class="lead">選出最合適的詞，填進句子裡。</p>
      <div id="g5host"></div><button class="btn" id="g5btn">送出答案</button>
      <div class="done" aria-live="polite" id="g5done"><div class="pts">+<span id="g5pts">0</span> 分</div><p id="g5msg"></p><button class="btn ghost" id="g5reset">🔄 再玩一次</button></div>
    </section>`:''}

    <div class="pager">
      <a id="prev" href="#">← 上一週</a>
      <a href="index.html">📚 課程目錄</a>
      <a id="next" href="#">下一週 →</a>
    </div>
    <footer>生物化學 A（越南學生班・中文 A2）互動課程 ｜ 第 ${W.week} 週 ｜ 繁體中文，附越南文與英文對照</footer>
  </div>`;

  /* ---------- 學習紀錄：Firebase Firestore + Supabase 雙寫 ----------
     沿用 my-teaching-tools-517a0 既有架構：
     - Firestore collection：biochem_results
     - Supabase：public.interactions（course_code='biochem-vi'）
     離線（file:// 或無網路）時安靜降級：分數照常顯示，只是不上傳。
     雙寫以 Promise.all 並列送出，各自 try/catch，互不影響。 */
  const TK={
    fb:{apiKey:"AIzaSyCTLhRf7jcJH_AwUzbV4MawkrKNPrIVG5Y",authDomain:"my-teaching-tools-517a0.firebaseapp.com",projectId:"my-teaching-tools-517a0",storageBucket:"my-teaching-tools-517a0.firebasestorage.app",messagingSenderId:"244288457011",appId:"1:244288457011:web:4b3ff8a846a6c50b169646"},
    fbVer:'10.7.0', col:'biochem_results',
    sbUrl:'https://qmldcjkllisvfgegkfsz.supabase.co',
    sbKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGRjamtsbGlzdmZnZWdrZnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjM5ODYsImV4cCI6MjA4NjY5OTk4Nn0.Bfj0W7HN_n_vcjGe5502Chamk0YV-de8a0fxF4Nyczk',
    sbTable:'interactions', course:'biochem-vi',
    nameKey:'bio_student_name', anonIdKey:'bio_anon_id'
  };
  const GAME_NAMES={g1:'詞義配對',g2:'對或錯',g3:'步驟排序',g4:'情境題',g5:'選詞填空'};
  const pad2=n=>String(n).padStart(2,'0');
  const SESSION_ID='biovi_w'+pad2(W.week)+'_'+new Date().toISOString().slice(0,10).replace(/-/g,'');
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function hash(s){let h=5381;for(let i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))>>>0;}return h.toString(36);}
  function askName(){
    const cur=lsGet(TK.nameKey)||'';
    const v=window.prompt('請輸入你的姓名或座號（老師記錄成績用）：',cur);
    if(v===null)return;
    lsSet(TK.nameKey,v.trim());stuChipRefresh();
  }
  function getStudent(){
    let name=lsGet(TK.nameKey);
    if(name===null){askName();name=lsGet(TK.nameKey);}
    name=(name||'').trim();
    if(name)return{name,id:'stu_'+hash(name)};
    let anon=lsGet(TK.anonIdKey);
    if(!anon){anon='anon_'+Math.random().toString(36).slice(2,10);lsSet(TK.anonIdKey,anon);}
    return{name:'',id:anon};
  }
  function stuChipRefresh(){
    const n=(lsGet(TK.nameKey)||'').trim();
    document.getElementById('stuName').textContent=n||'點我登記姓名';
  }
  document.getElementById('stuChip').onclick=askName;
  stuChipRefresh();
  let _fb=null;
  async function fbEnsure(){
    if(_fb)return _fb;
    const app=await import(`https://www.gstatic.com/firebasejs/${TK.fbVer}/firebase-app.js`);
    const fs=await import(`https://www.gstatic.com/firebasejs/${TK.fbVer}/firebase-firestore.js`);
    const db=fs.getFirestore(app.initializeApp(TK.fb));
    _fb={db,addDoc:fs.addDoc,collection:fs.collection,serverTimestamp:fs.serverTimestamp};
    return _fb;
  }
  async function fbRecord(p){
    try{
      const fb=await fbEnsure();
      await fb.addDoc(fb.collection(fb.db,TK.col),{...p,completedAt:fb.serverTimestamp(),ua:navigator.userAgent.substring(0,100)});
      return true;
    }catch(e){console.warn('[Firebase] write failed:',e);return false;}
  }
  async function sbRecord(p){
    try{
      const row={course_code:TK.course,session_id:p.sessionId,student_id:p.studentId,student_name:p.studentName||'',
        game_id:p.gameId,game_name:p.gameName||'',score:Number(p.score)||0,wrong:Number(p.wrong)||0,total:Number(p.total)||0,
        duration_ms:0,client_meta:{ua:navigator.userAgent.substring(0,100),...(p.meta||{})}};
      const res=await fetch(`${TK.sbUrl}/rest/v1/${TK.sbTable}`,{method:'POST',
        headers:{'apikey':TK.sbKey,'Authorization':`Bearer ${TK.sbKey}`,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify(row)});
      if(!res.ok){console.warn('[Supabase] HTTP',res.status,await res.text());return false;}
      return true;
    }catch(e){console.warn('[Supabase] write failed:',e);return false;}
  }
  function sendRecord(g,pts){
    let payload;
    try{
      const stu=getStudent();
      payload={studentId:stu.id,studentName:stu.name,sessionId:SESSION_ID,
        gameId:'w'+pad2(W.week)+'_'+g,gameName:GAME_NAMES[g]||g,score:pts,total:100,wrong:0,
        meta:{week:W.week,theme:W.theme}};
    }catch(e){console.warn('[track]',e);return;}
    Promise.allSettled([fbRecord(payload),sbRecord(payload)]).then(([f,s])=>{
      const st=document.getElementById('cloudSt');
      if(!st)return;
      const fok=f.status==='fulfilled'&&f.value,sok=s.status==='fulfilled'&&s.value;
      if(fok||sok){st.textContent='☁️✓';st.title='成績已上傳'+(fok&&sok?'（Firebase＋Supabase）':fok?'（Firebase）':'（Supabase）');}
      else{st.textContent='📴';st.title='目前離線：成績只顯示在這一頁，沒有上傳';}
    });
  }

  /* ---------- scoreboard ---------- */
  const SCORES={},DONE={};
  ['g1','g2','g3','g4','g5'].forEach(g=>{if(W[g]&&W[g].length){SCORES[g]=0;DONE[g]=false;}});
  function award(g,pts){SCORES[g]=pts;DONE[g]=true;refresh();sendRecord(g,pts);}
  function refresh(){
    const total=Object.values(SCORES).reduce((a,b)=>a+b,0);
    const n=Object.values(DONE).filter(Boolean).length;
    document.getElementById('totalPts').textContent=total;
    document.getElementById('doneCount').textContent=n;
    const total100=Object.keys(SCORES).length*100||1;
    const f=Math.round(total/100);
    document.getElementById('stars').textContent='★'.repeat(Math.min(5,f))+'☆'.repeat(Math.max(0,5-f));
  }

  /* ---------- 上週複習 / 課前先備知識（不算分，即點即回饋） ----------
     資料格式：W.review=[{s:'題目',o:['選項…'],a:正解索引,e:'解說（可省略）'},…]。 */
  if(hasReview){
    const h=document.getElementById('revHost');
    W.review.forEach((q,i)=>{
      const opts=shuffle(q.o.map((t,k)=>({t,k}))).map(o=>`<div class="opt" role="button" tabindex="0" data-k="${o.k}">${esc(o.t)}</div>`).join('');
      h.insertAdjacentHTML('beforeend',`<div class="q"><div class="stem"><span class="n">${i+1}</span>${esc(q.s)}</div><div class="opts">${opts}</div><div class="exp">${esc(q.e||'')}</div></div>`);
      const box=h.lastElementChild;
      box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
        if(box.dataset.done)return;box.dataset.done='1';
        box.querySelectorAll('.opt').forEach(x=>x.style.pointerEvents='none');
        box.querySelector(`.opt[data-k="${q.a}"]`).classList.add('right');
        if(+o.dataset.k!==q.a)o.classList.add('wrong');
        if(q.e)box.querySelector('.exp').classList.add('show');
      });
    });
  }

  /* ---------- 發音（Web Speech 聽力輔助；裝置沒有中文語音時按了沒聲音，不影響其他功能） ---------- */
  const hasTTS=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
  function speak(t){
    if(!hasTTS||!t)return;
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(t);
      const v=speechSynthesis.getVoices().find(x=>/^zh([-_]|$)|cmn/i.test(x.lang||''));
      if(v)u.voice=v;
      u.lang='zh-TW';u.rate=.85;
      speechSynthesis.speak(u);
    }catch(e){}
  }
  if(hasTTS){
    document.addEventListener('click',e=>{
      const b=e.target.closest('.spk');
      if(b){e.stopPropagation();e.preventDefault();speak(b.dataset.t);}
    },true);
  }

  /* ---------- 鍵盤操作：Enter／空白鍵等同點擊（選項與配對卡） ---------- */
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.classList&&
       (e.target.classList.contains('opt')||e.target.classList.contains('item'))){
      e.preventDefault();e.target.click();
    }
  });

  /* ---------- keypoints（本週重點） ----------
     資料格式：W.keypoints=[{h:'小標',p:['短句…'],img:'相對路徑',imgCap:'中文／越南文圖說'},…] */
  if(hasKP){
    const kh=document.getElementById('kpHost');
    W.keypoints.forEach(k=>{
      const ps=(k.p||[]).map(p=>`<p>${p}</p>`).join('');
      const img=k.img?`<img src="${esc(k.img)}" alt="${esc(k.imgCap||k.h||'')}">${k.imgCap?`<div class="imgcap">${esc(k.imgCap)}</div>`:''}`:'';
      kh.insertAdjacentHTML('beforeend',`<div class="kp">${k.h?`<h3>${esc(k.h)}</h3>`:''}${ps}${img}</div>`);
    });
  }

  /* ---------- vocab（三語詞彙卡） ---------- */
  if(hasVocab){
    const vg=document.getElementById('vgrid');
    W.vocab.forEach(v=>vg.insertAdjacentHTML('beforeend',
      `<div class="vc"><div class="w">${esc(v.w)}${hasTTS?` <button class="spk" data-t="${esc(v.w)}" title="聽發音">🔊</button>`:''}</div><div class="py">${esc(v.py)}</div><div class="vn">🇻🇳 ${esc(v.vn)}</div>${v.en?`<div class="en">🇬🇧 ${esc(v.en)}</div>`:''}<div class="ex">${esc(v.df)}${v.ex?`<br><span style="color:var(--mut)">例：${esc(v.ex)}</span>`:''}</div></div>`));
  }

  /* ---------- G1 match（詞義配對：中文 ↔ 越南文） ---------- */
  if(hasG1)(function(){
    const pairs=W.g1;let lsel,rsel,matched,err;
    function render(){
      matched=0;err=0;lsel=rsel=null;
      document.getElementById('g1prog').textContent=`0 / ${pairs.length}`;
      document.getElementById('g1err').textContent='0';
      document.getElementById('g1done').classList.remove('show');
      const L=document.getElementById('g1L'),R=document.getElementById('g1R');L.innerHTML='';R.innerHTML='';
      shuffle(pairs).forEach(p=>{const e=document.createElement('div');e.className='item';e.tabIndex=0;e.setAttribute('role','button');e.dataset.zh=p.zh;
        e.innerHTML=`<span><span class="zh">${esc(p.zh)}</span><span class="py">${esc(p.py||'')}</span></span>${hasTTS?`<button class="spk" data-t="${esc(p.zh)}" title="聽發音">🔊</button>`:''}`;e.onclick=()=>pick(e,'L');L.appendChild(e);});
      shuffle(pairs).forEach(p=>{const e=document.createElement('div');e.className='item';e.tabIndex=0;e.setAttribute('role','button');e.dataset.zh=p.zh;
        e.innerHTML=`<span class="df">${esc(p.vn)}</span>`;e.onclick=()=>pick(e,'R');R.appendChild(e);});
    }
    function pick(elx,side){
      if(elx.classList.contains('ok'))return;
      document.querySelectorAll(side==='L'?'#g1L .item.sel':'#g1R .item.sel').forEach(x=>x.classList.remove('sel'));
      elx.classList.add('sel');if(side==='L')lsel=elx;else rsel=elx;check();
    }
    function check(){
      if(!lsel||!rsel)return;const fb=document.getElementById('g1fb');
      if(lsel.dataset.zh===rsel.dataset.zh){
        [lsel,rsel].forEach(x=>{x.classList.add('ok');x.classList.remove('sel');});matched++;
        document.getElementById('g1prog').textContent=`${matched} / ${pairs.length}`;
        fb.className='fb show ok';fb.textContent='✓ 配對成功！';setTimeout(()=>fb.classList.remove('show'),900);
        lsel=rsel=null;
        if(matched===pairs.length){const pts=Math.max(20,100-err*10);document.getElementById('g1pts').textContent=pts;
          document.getElementById('g1done').classList.add('show');award('g1',pts);}
      }else{
        err++;document.getElementById('g1err').textContent=err;const a=lsel,b=rsel;[a,b].forEach(x=>x.classList.add('bad'));
        fb.className='fb show no';fb.textContent='✗ 不對，再想想看！';
        setTimeout(()=>{[a,b].forEach(x=>x.classList.remove('bad','sel'));fb.classList.remove('show');},700);lsel=rsel=null;
      }
    }
    document.getElementById('g1reset').onclick=render;render();
  })();

  /* ---------- G2 true/false（對或錯） ---------- */
  if(hasG2)(function(){
    const Q=W.g2;let picks=[];
    function render(){
      picks=Q.map(()=>null);const h=document.getElementById('g2host');h.innerHTML='';
      document.getElementById('g2done').classList.remove('show');document.getElementById('g2btn').style.display='';
      Q.forEach((q,i)=>{h.insertAdjacentHTML('beforeend',
        `<div class="q" id="g2q${i}"><div class="stem"><span class="n">${i+1}</span>${esc(q.t)}</div>
        <div class="opts"><div class="opt" role="button" tabindex="0" data-v="1">對 ✔</div><div class="opt" role="button" tabindex="0" data-v="0">錯 ✘</div></div><div class="exp">${esc(q.e)}</div></div>`);
        const box=h.lastElementChild;box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
          picks[i]=o.dataset.v==='1';box.querySelectorAll('.opt').forEach(x=>x.classList.remove('pick'));o.classList.add('pick');});
      });
    }
    document.getElementById('g2btn').onclick=function(){
      if(picks.includes(null)){alert('還有題目沒作答喔！');return;}
      let c=0;Q.forEach((q,i)=>{const box=document.getElementById('g2q'+i),opts=box.querySelectorAll('.opt');
        opts.forEach(o=>o.style.pointerEvents='none');opts[q.a?0:1].classList.add('right');
        if(picks[i]===q.a)c++;else opts[picks[i]?0:1].classList.add('wrong');box.querySelector('.exp').classList.add('show');});
      const pts=Math.round(c/Q.length*100);document.getElementById('g2pts').textContent=pts;
      document.getElementById('g2msg').textContent=`答對 ${c} / ${Q.length} 題`;
      this.style.display='none';document.getElementById('g2done').classList.add('show');award('g2',pts);
    };
    document.getElementById('g2reset').onclick=render;render();
  })();

  /* ---------- G3 reorder（步驟排序） ---------- */
  if(hasG3)(function(){
    const S=W.g3;let state;
    function render(){
      state=S.map(s=>({ok:false}));const h=document.getElementById('g3host');h.innerHTML='';
      document.getElementById('g3done').classList.remove('show');
      S.forEach((s,i)=>{
        h.insertAdjacentHTML('beforeend',
        `<div style="margin-bottom:18px"><div class="rlabel">${esc(s.label)}（排對會變綠色）</div>
         <div class="rlabel">你的答案：</div><div class="answer" id="g3a${i}"></div>
         <div class="rlabel">點下面的詞：</div><div class="pool" id="g3p${i}"></div></div>`);
        const pool=document.getElementById('g3p'+i);
        shuffle(s.tokens.map((t,idx)=>({t,idx}))).forEach(o=>{
          const b=document.createElement('button');b.className='tok';b.textContent=o.t;b.dataset.idx=o.idx;
          b.onclick=()=>move(i,b,'a');pool.appendChild(b);});
      });
    }
    function move(i,btn,to){
      const a=document.getElementById('g3a'+i),p=document.getElementById('g3p'+i);
      if(to==='a'){a.appendChild(btn);btn.onclick=()=>move(i,btn,'p');}else{p.appendChild(btn);btn.onclick=()=>move(i,btn,'a');}
      const seq=[...a.querySelectorAll('.tok')].map(b=>+b.dataset.idx);
      const ok=seq.length===S[i].tokens.length&&seq.every((v,k)=>v===k);
      a.style.borderColor=ok?'var(--teal)':'var(--line)';a.style.background=ok?'#E8F4F2':'#FCFEFE';state[i].ok=ok;
      if(state.every(s=>s.ok)){document.getElementById('g3pts').textContent=100;document.getElementById('g3done').classList.add('show');award('g3',100);}
    }
    document.getElementById('g3reset').onclick=render;render();
  })();

  /* ---------- G4 decision（情境題） ---------- */
  if(hasG4)(function(){
    const Q=W.g4;let picks=[];
    function render(){
      picks=Q.map(()=>null);const h=document.getElementById('g4host');h.innerHTML='';
      document.getElementById('g4done').classList.remove('show');document.getElementById('g4btn').style.display='';
      Q.forEach((q,i)=>{
        const opts=shuffle(q.o.map((t,k)=>({t,k}))).map(o=>`<div class="opt" role="button" tabindex="0" style="flex:1 1 100%" data-k="${o.k}">${esc(o.t)}</div>`).join('');
        h.insertAdjacentHTML('beforeend',`<div class="q" id="g4q${i}"><div class="stem"><span class="n">${i+1}</span>${esc(q.s)}</div><div class="opts" style="flex-direction:column">${opts}</div><div class="exp">${esc(q.e||q.w||'')}</div></div>`);
        const box=h.lastElementChild;box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
          picks[i]=+o.dataset.k;box.querySelectorAll('.opt').forEach(x=>x.classList.remove('pick'));o.classList.add('pick');});
      });
    }
    document.getElementById('g4btn').onclick=function(){
      if(picks.includes(null)){alert('還有情境沒選喔！');return;}
      let c=0;Q.forEach((q,i)=>{const box=document.getElementById('g4q'+i),opts=box.querySelectorAll('.opt');
        opts.forEach(o=>o.style.pointerEvents='none');box.querySelector(`.opt[data-k="${q.a}"]`).classList.add('right');
        if(picks[i]===q.a)c++;else box.querySelector(`.opt[data-k="${picks[i]}"]`).classList.add('wrong');box.querySelector('.exp').classList.add('show');});
      const pts=Math.round(c/Q.length*100);document.getElementById('g4pts').textContent=pts;
      document.getElementById('g4msg').textContent=`答對 ${c} / ${Q.length} 題`;
      this.style.display='none';document.getElementById('g4done').classList.add('show');award('g4',pts);
    };
    document.getElementById('g4reset').onclick=render;render();
  })();

  /* ---------- G5 fill（選詞填空） ---------- */
  if(hasG5)(function(){
    const Q=W.g5;let picks=[];
    const rights=Q.map(q=>q.o[q.a]); // 正解留在閉包內，不寫進 DOM 屬性
    function render(){
      picks=Q.map(()=>null);const h=document.getElementById('g5host');h.innerHTML='';
      document.getElementById('g5done').classList.remove('show');document.getElementById('g5btn').style.display='';
      Q.forEach((q,i)=>{
        const opts=shuffle(q.o.map(t=>t)).map(t=>`<div class="opt" role="button" tabindex="0" data-t="${esc(t)}">${esc(t)}</div>`).join('');
        h.insertAdjacentHTML('beforeend',`<div class="q" id="g5q${i}"><div class="stem"><span class="n">${i+1}</span>${esc(q.s)}</div><div class="opts">${opts}</div></div>`);
        const box=h.lastElementChild;box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
          picks[i]=o.dataset.t;box.querySelectorAll('.opt').forEach(x=>x.classList.remove('pick'));o.classList.add('pick');});
      });
    }
    document.getElementById('g5btn').onclick=function(){
      if(picks.includes(null)){alert('還有空格沒填喔！');return;}
      let c=0;Q.forEach((q,i)=>{const box=document.getElementById('g5q'+i),right=rights[i],opts=box.querySelectorAll('.opt');
        opts.forEach(o=>{o.style.pointerEvents='none';if(o.dataset.t===right)o.classList.add('right');});
        if(picks[i]===right)c++;else opts.forEach(o=>{if(o.dataset.t===picks[i])o.classList.add('wrong');});});
      const pts=Math.round(c/Q.length*100);document.getElementById('g5pts').textContent=pts;
      document.getElementById('g5msg').textContent=`答對 ${c} / ${Q.length} 題`;
      this.style.display='none';document.getElementById('g5done').classList.add('show');award('g5',pts);
    };
    document.getElementById('g5reset').onclick=render;render();
  })();

  /* ---------- pager（第 1–17 週，缺第 9 週期中考） ---------- */
  const order=[1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17];
  const idx=order.indexOf(W.week);
  const prev=document.getElementById('prev'),next=document.getElementById('next');
  if(idx>0){prev.href='w'+pad2(order[idx-1])+'.html';}else{prev.classList.add('disabled');}
  if(idx>=0&&idx<order.length-1){next.href='w'+pad2(order[idx+1])+'.html';}else{next.classList.add('disabled');}

  refresh();
})();
