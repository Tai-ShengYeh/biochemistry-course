/* Deterministic educational renderers. Every diagram is a function of
   week + scene + parameters + paused time. No random motion or CSS timers. */
window.LEARNING_MODELS = (() => {
 const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*clamp(p);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const txt=(x,y,s,size=34,color='var(--ink)')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}">${esc(s)}</text>`;
 const node=(x,y,s,hero=false,r=32)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hero?'var(--orange)':'var(--pale)'}" stroke="${hero?'var(--orange)':'var(--teal)'}" stroke-width="3"/>${txt(x,y+11,s,34,hero?'white':'var(--ink)')}`;
 const line=(x,y,xx,yy,c='var(--teal)',dash=false)=>`<path d="M${x},${y} L${xx},${yy}" fill="none" stroke="${c}" stroke-width="5" ${dash?'stroke-dasharray="8 8"':''}/>`;
 const arrow=(x,y,xx,yy,c='var(--orange)')=>{const a=Math.atan2(yy-y,xx-x);return line(x,y,xx,yy,c)+`<path d="M${xx-15*Math.cos(a-.5)},${yy-15*Math.sin(a-.5)} L${xx},${yy} L${xx-15*Math.cos(a+.5)},${yy-15*Math.sin(a+.5)}" fill="none" stroke="${c}" stroke-width="5"/>`;};
 const svg=(s,label,h=210)=>`<svg class="model-diagram" viewBox="0 0 660 ${h}" role="img" aria-label="${esc(label)}">${s}</svg>`;
 const values=rows=>`<div class="readouts">${rows.map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;
 const note=s=>`<p class="diagram-note">${esc(s)}</p>`;
 const formula=s=>`<div class="formula">${esc(s)}</div>`;
 const pathPoints=points=>points.map(([x,y])=>`${x},${y}`).join(' ');
 const poly=(points,color='var(--teal)',width=5)=>`<polyline points="${pathPoints(points)}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
 function render(lab,scene,t,params,round=0){
  const p=clamp(t/9),phase=Math.min(3,Math.floor(t/3));
  const selected=lab.cases[params.case||0],c={...selected,...params};
  const advanced=scene>=3;let html='',metrics={};
  switch(lab.model){
   case 'fuel':{
    const digestion=advanced?c.digestion:true,atp=advanced?c.atp:true;
    const stage=Math.min(atp?3:2,Math.floor(t/3)),step=digestion?stage:0;
    const labels=['澱粉','葡萄糖','細胞反應','細胞工作'];
    html=`<div class="process-lane">${labels.map((s,i)=>`<div class="process-node ${i<=step?'lit':''}">${s}${i<3?'<span class="process-arrow">→</span>':''}</div>`).join('')}</div>`;
    html+=svg(Array.from({length:6},(_,i)=>node(95+i*44,scene===2?70:100,'',i===0,15)).join('')+(digestion&&t>=3?arrow(160,150,400,150)+node(mix(420,560,p),150,'G',true,35):''), '澱粉消化形成葡萄糖，再進入細胞');
    html+=values([['物質路徑',digestion?'澱粉 → 葡萄糖 → 多步反應':'澱粉停在消化前'],['能量路徑',atp&&digestion&&t>=6?'部分能量 → ATP → 工作':'此步驟尚未提供能量']]);
    html+=formula('葡萄糖不是直接改名成 ATP');metrics={digestion,atp,step,work:digestion&&atp&&t>=9};break;
   }
   case 'peptide':{
    /* Structural condensation diagram: H₂N–Cα(R)–C(=O)–OH units. Per junction,
       a = approach progress, b = bond progress (OH + H leave as H₂O, C–N forms). */
    const n=advanced?c.n:2,Y=128;
    const L=n<=2?62:n===3?52:44,G=.9*L,W=.8*L,D=L*.75,fs=Math.round(L*.44),sm=Math.round(fs*.8),p=fs*.55;
    /* Scene 3 starts with the units apart, so its viewBox grows with n; the wrapper scrolls on narrow screens. */
    const vw=Math.max(660,Math.ceil(3*n*L+(scene===3?(n-1)*(W+.65*L+G):0)+fs*2.2));
    const a=[],b=[];
    for(let i=0;i<n-1;i++){
     let av=1,bv=1;
     if(scene===0){av=0;bv=0;}
     else if(scene===1){av=clamp((t-3)/2.5);bv=clamp((t-6)/2.5);}
     else if(scene===2){av=clamp(t/2.5);bv=clamp((t-3)/5);}
     else if(scene===3){const span=6/(n-1),st=3+i*span;av=clamp((t-st)/(span*.4));bv=clamp((t-st-span*.4)/(span*.55));}
     a.push(av);b.push(bv);
    }
    const bonds=b.filter(v=>v>=.6).length,formed=bonds===n-1;
    const extra=i=>(W+.65*L)*(1-b[i])+G*(1-a[i]);
    const N=[];let run=0;for(let j=0;j<n;j++){N.push(run);run+=3*L+(j<n-1?extra(j):0);}
    const x0=(vw-(run+fs*1.85))/2+fs*1.15;for(let j=0;j<n;j++)N[j]+=x0;
    const ink='var(--ink)',teal='var(--teal)',orange='var(--orange)';
    const tx=(x,y,s,size,color=ink,anchor='middle')=>`<text x="${x}" y="${y+size*.35}" text-anchor="${anchor}" style="font-size:${size}px" fill="${color}">${esc(s)}</text>`;
    const bd=(x1,y1,x2,y2,color=ink,w=4)=>`<path d="M${x1},${y1} L${x2},${y2}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    const ring=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${orange}" stroke-width="4"/>`;
    const box=(x,y,w,h,o=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff3c4" opacity="${o}"/>`;
    const hiPair=scene===1&&t>=3&&t<6,hiLeave=scene===2&&t>=3&&(b[0]??1)<.6,hiR=scene===1&&t>=9;
    let under='',over='';
    for(let j=0;j<n;j++){
     const nx=N[j],cax=nx+L,cx=nx+2*L,last=j===n-1;
     over+=bd(nx+p,Y,cax-p*1.3,Y)+bd(cax+p*1.3,Y,cx-p,Y);
     if(j===0)over+=tx(nx+p*.9,Y,'H₂N',fs,teal,'end');
     else over+=tx(nx,Y,'N',fs,teal)+bd(nx,Y-p*1.2,nx,Y-D+p*1.1)+tx(nx,Y-D,'H',fs,ink);
     over+=tx(cax,Y,'Cα',fs,ink)+bd(cax,Y+p*1.2,cax,Y+D-p*1.1)+tx(cax,Y+D,'R'+'₁₂₃₄'[j],fs,hiR?orange:teal);
     over+=tx(cx,Y,'C',fs,ink)+bd(cx-3,Y-p*1.2,cx-3,Y-D+p*1.1)+bd(cx+3,Y-p*1.2,cx+3,Y-D+p*1.1)+tx(cx,Y-D,'O',fs,orange);
     if(scene<=2)over+=tx(cax,Y+D+sm*1.45,`胺基酸 ${j+1}`,sm,teal);
     else if(scene===3)over+=tx(cax,Y+D+sm*1.45,String(j+1),sm,teal);
     if(last){over+=bd(cx+p,Y,cx+L-p*1.5,Y)+tx(cx+L,Y,'OH',fs,orange);continue;}
     const nn=N[j+1],bv=b[j],ohx=cx+L,hx=nn-.65*L,wx=cx+L*.5,wy=Y-D-fs*2.2;
     if(bv<.15){
      over+=bd(cx+p,Y,ohx-p*1.5,Y)+tx(ohx,Y,'OH',fs,orange)+bd(hx+p*.9,Y,nn-p,Y)+tx(hx,Y,'H',fs,ink);
      if(hiPair)over+=ring(cx,Y,p*1.7)+ring(nn,Y,p*1.7);
      if(hiLeave)over+=ring(ohx,Y,p*1.8)+ring(hx,Y,p*1.3);
     }else if(bv<.6){
      const q=(bv-.15)/.45,ox=mix(ohx,wx-fs*.9,q),oy=mix(Y,wy,q),hx2=mix(ohx+W,wx+fs*.9,q),hy=mix(Y,wy,q);
      over+=tx(ox,oy,'OH',fs,orange)+tx(hx2,hy,'H',fs,orange);
      if(hiLeave)over+=ring(ox,oy,p*1.8)+ring(hx2,hy,p*1.3);
     }else{
      const q=clamp((bv-.6)/.4);
      under+=box(cx-p*1.5,Y-D-p*1.4,nn-cx+p*3,D+p*3,.45+.55*q);
      over+=bd(cx+p,Y,nn-p,Y,orange,6)+tx(cx+L*.5,Y+D,n===2?'胜肽鍵':`鍵 ${j+1}`,sm,orange);
      if(scene<=3)over+=tx(wx,wy,'H₂O',fs,orange);
     }
    }
    if(scene===4){
     const ex=N[n-1]+3*L;
     if(t>=3){under+=box(N[0]-fs*1.25,Y-p*1.6,fs*1.95,p*3.2);over+=tx(N[0]-fs*.3,Y-D,'N 端',sm,orange);}
     if(t>=6){under+=box(N[n-1]+2*L-p*1.5,Y-D-p*1.4,L+p*3,D+p*3);over+=tx(ex,Y+D,'C 端',sm,orange);}
     if(t>=9)over+=arrow(N[0]-fs*.6,16,ex+fs*.4,16);
    }
    html=`<div class="peptide-wrap"><svg class="model-diagram peptide-diagram" viewBox="0 0 ${vw} 230" role="img" aria-label="兩個胺基酸的羧基與胺基縮合，形成 C—N 胜肽鍵並放出一個水分子">${under}${over}</svg></div>`;
    html+=formula(scene<=2?'—COOH ＋ H₂N— → —CO—NH— ＋ H₂O':'N 端 → 胜肽鏈 → C 端')+values([['胺基酸',`${n} 個`],['已形成胜肽鍵',`${bonds} 個`],['放出的水 H₂O',`${bonds} 個`],['直鏈完成後',`${n}−1 = ${n-1} 個鍵`]]);
    html+=note('簡圖用中性官能基。R₁、R₂ 是側鏈，不參與接鍵。');metrics={n,bonds,finalBonds:n-1,formed};break;
   }
   case 'fold':{
    const treatment=advanced?c.treatment:'heat';
    const chain=(offset,treat)=>{
     const unfold=treat==='heat'?p:0;
     const pts=Array.from({length:10},(_,i)=>{const a=i*.8,r=i%3===0?.35:1;return [mix(170+65*r*Math.cos(a),40+i*28,unfold),offset+mix(45*r*Math.sin(a),0,unfold)];});
     let result='';for(let i=0;i<pts.length-1;i++)if(!(treat==='cut'&&t>=6&&i===4))result+=line(...pts[i],...pts[i+1]);
     result+=pts.map(([x,y],i)=>node(x,y,'',i%3===0,10)).join('');return result;
    };
    html=svg(chain(90,'native')+`<g transform="translate(330,0)">${chain(90,treatment)}</g>`,'同一順序；加熱展開與蛋白酶切鏈不同')+values([['左：原形狀','保持摺疊'],['右：處理',treatment==='heat'?'形狀可能展開':treatment==='cut'?'主鏈可被水解':'保持摺疊'],['胺基酸順序','不因一般變性而重排']]);
    html+=note(scene===2?'橘色是疏水側鏈；此圖限水溶性蛋白質。':'看主鏈線是否被切斷，不只看形狀。');metrics={treatment,backboneCut:treatment==='cut'&&t>=6,sequencePreserved:true};break;
   }
   case 'oxygen':{
    const o=Number(params.oxygen??50)/100,low=advanced&&c.ph==='low';
    const hb=(x,lowPH=false)=>Math.pow(x,2.8)/(Math.pow(lowPH?0.43:0.29,2.8)+Math.pow(x,2.8));
    const mb=x=>x/(.09+x),bound=hb(o,low);
    if(scene===2){
     const n=Math.min(4,Math.floor(p*4));let s='';
     for(let i=0;i<4;i++){const x=230+(i%2)*200,y=60+Math.floor(i/2)*90;s+=node(x,y,'',false,35);if(i<n)s+=node(x,y,'O₂',true,31);}
     html=svg(s,'Hb 的四個位點依序結合 O₂')+values([['示意已結合',`${n} / 4 位點`],['結合後','形狀改變，其他位點較易結合']]);
    }else{
     const points=f=>Array.from({length:101},(_,i)=>[55+i*5.6,180-f(i/100)*155]);
     let s=line(45,185,625,185)+line(45,185,45,15)+poly(points(hb))+poly(points(mb),'var(--muted)');
     if(low)s+=poly(points(x=>hb(x,true)),'var(--orange)');
     s+=node(55+o*560,180-bound*155,'',true,8);
     html=note('Y：結合比例 ↑　X：氧氣量 →（定性模型）')+svg(s,'Mb 雙曲線、Hb S 型；低 pH 時 Hb 曲線向右移')+values([['Hb 結合比例（示意）',`${Math.round(bound*100)}%`],['Mb 位點','1'],['Hb 位點','4']])+note('青色：Hb；灰色：Mb；橘線：較低 pH 的 Hb。');
    }metrics={oxygen:o,ph:low?'low':'normal',hbFraction:bound,mbFraction:mb(o),hbSites:4,mbSites:1};break;
   }
   case 'energy':{
    const active=advanced?c.active:true;
    const curve=amp=>Array.from({length:101},(_,i)=>[55+i*5.5,145-amp*Math.sin(i/100*Math.PI)+i*.35]);
    let s=line(35,190,625,190)+line(35,190,35,10)+poly(curve(110),'var(--muted)');
    if(active||scene<3)s+=poly(curve(55));
    const a=active?55:110,at=Math.round(p*100);s+=node(55+at*5.5,145-a*Math.sin(at/100*Math.PI)+at*.35,'',true,8);
    html=note('Y：自由能 ↑　X：反應座標 →（不是時間）')+svg(s,'兩條反應路徑起終點相同，酵素路徑山頂較低')+values([['活化能',active?'有較低能障的路徑':'沒有此低能障路徑'],['起點 → 終點能量差','相同 ΔG'],['催化後的酵素','可再使用']]);
    if(scene===2){
     const joined=t>=3&&t<9,sx=t<3?mix(510,280,t/3):t<9?280:mix(280,510,(t-9)/3);
     const shape=`<path d="M120 40 Q190 0 250 40 L250 ${joined?65:55} L290 85 L250 115 L250 155 Q175 205 120 150 Z" fill="var(--pale)" stroke="var(--teal)" stroke-width="5"/>`;
     html=svg(shape+node(sx,85,t>=6?'P':'S',true,34)+txt(180,120,'E',42),'受質進入活性部位，反應後產物離開，酵素保留')+`<div class="process-lane"><div class="process-node ${t<3?'lit':''}">E + S</div><div class="process-node ${joined?'lit':''}">ES → 反應</div><div class="process-node ${t>=9?'lit':''}">E + P</div></div>`+note('E：酵素；S：受質；P：產物。形狀為概念示意。');
    }
    metrics={active,startEnergy:0,endEnergy:-1,deltaG:-1,activationModel:active?1:2};break;
   }
   case 'kinetics':{
    const km=advanced?c.km:2,vmax=advanced?c.vmax:10,sValue=Number(params.substrate??5);
    const v=(s,K=km,V=vmax)=>V*s/(K+s),rate=v(sValue);
    const pts=(K,V)=>Array.from({length:101},(_,i)=>[55+i*5.5,185-155*v(i*.2,K,V)/10]);
    let s=line(40,185,625,185)+line(40,185,40,10)+poly(pts(2,10),'var(--muted)')+poly(pts(km,vmax));
    const y=185-155*(vmax/2)/10,x=55+km/20*550;
    s+=line(40,y,x,y,'var(--orange)',true)+line(x,y,x,185,'var(--orange)',true)+node(55+sValue/20*550,185-rate/10*155,'',true,8);
    html=note('Y：反應速率 v ↑　X：[S] →（模型單位）')+svg(s,'米氏曲線，半個 Vmax 向下對應 Km')+values([['[S]',sValue],['v',rate.toFixed(2)],['表觀 Km',km],['Vmax',vmax]])+formula('v = Vmax × [S] / (Km + [S])')+note('青色：所選模型；灰色：正常；橘虛線：½ Vmax → Km。');
    metrics={substrate:sValue,km,vmax,rate};break;
   }
   case 'carbohydrate':{
    const enzyme=advanced?c.enzyme:'amylase',cutAlpha=enzyme==='amylase'&&t>=6,cutBeta=enzyme==='cellulase'&&t>=6;
    const chain=(y,beta,cut)=>{let s='';for(let i=0;i<5;i++){const x=110+i*105;if(i<4&&!(cut&&i===2))s+=line(x+25,y,x+80,y+(beta?(i%2?18:-18):0));s+=node(x,y,'G',beta,25);}return s;};
    html=svg(chain(55,false,cutAlpha)+chain(150,true,cutBeta),'兩條葡萄糖鏈，α 與 β 連接和所選酵素的切鍵結果')+values([['上：澱粉 α 鏈',cutAlpha?'已切開':'仍連接'],['下：纖維素 β 鏈',cutBeta?'假設加入適合酵素後切開':'此酵素未切開']])+note('連接方向用符號表示；不是精確原子圖。');
    if(scene===4)html+=`<div class="branches"><span>肝醣主鏈 ●—●—●—●</span><span>　↳ ●—●　↳ ●—●</span></div>`;
    metrics={enzyme,alphaCut:cutAlpha,betaCut:cutBeta,unitsIdentical:true};break;
   }
   case 'membrane':{
    const mode=advanced?c.mode:'passive',outside=advanced?c.outside:8,inside=advanced?c.inside:2,atp=Boolean(c.atp);
    const direction=mode==='passive'?(outside>inside?'in':'out'):(atp?'out':'stop');
    let s='';for(let i=0;i<9;i++){const x=80+i*62;for(const [y,sgn]of[[75,1],[135,-1]])s+=node(x,y,'',false,9)+line(x-3,y+sgn*10,x-8,y+sgn*25,'var(--orange)')+line(x+3,y+sgn*10,x+8,y+sgn*25,'var(--orange)');}
    s+=`<rect x="290" y="57" width="80" height="95" rx="12" fill="var(--pale)" stroke="var(--teal)" stroke-width="4"/>`;
    const y=direction==='in'?mix(25,185,p):direction==='out'?mix(185,25,p):180;
    if(scene===2)s+=`<circle cx="80" cy="75" r="22" fill="none" stroke="var(--orange)" stroke-width="5"/>`;
    else{s+=node(330,y,'X',true,22);if(direction!=='stop')s+=arrow(430,direction==='in'?25:180,430,direction==='in'?180:25);}
    html=values([['膜外（示意濃度）',outside],['膜內（示意濃度）',inside],['此路徑',mode==='passive'?'被動淨運輸':atp?'ATP 幫浦':'沒有 ATP 的幫浦']])+svg(s,'親水頭朝兩面的水；所選路徑的粒子移動方向')+formula(scene===2?'親水頭 → 兩側的水；疏水尾 → 膜中間':direction==='in'?'淨方向：外 → 內':direction==='out'?'淨方向：內 → 外':'此幫浦停止（不代表所有路徑停止）');
    metrics={outside,inside,mode,atp,direction};break;
   }
   case 'dna':{
    const sequence=advanced?c.sequence:'ATGC',complement=sequence.replace(/./g,b=>({A:'T',T:'A',G:'C',C:'G'}[b])),revealed=Math.min(sequence.length,Math.floor(p*(sequence.length+1)));
    html=`<div class="dna-row"><b>5′</b>${[...sequence].map((b,i)=>`<span class="base ${i===Math.min(revealed,sequence.length-1)?'hero':''}">${b}</span>`).join('')}<b>3′</b></div><div class="dna-links">${[...sequence].map((b,i)=>`<span>${i<revealed?(b==='A'||b==='T'?':':'⋮'):'　'}</span>`).join('')}</div><div class="dna-row"><b>3′</b>${[...complement].map((b,i)=>`<span class="base">${i<revealed?b:'?'}</span>`).join('')}<b>5′</b></div>`+note('A—T：2 個氫鍵；G—C：3 個氫鍵。');
    html+=values([['下股由左到右',`3′-${t>=9?complement:'配對中'}-5′`],['下股改寫成 5′→3′',t>=9?`5′-${[...complement].reverse().join('')}-3′`:'從右端開始讀']]);
    metrics={sequence,complement,reverseComplement:[...complement].reverse().join(''),revealed};break;
   }
   case 'coupling':{
    const linked=advanced?c.linked:true,cost=advanced?c.cost:20,release=advanced?c.release:-30,total=cost+release;
    html=`<div class="coupled"><div>需要能量<br><strong>ΔG ${cost>0?'+':''}${cost}</strong></div><div class="connector ${linked&&t>=6?'lit':''}">${linked?'真正連動':'未連動'}</div><div>提供有利反應<br><strong>ΔG ${release}</strong></div></div>`+values([['單位','假設 kJ/mol'],['連動總 ΔG',linked&&t>=6?total:'此時不當作同一反應'],['設定方向',linked&&t>=6?(total<0?'有利':'不利'):'未證明耦合']])+note('數字是教學假設；不是細胞 ATP 的固定 ΔG。');
    metrics={linked,cost,release,total:linked?total:null,favorable:linked&&total<0};break;
   }
   case 'glycolysis':{
    const n=advanced?c.n:1,investment=t>=3?2*n:0,production=t>=9?4*n:0;
    const split=t>=6;
    html=svg(node(170,85,'6C',true,39)+(split?arrow(230,85,390,45)+arrow(230,85,390,145)+node(455,45,'3C',false,35)+node(455,145,'3C',false,35):''),'每份六碳葡萄糖形成兩份三碳丙酮酸')+values([['葡萄糖份數',n],['投入 ATP',investment],['生成 ATP',production],['ATP 淨值',production-investment]]);
    if(scene===4)html=formula(t>=6?'NADH → NAD⁺（乳酸發酵）':'先追蹤 NADH')+`<div class="process-lane"><div class="process-node ${t>=3?'lit':''}">NADH</div><div class="process-node ${t>=6?'lit':''}">NAD⁺ 再生</div><div class="process-node ${t>=9?'lit':''}">再參與糖解</div></div>`+values([['糖解每份淨 ATP','2'],['發酵本身新增 ATP','0']]);
    metrics={n,investment,production,net:production-investment,finalNet:2*n,pyruvate:2*n,nadh:2*n,fermentationExtraATP:0};break;
   }
   case 'cycle':{
    const n=advanced?c.n:1,carbon=phase===0?4:phase===1?6:phase===2?5:4;
    let s=`<ellipse cx="330" cy="105" rx="185" ry="70" fill="none" stroke="var(--teal)" stroke-width="6"/>`;
    const a=p*2*Math.PI-Math.PI/2;s+=node(330+185*Math.cos(a),105+70*Math.sin(a),`${carbon}C`,true,34);
    html=svg(s,'4C 接受 2C，形成 6C，再逐步回到 4C')+formula('4C + 2C → 6C → 5C → 再生 4C')+values([['乙醯 CoA 份數／圈數',n],['TCA NADH',t>=9?3*n:'觀察中'],['TCA FADH₂ / GTP',t>=9?`${n} / ${n}`:'觀察中'],['TCA CO₂',t>=9?2*n:'觀察中']])+note('只數總碳，不追蹤每一顆碳的來源。');
    metrics={n,carbon,nadh:3*n,fadh2:n,gtp:n,co2:2*n};break;
   }
   case 'respiration':{
    const oxygen=advanced?c.oxygen:true,leak=advanced?c.leak:false,gradient=(oxygen&&!leak)?1:1-p;
    let s=line(40,75,620,75)+line(40,135,620,135);
    const pumps=[{x:110,l:'I'},{x:220,l:'II'},{x:330,l:'III'},{x:440,l:'IV'}];
    for(const {x,l}of pumps){s+=`<rect x="${x-28}" y="62" width="56" height="88" rx="8" fill="var(--pale)"/>`+txt(x,119,l,34);if(l!=='II'&&oxygen)s+=arrow(x+35,165,x+35,25);}
    s+=`<rect x="515" y="55" width="70" height="100" rx="15" fill="var(--pale)" stroke="var(--teal)" stroke-width="3"/>`;
    if(gradient>0.05)s+=node(550,mix(20,185,p),'H⁺',true,25);
    if(oxygen)s+=node(mix(80,460,p),195,'e⁻',false,22);
    if(leak)s+=arrow(605,30,605,180);
    html=note('上：膜間隙（H⁺ 較多）　下：基質')+svg(s,'I、III、IV 泵質子；II 不泵；H⁺ 通過 ATP 合成酶，電子走不同路徑')+note('右側大方塊：ATP 合成酶。')+values([['末端電子接受者',oxygen?'有 O₂':'沒有 O₂'],['維持梯度',gradient>.1?(leak?'正在流失':'可保留'):'已消散（示意）'],['ATP 合成',oxygen&&!leak?'經 ATP 合成酶回流':'梯度消散後下降']])+formula('H⁺ 提供驅動力；ADP + Pi → ATP');
    metrics={oxygen,leak,gradient,pumpingComplexes:['I','III','IV'],complexIIPumps:false,atpSupported:oxygen&&!leak};break;
   }
   case 'beta':{
    const n=advanced?c.n:16,max=n/2-1;
    const r=scene===4?round:Math.min(max,Math.floor(p*(max+1)));
    const products=r>=max?n/2:r,remaining=n-products*2;
    html=`<div class="carbon-chain" aria-label="剩餘 ${remaining} 個碳">${Array.from({length:remaining},(_,i)=>`<span class="carbon ${i>=remaining-(remaining===4?4:2)?'hero':''}" style="transform:translateY(${scene===4?clamp(t/6)*8:0}px)">C</span>`).join('')||'<span>碳鏈已用完</span>'}</div>`+values([['起始碳鏈',`C${n}`],['已完成圈數',`${r} / ${max}`],['乙醯 CoA（每份 2C）',products],['剩餘碳',remaining]])+formula(`${remaining} + ${products}×2 = ${n} 個碳`)+note('最後 4C 的一圈得到兩份乙醯 CoA。');
    metrics={n,rounds:r,maxRounds:max,acetyl:products,remaining,carbonTotal:remaining+products*2};break;
   }
   case 'organs':{
    const state=advanced?c.state:'fast',fed=state==='fed',long=state==='long';
    let s='';for(const [x,y,label]of[[130,55,'肝臟'],[520,55,'腦'],[130,165,'肌肉'],[520,165,'脂肪']])s+=`<rect x="${x-58}" y="${y-28}" width="116" height="56" rx="10" fill="var(--pale)" stroke="var(--teal)" stroke-width="3"/>`+txt(x,y+11,label,34);
    if(scene===2){s+=`<path d="M150 145 Q205 140 205 170 Q205 200 150 192" fill="none" stroke="var(--orange)" stroke-width="4"/>`+node(177+23*Math.cos(p*2*Math.PI),169+23*Math.sin(p*2*Math.PI),'',true,15);}
    else if(fed){s+=txt(330,148,'食物',34)+arrow(285,122,192,72)+node(mix(285,192,p),mix(122,72,p),'G',true,23);}
    else{s+=arrow(200,55,445,55)+node(mix(200,445,p),55,long?'K':'G',true,25);}
    html=svg(s,'器官位置固定，所選情境改變燃料來源與路線；橘色標記沿一條路徑移動')+values([['肝臟主要角色',fed?'儲存肝醣':long?'供血糖與酮體':'提供血糖'],['腦的燃料',long?'葡萄糖＋更多酮體':'主要用葡萄糖'],['肌肝醣','主要自用']])+note(scene===2?'橘色標記留在肌肉自用路徑。':fed?'此幕只追蹤食物到肝儲存的路徑；其他器官也會使用養分。':long?'K：酮體；腦仍有葡萄糖需求。':'G：葡萄糖；肝 → 血液 → 腦。');
    metrics={state,liverSuppliesBlood:!fed,muscleGlycogenExports:false,brainUsesKetones:long,brainNeedsGlucose:true};break;
   }
   default:throw new Error(`Missing model ${lab.model}`);
  }
  return {html,metrics};
 }
 function caption(lab,scene,t,params){
  const base=([...lab.scenes[scene].cues].reverse().find(c=>t>=c.at)||lab.scenes[scene].cues[0]).text;
  if(scene!==3&&scene!==4)return base;
  const c=lab.cases[params.case||0],phase=Math.min(3,Math.floor(t/3));
  const endings={
   fuel:!c.digestion?'缺少消化：這條澱粉路徑停在吸收前。':!c.atp?'此工作沒有可利用 ATP，因此工作停下。':'消化、吸收與細胞反應都要接上。',
   fold:c.treatment==='heat'?'同一條鏈展開，順序保留。':c.treatment==='cut'?'主鏈被切斷：這是水解，不是一般變性。':'此條件保持摺疊。換處理方式再比較。',
   oxygen:`目前${c.ph==='low'?'較低':'一般'} pH；氧氣量為 ${params.oxygen}（示意）。`,
   kinetics:`Km ${c.km}；Vmax ${c.vmax}（模型單位）。`,
   carbohydrate:c.enzyme==='amylase'?'這個酵素切開適合的 α 鏈，未切 β 鏈。':'假設加入纖維素酶，可切 β 鏈。人本來沒有此酵素。',
   membrane:c.mode==='passive'?`此被動淨方向：${c.outside>c.inside?'外 → 內':'內 → 外'}。`:c.atp?'ATP 幫浦把粒子逆梯度送出去。':'這個幫浦沒有 ATP，因此停止。',
   dna:`目前上股 5′-${c.sequence}-3′；下股反方向配對。`,
   coupling:c.linked?`真正連動後：${c.release} + ${c.cost} = ${c.release+c.cost}（假設 kJ/mol）。`:'未連動：不能只把旁邊的 ATP 當作完成耦合。',
   glycolysis:`${c.n} 份葡萄糖：投入 ${2*c.n}、生成 ${4*c.n}、淨 ${2*c.n} ATP。`,
   cycle:`只計 ${c.n} 圈 TCA；各項產物同步更新。`,
   respiration:!c.oxygen?'沒有氧；等待既有梯度消散，ATP 合成下降。':c.leak?'有氧但漏膜；電子路徑可走，梯度難維持。':'完整膜保留梯度，H⁺ 經 ATP 合成酶回流。',
   beta:`C${c.n}：${c.n/2-1} 圈，${c.n/2} 份乙醯 CoA。`,
   organs:c.state==='fed'?'吃飽：使用與儲存。肌肝醣主要自用。':c.state==='long'?'長期空腹：腦增加使用酮體，仍需要葡萄糖。':'空腹：肝提供血糖，肌肝醣主要自用。'
  };
  if(scene===4&&['energy','carbohydrate','glycolysis','cycle','dna'].includes(lab.model))return base;
  return phase>=2?(endings[lab.model]||base):base;
 }
 function question(lab,scene,params){
  const q=lab.scenes[scene].check,c=lab.cases[params.case||0];
  const Q=(question,choices,explanation)=>({question,choices,answer:q.answer,explanation});
  if(scene===3){
   if(lab.model==='fuel')return !c.atp&&c.digestion?Q('此 ATP 依賴的工作為什麼停下？',['所有細胞都死了','葡萄糖全部消失','此工作沒有可利用的 ATP'],'圖只描述一個 ATP 依賴的工作。'):Q(c.digestion?'澱粉在吸收前要先做什麼？':'這條澱粉路徑為什麼停在吸收前？',['先變成整個細胞','換粒子顏色','先經過消化'],'澱粉先消化成可吸收的小分子。');
   if(lab.model==='fold')return Q(c.treatment==='heat'?'右鏈展開，主鏈線仍完整，表示？':c.treatment==='cut'?'右鏈的主鏈線被切斷，屬於？':'此條件的右鏈保持什麼？',[c.treatment==='heat'?'形狀改變，順序保留':c.treatment==='cut'?'主鏈胜肽鍵水解':'原有摺疊','所有胺基酸順序重排','所有側鏈都消失'],'加熱變性與蛋白酶水解是不同變化。');
   if(lab.model==='energy')return Q('此條件的反應路徑？',['ΔG 一定變成零',c.active?'有酵素提供較低能障':'沒有此酵素低能障路徑','活化能完全消失'],'有活性的酵素降低能障，不改起終點。');
   if(lab.model==='kinetics')return Q(`此模型 [S]=Km 時，v 是多少？`,[String(c.vmax),String(c.vmax/2),'0'],`依公式，v = Vmax/2 = ${c.vmax/2}（模型單位）。`);
   if(lab.model==='carbohydrate')return Q('現在這個酵素可切哪種連接？',[c.enzyme==='amylase'?'β 連接':'α 連接','任何連接都切',c.enzyme==='amylase'?'適合的 α 連接':'適合的 β 連接'],'酵素要與連接配合；纖維素酶情境是假設加入。');
   if(lab.model==='membrane')return c.mode==='passive'?Q('此被動淨運輸往哪裡？',[c.outside>c.inside?'外 → 內':'內 → 外',c.outside>c.inside?'內 → 外':'外 → 內','永遠固定往內'],'此模型沿所選的濃度梯度。'):Q(c.atp?'此 ATP 幫浦怎麼搬？':'這個幫浦沒有 ATP，能說所有過膜都停嗎？',c.atp?['逆梯度，使用 ATP','沿梯度，不需能量','把粒子變成 ATP']:['不能，只表示這個幫浦停下','能，所有路徑都停','能，水一定不動'],'這張圖只描述選定的路徑。');
   if(lab.model==='dna'){const comp=c.sequence.replace(/./g,b=>({A:'T',T:'A',G:'C',C:'G'}[b]));return Q('此上股的對面，由左到右是？',[`5′-${comp}-3′`,`3′-${comp}-5′`,`3′-${c.sequence}-5′`],'配對與反平行方向都必須正確。');}
   if(lab.model==='coupling')return !c.linked?Q('未真正連動，可以把兩條反應當一條嗎？',['可以，只要旁邊有 ATP','可以，總和永遠是零','不能，需要連動機制'],'把反應放一起不等於耦合。'):Q(`此連動的總 ΔG=${c.release+c.cost}，方向如何？`,[c.release+c.cost<0?'不利':'有利','保證立刻發生',c.release+c.cost<0?'有利':'不利'],'總 ΔG 的正負判斷設定條件下的方向，不判斷速度。');
   if(lab.model==='glycolysis')return Q(`目前 ${c.n} 份葡萄糖，糖解淨 ATP？`,[String(4*c.n),String(2*c.n),String(6*c.n)],`${4*c.n}−${2*c.n}=${2*c.n}。淨值要扣掉投入。`);
   if(lab.model==='cycle')return Q(`目前 ${c.n} 圈 TCA，產生多少 NADH？`,[String(3*c.n),String(2*c.n),String(c.n)],`每圈 3；${c.n} 圈是 ${3*c.n}。`);
   if(lab.model==='respiration')return Q(!c.oxygen?'沒有氧，等待原有梯度消散後？':c.leak?'此漏膜情境的主要影響？':'完整膜在此主要幫忙什麼？',['ATP 一定更多',!c.oxygen?'ATP 合成能力下降':c.leak?'難以維持 H⁺ 梯度':'保留 H⁺ 梯度','電子直接變成 H⁺'],'電子傳遞、梯度與 ATP 合成是相關但不同的步驟。');
   if(lab.model==='organs')return Q(`目前「${c.state==='fed'?'吃飽':c.state==='long'?'長期空腹':'短期空腹'}」情境，主要看到？`,['肌肝醣直接供應全部血糖',c.state==='fed'?'使用與儲存養分':c.state==='long'?'腦增加用酮體，仍需葡萄糖':'肝幫助提供血糖','所有器官都用同一種燃料'],'看燃料來源、使用器官與所選狀態。');
  }
  if(scene===4&&lab.model==='kinetics')return Q('此模型 [S] 越來越高，v 趨近？',[String(c.vmax),String(c.vmax*2),'無限大'],'上限是所選模型的 Vmax。');
  if(scene===4&&lab.model==='dna'){const comp=c.sequence.replace(/./g,b=>({A:'T',T:'A',G:'C',C:'G'}[b]));return Q('此下股改寫成 5′→3′ 是？',[`5′-${[...comp].reverse().join('')}-3′`,`5′-${comp}-3′`,`5′-${c.sequence}-3′`],'由下股右端的 5′ 開始讀。');}
  return q;
 }
 return {render,caption,question};
})();
