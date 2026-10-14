(() => {
 'use strict';
 const lab=window.LEARNING_LABS[Number(document.documentElement.dataset.week)];
 if(!lab)throw new Error('找不到本週實驗室');
 const ids=['lab','title','task','flow','stage','caption','progress','time','activity','feedback','back','play','replay','reset','next','parameters'];
 const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
 const defaults=()=>({case:lab.week===16?1:0,...(lab.slider?{[lab.slider.key]:lab.slider.value}:{})});
 let scene=0,t=0,running=false,frame=0,previous=null,prediction=null,answered=false,quiz=0,round=0,params=defaults(),shot=false;
 const completed=new Set();
 const cur=()=>lab.scenes[scene],stepper=()=>lab.stepper&&scene===4;
 const duration=()=>stepper()?6:cur().duration;
 const observed=()=>duration()>0&&t>=duration();
 const roundMax=()=>lab.cases[params.case].n/2-1;
 const slug=`w${String(lab.week).padStart(2,'0')}`;
 document.title=`${slug.toUpperCase()} · ${lab.title}`;
 document.getElementById('brand').textContent=`${slug.toUpperCase()} / 生物化學實驗室`;
 document.getElementById('gloss').textContent=lab.gloss;
 document.getElementById('scope').textContent=lab.scope;
 const sources=document.getElementById('sources');
 lab.sources.forEach((url,i)=>{const a=document.createElement('a');a.href=url;a.textContent=`科學來源 ${i+1}`;a.target='_blank';a.rel='noopener';sources.append(a,'　');});
 const feedback=(message,retry=false)=>{el.feedback.textContent=message;el.feedback.classList.toggle('retry',retry);};
 function controls(){
  el.back.disabled=scene===0;
  el.next.disabled=scene===0?prediction===null:!answered;
  el.next.textContent=scene===5?'回本週課程 →':'下一幕 →';
  el.play.textContent=running?'暫停':t>0?'繼續':'播放';
  el.play.disabled=!duration()||observed()||(stepper()&&!shot);
  el.replay.disabled=scene===0||scene===5;
  el.replay.textContent=scene===3||scene===4?'重設本幕':'重播本幕';
  const step=document.getElementById('step');if(step)step.disabled=shot||round>=roundMax();
  el.lab.dataset.week=lab.week;el.lab.dataset.scene=cur().id;el.lab.dataset.time=t.toFixed(3);el.lab.dataset.playing=String(running);el.lab.dataset.round=round;
 }
 function pause(){running=false;previous=null;cancelAnimationFrame(frame);frame=0;controls();}
 function play(){if(el.play.disabled||running)return;running=true;previous=null;controls();frame=requestAnimationFrame(tick);}
 function tick(now){
  if(!running)return;if(previous!==null)t=Math.min(duration(),t+(now-previous)/1000);previous=now;render();
  if(observed()){
   pause();if(stepper()){round++;shot=false;render();}activity();return;
  }frame=requestAnimationFrame(tick);
 }
 function render(){
  const result=window.LEARNING_MODELS.render(lab,scene,scene===5?12:t,params,round);
  el.stage.innerHTML=result.html;el.stage.dataset.metrics=JSON.stringify(result.metrics);
  el.caption.textContent=stepper()?shot?'本圈進行中：看橘色的碳。':round>=roundMax()?'碳鏈已用完。最後 4C 形成兩份乙醯 CoA。':'按「做一圈」，觀察剩餘碳與產物。':window.LEARNING_MODELS.caption(lab,scene,t,params);
  el.progress.value=duration()?t/duration():0;el.time.textContent=duration()?`${Math.floor(t)} / ${duration()} 秒`:'先想一想';controls();
 }
 function map(){const names=['預測','比較','機制','改條件','找界線','應用'];document.querySelector('.scene-map').innerHTML=names.map((name,i)=>`<span class="${i===scene?'current':completed.has(i)?'done':''}" ${i===scene?'aria-current="step"':''}>${i+1} ${name}</span>`).join('');}
 function choices(q,onChoose){
  const p=document.createElement('p');p.textContent=q.question;el.activity.append(p);
  const group=document.createElement('div');group.className='choices';group.setAttribute('role','group');group.setAttribute('aria-label',q.question);
  q.choices.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.choice=i;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{group.querySelectorAll('button').forEach((other,j)=>{other.classList.toggle('selected',j===i);other.setAttribute('aria-pressed',String(j===i));});onChoose(i,group);});group.append(b);});el.activity.append(group);
 }
 function check(q){choices(q,(i,group)=>{
  if(i!==q.answer){feedback('再想一次：'+cur().task,true);return;}
  group.querySelectorAll('button').forEach(b=>b.disabled=true);feedback(q.explanation);
  if(scene===5&&quiz===0){quiz=1;const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='再試一題 →';b.id='quiz-next';b.addEventListener('click',()=>{activity();el.activity.querySelector('button').focus();});el.activity.append(b);}
  else{answered=true;completed.add(scene);if(scene===5)feedback('完成 2 / 2！可以回課程，或全部重設。');}map();controls();
 });}
 function activity(){
  el.activity.replaceChildren();
  if(scene===0)choices(lab.predict,i=>{prediction=i;feedback('已記下預測。下一幕比較結果。');completed.add(0);map();controls();});
  else if(scene===5){if(answered){const p=document.createElement('p');p.textContent='完成 2 / 2。';el.activity.append(p);}else check(lab.transfer[quiz]);}
  else if(stepper()){
   const b=document.createElement('button');b.id='step';b.type='button';b.className='primary';b.textContent='做一圈 β-氧化';
   b.addEventListener('click',()=>{if(shot||round>=roundMax())return;t=0;shot=true;feedback('本圈完成後，再做下一圈。');render();play();});el.activity.append(b);
   if(round>=roundMax())check(window.LEARNING_MODELS.question(lab,scene,params));else{const p=document.createElement('p');p.textContent=`已做 ${round} / ${roundMax()} 圈。每次等反應結束。`;el.activity.append(p);}
  }else if(observed())check(window.LEARNING_MODELS.question(lab,scene,params));
  else{const p=document.createElement('p');p.textContent='按「播放」觀察，再回答原因。';el.activity.append(p);}
  controls();
 }
 function parameterChanged(){pause();t=0;round=0;shot=false;answered=false;completed.delete(scene);feedback('條件已改變。請重新觀察，再回答。');render();activity();map();}
 function parameters(){
  el.parameters.replaceChildren();el.parameters.hidden=!(scene===3||scene===4);
  if(el.parameters.hidden)return;
  const label=document.createElement('label');label.textContent='條件：';const select=document.createElement('select');select.id='condition';
  lab.cases.forEach((c,i)=>{const option=document.createElement('option');option.value=i;option.textContent=c.label;select.append(option);});select.value=params.case;
  select.addEventListener('change',()=>{params.case=Number(select.value);parameterChanged();});label.append(select);el.parameters.append(label);
  if(lab.slider){const l=document.createElement('label');l.textContent=lab.slider.label+'：';const input=document.createElement('input');input.type='range';input.id='amount';input.min=lab.slider.min;input.max=lab.slider.max;input.step=lab.slider.step;input.value=params[lab.slider.key];const output=document.createElement('output');output.textContent=input.value;input.addEventListener('input',()=>{params[lab.slider.key]=Number(input.value);output.textContent=input.value;parameterChanged();});l.append(input,output);el.parameters.append(l);}
 }
 function enter(index){pause();scene=index;t=0;prediction=null;answered=false;quiz=0;round=0;shot=false;params=defaults();el.title.textContent=cur().title;el.task.textContent=cur().task;el.flow.textContent=['預測 Predict','觀察 Observe','解釋 Explain','操作 Experiment','找界線 Boundary','應用 Apply'][scene];feedback('');map();parameters();render();activity();window.scrollTo(0,0);}
 el.play.addEventListener('click',()=>running?pause():play());
 el.back.addEventListener('click',()=>{if(scene>0)enter(scene-1);});
 el.next.addEventListener('click',()=>{
  if(el.next.disabled)return;if(scene<5){enter(scene+1);el.title.setAttribute('tabindex','-1');el.title.focus();}
  else if(window.parent!==window&&new URL(document.referrer||window.location.href).pathname.endsWith(`/vi-a2/${slug}.html`))window.parent.postMessage({type:'learning-lab-return',week:lab.week},window.location.origin);
  else window.top.location.href=new URL(`../../../vi-a2/${slug}.html#/learning-return`,window.location.href).href;
 });
 el.replay.addEventListener('click',()=>{completed.delete(scene);enter(scene);});
 el.reset.addEventListener('click',()=>{completed.clear();enter(0);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 window.addEventListener('message',e=>{if(e.origin===window.location.origin&&e.source===window.parent&&(e.data?.type==='learning-lab-pause'||e.data==='slide:stop'))pause();});
 window.addEventListener('pagehide',pause);enter(0);
})();
