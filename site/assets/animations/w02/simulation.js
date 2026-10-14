/* No free-running CSS animation or delayed callbacks. One paused clock drives
   the hero, reaction, pH and subtitle; reset/route changes cancel that clock. */
(() => {
  'use strict';
  const scenes = window.BUFFER_STORYBOARD;
  const el = Object.fromEntries(['lab','title','task','flow','stage','caption','progress','time','activity','feedback','back','play','replay','reset','next'].map(id => [id,document.getElementById(id)]));
  const completed = new Set();
  let scene = 0, t = 0, running = false, frame = 0, previous = null;
  let prediction = null, answered = false, additions = 0, acidShot = false, quiz = 0;
  const phValues = [7,6.9,6.8,6.7,6.6,6.5,6.4,6.2,5.8,4.2];
  const clamp = (v,min=0,max=1) => Math.min(max,Math.max(min,v));
  const current = () => scenes[scene];
  const observed = () => t >= current().duration;
  const cue = () => [...current().cues].reverse().find(c => t >= c.at) || current().cues[0];
  const lerp = (a,b,p) => a+(b-a)*clamp(p);
  const text = (x,y,content,size=32,cls='') => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" class="${cls}">${content}</text>`;
  const dot = (x,y,label,hero=false,r=31) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hero?'var(--orange)':'var(--pale)'}" stroke="${hero?'var(--orange)':'var(--teal)'}" stroke-width="3"/>${text(x,y+10,label,28,hero?'hero-label':'')}`;
  function feedback(message,retry=false) { el.feedback.textContent = message; el.feedback.classList.toggle('retry',retry); }
  function pause() { running=false; previous=null; cancelAnimationFrame(frame); frame=0; controls(); }
  function allowed() { return scene === 0 ? prediction !== null : answered; }
  function controls() {
    el.back.disabled = scene === 0;
    el.next.disabled = !allowed();
    el.next.textContent = scene === 5 ? '回課程：血液 →' : '下一幕 →';
    el.play.textContent = running ? '暫停' : (t > 0 ? '繼續' : '播放');
    el.play.disabled = !current().duration || observed() || (scene === 3 && prediction === null) || (scene === 4 && !acidShot);
    el.replay.textContent = scene === 4 ? '重設本幕' : '重播本幕';
    el.replay.disabled = !current().duration;
    const acid = document.getElementById('add-acid');
    if(acid) acid.disabled = acidShot || additions >= 9;
    el.lab.dataset.scene = current().id;
    el.lab.dataset.playing = String(running);
    el.lab.dataset.time = t.toFixed(2);
    el.lab.dataset.additions = additions;
  }
  function play() {
    if(el.play.disabled || running) return;
    running=true; previous=null; controls(); frame=requestAnimationFrame(tick);
  }
  function tick(now) {
    if(!running) return;
    if(previous !== null) t = Math.min(current().duration,t+(now-previous)/1000);
    previous=now; render();
    if(observed()) {
      pause();
      if(scene===4) { additions++; acidShot=false; render(); activity(); }
      else activity();
      return;
    }
    frame=requestAnimationFrame(tick);
  }
  function cup(name,buffer) {
    const compare = scene===1;
    const settled = compare && t >= (buffer?9:6);
    const ph = !compare?7:buffer?lerp(7,6.8,(t-6)/3):lerp(7,4.8,(t-3)/3);
    let particles = '';
    if(buffer) particles = dot(210,130,compare && t>=6?'HA':'A⁻',false,43)+dot(310,150,'HA',false,38);
    if(compare) {
      const x = buffer?lerp(80,210,(t-3)/3):90;
      const y = lerp(20,130,t/3);
      if(!buffer || t<6) particles += dot(x,y,'H⁺',true,36);
      else particles += `<circle cx="210" cy="130" r="49" fill="none" stroke="var(--orange)" stroke-width="4"/>`;
    }
    return `<div class="cup"><h2>${name}</h2><div class="ph">pH ${ph.toFixed(1)}</div><div class="delta">${settled?`↓ ${(7-ph).toFixed(1)}（示意）`:'同量、同體積（示意）'}</div><svg viewBox="0 0 400 200" role="img" aria-label="${buffer?'緩衝液中的 A⁻ 接住 H⁺':'水中的 H⁺ 增加'}"><path d="M35 25 V182 Q35 194 47 194 H353 Q365 194 365 182 V25" fill="var(--paper)" stroke="var(--teal)" stroke-width="5"/><path d="M38 95 H362 V185 H38Z" fill="var(--pale)" opacity=".55"/>${particles}</svg></div>`;
  }
  function mechanism() {
    const bound = t >= 6, x=lerp(170,525,(t-3)/3);
    const main = bound ? dot(525,75,'HA',false,48)+`<circle cx="525" cy="75" r="56" fill="none" stroke="var(--orange)" stroke-width="5"/>` : dot(525,75,'A⁻',false,43)+dot(x,75,'H⁺',true,34);
    return `<svg class="reaction" viewBox="0 0 800 145" role="img" aria-label="${bound?'H⁺ 成為 HA 的一部分':'H⁺ 靠近 A⁻'}">${main}</svg><div class="reaction-steps">${bound?'A⁻ + H⁺ → HA':'跟著橘色 H⁺'}</div>`;
  }
  function base() {
    const released=t>=3, water=t>=6;
    let main;
    if(water) main=dot(220,75,'A⁻',false,43)+dot(570,75,'H₂O',false,48);
    else if(released) main=dot(220,75,'A⁻',false,43)+dot(lerp(335,485,(t-3)/3),75,'H⁺',true,34)+dot(590,75,'OH⁻',false,43);
    else main=dot(220,75,'HA',false,43)+dot(590,75,'OH⁻',false,43);
    return `<svg class="reaction" viewBox="0 0 800 145" role="img" aria-label="HA 先釋出 H⁺，H⁺ 再中和 OH⁻">${main}</svg><div class="reaction-steps">${released?'① HA → H⁺ + A⁻':'OH⁻ 來了'}<br>${water?'② H⁺ + OH⁻ → H₂O':'先看 HA 如何提供 H⁺'}${t>=9?'<span class="base-ph">pH 7.0 → 7.2（示意）</span>':''}</div>`;
  }
  function capacity() {
    const consumed=additions + (acidShot && t>=3?1:0), remaining=Math.max(0,8-consumed);
    const n=Math.min(consumed,9), ph=phValues[n];
    const tokens=Array.from({length:8},(_,i)=>`<span class="token ${i>=remaining?'spent':''}">${i>=remaining?'HA':'A⁻'}</span>`).join('');
    const points=phValues.slice(0,n+1).map((p,i)=>`${45+i*37},${25+(7-p)*33}`).join(' ');
    const dots=phValues.slice(0,n+1).map((p,i)=>`<circle cx="${45+i*37}" cy="${25+(7-p)*33}" r="5" fill="var(--orange)"/>`).join('');
    const hero=acidShot?(t<3?'H⁺ → …':additions>=8?'H⁺ 留在水中':'A⁻ + H⁺ → HA'):(additions>=9?'H⁺ 留在水中':'每按一次，加一份酸');
    return `<div class="capacity"><div><h2>A⁻ remaining：${remaining} / 8 份</h2><div class="tokens" aria-label="A⁻ 剩 ${remaining} 份">${tokens}</div><div class="capacity-hero">${hero}</div></div><div><div class="ph">pH ${ph.toFixed(1)} <small>（示意）</small></div><svg class="trend" viewBox="0 0 410 160" role="img" aria-label="加酸 ${n} 次，pH 由 7.0 變為 ${ph.toFixed(1)}"><path d="M30 10 V130 H392" fill="none" stroke="var(--line)" stroke-width="3"/><polyline points="${points}" fill="none" stroke="var(--orange)" stroke-width="4"/>${dots}${text(210,156,`已加酸 ${n} 次`,23)}</svg></div></div>`;
  }
  function render() {
    if(scene===0 || scene===1) el.stage.innerHTML=`<div class="cups">${cup('水 Water',false)}${cup('緩衝液 Buffer',true)}</div>`;
    if(scene===2) el.stage.innerHTML=mechanism();
    if(scene===3) el.stage.innerHTML=base();
    if(scene===4) el.stage.innerHTML=capacity();
    if(scene===5) el.stage.innerHTML='<div class="transfer"><div class="node"><strong>酮酸 ↑</strong><small>Acid tăng</small></div><span>→</span><div class="node"><strong>HCO₃⁻</strong><small>接住 H⁺</small></div><span>→</span><div class="node"><strong>pH ↓ ?</strong><small>容量有限</small></div></div>';
    el.caption.textContent=scene===4 && !acidShot && additions===0?'按「+ Acid」，觀察 A⁻ 的剩餘量。':scene===4 && (additions>=9 || acidShot && additions>=8 && t>=3)?current().exhausted_cue:cue().text;
    el.progress.value=current().duration?t/current().duration:0;
    el.time.textContent=current().duration?`${Math.floor(t)} / ${current().duration} 秒`:'先想一想';
    controls();
  }
  function choices(question,options,onChoose,selected=null) {
    const p=document.createElement('p'); p.textContent=question; el.activity.append(p);
    const group=document.createElement('div'); group.className='choices'; group.setAttribute('role','group'); group.setAttribute('aria-label',question);
    options.forEach((label,i)=> {
      const btn=document.createElement('button'); btn.type='button'; btn.textContent=label;
      btn.setAttribute('aria-pressed',String(i===selected)); btn.classList.toggle('selected',i===selected);
      btn.addEventListener('click',()=> {
        group.querySelectorAll('button').forEach((b,j)=> {b.classList.toggle('selected',j===i); b.setAttribute('aria-pressed',String(j===i));});
        onChoose(i,group);
      }); group.append(btn);
    }); el.activity.append(group);
  }
  function check(question) {
    choices(question.question,question.choices,(i,group)=> {
      if(i!==question.answer) { feedback('再想一想：看反應式與剩餘量。',true); return; }
      group.querySelectorAll('button').forEach(b=>b.disabled=true);
      feedback(question.explanation);
      if(scene===5 && quiz===0) {
        quiz=1;
        const btn=document.createElement('button'); btn.textContent='再試一題 →'; btn.className='primary'; btn.type='button';
        btn.addEventListener('click',()=> {activity(); el.activity.querySelector('button').focus();});
        el.activity.append(btn);
      } else { answered=true; completed.add(scene); if(scene===5) feedback('完成 2 / 2！加酸看 A⁻，加鹼看 HA。緩衝有容量。'); }
      updateMap(); controls();
    });
  }
  function activity() {
    el.activity.replaceChildren();
    if(scene===0 || scene===3 && prediction===null) {
      choices(scene===0?current().question:current().prediction,scene===0?current().choices:current().prediction_choices,(i)=> {
        prediction=i;
        feedback('已記下你的預測。'+(scene===0?'下一幕用實驗比較。':'按「播放」觀察。'));
        if(scene===0) {completed.add(scene);updateMap();} else {activity();}
        controls();
      },prediction);
    } else if(scene===4) {
      const acid=document.createElement('button'); acid.id='add-acid'; acid.type='button'; acid.className='primary'; acid.textContent='+ Acid 加一份酸';
      acid.addEventListener('click',()=> {if(acidShot||additions>=9)return; t=0;acidShot=true;answered=false;feedback('先看反應，再加下一份。');render();play();});
      el.activity.append(acid);
      if(additions>=9) check(current());
      else {const p=document.createElement('p');p.textContent='每次等反應結束，再加酸。共試 9 次。';el.activity.append(p);}
    } else if(scene===5) {
      if(answered) {const p=document.createElement('p');p.className='result';p.textContent='完成 2 / 2。可以回課程，或全部重設。';el.activity.append(p);}
      else check(current().questions[quiz]);
    } else if(observed()) check(current());
    else {const p=document.createElement('p');p.textContent='按「播放」觀察。播完後回答原因。';el.activity.append(p);}
    controls();
  }
  function updateMap() {
    const names=['預測','比較','H⁺','加鹼','容量','應用'];
    document.querySelector('.scene-map').innerHTML=names.map((name,i)=>`<span ${i===scene?'aria-current="step"':''} class="${i===scene?'current':completed.has(i)?'done':''}">${i+1} ${name}</span>`).join('');
  }
  function enter(index) {
    pause(); scene=index;t=0;prediction=null;answered=false;additions=0;acidShot=false;quiz=0;
    el.title.textContent=current().title;el.flow.textContent=current().flow;el.task.textContent=current().task;
    feedback(''); updateMap();render();activity();
  }
  el.play.addEventListener('click',()=>running?pause():play());
  el.back.addEventListener('click',()=> {if(scene>0)enter(scene-1);});
  el.next.addEventListener('click',()=> {
    if(!allowed())return;
    if(scene<5) {enter(scene+1);el.title.setAttribute('tabindex','-1');el.title.focus();}
    else if(window.parent!==window && new URL(document.referrer || window.location.href).pathname.endsWith('/vi-a2/w02.html')) window.parent.postMessage({type:'w02-buffer-goto',target:'blood'},window.location.origin);
    else window.top.location.href=new URL('../../../vi-a2/w02.html#/blood',window.location.href).href;
  });
  el.replay.addEventListener('click',()=> {completed.delete(scene);enter(scene);});
  el.reset.addEventListener('click',()=> {completed.clear();enter(0);});
  document.addEventListener('visibilitychange',()=> {if(document.hidden)pause();});
  window.addEventListener('message',e=> {if(e.source===window.parent && e.origin===window.location.origin && e.data?.type==='w02-buffer-pause')pause();});
  window.addEventListener('pagehide',pause);
  enter(0);
})();
