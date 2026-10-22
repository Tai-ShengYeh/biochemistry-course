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
 /* Structural-diagram helpers (W01/W03/W08/W10/W14/W16). Font sizes are inline so the
    mobile 42px rule for abstract diagrams does not apply to these denser drawings. */
 const ink='var(--ink)',teal='var(--teal)',orange='var(--orange)',muted='var(--muted)',pale='var(--pale)',paper='var(--paper)';
 const tx=(x,y,s,size,color=ink,anchor='middle',extra='')=>`<text x="${x}" y="${y+size*.35}" text-anchor="${anchor}" style="font-size:${size}px${extra}" fill="${color}">${esc(s)}</text>`;
 const bd=(x1,y1,x2,y2,color=ink,w=4,dash='')=>`<path d="M${x1},${y1} L${x2},${y2}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''}/>`;
 const ring=(x,y,r,color=orange,w=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
 const box=(x,y,w,h,o=1,fill='#fff3c4')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" opacity="${o}"/>`;
 const dot=(x,y,r,fill=teal,stroke='white')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
 const arr=(x1,y1,x2,y2,color=orange,w=3,dash='')=>{const a=Math.atan2(y2-y1,x2-x1),h=4*w;return bd(x1,y1,x2,y2,color,w,dash)+`<path d="M${x2-h*Math.cos(a-.5)},${y2-h*Math.sin(a-.5)} L${x2},${y2} L${x2-h*Math.cos(a+.5)},${y2-h*Math.sin(a+.5)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;};
 const pill=(x,y,w,h,label,size,o={})=>`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${o.rx??h/2}" fill="${o.fill??'white'}" stroke="${o.stroke??teal}" stroke-width="${o.sw??2.5}"${o.dash?` stroke-dasharray="${o.dash}"`:''} opacity="${o.opacity??1}"/>`+tx(x,y,label,size,o.color??ink,'middle',o.opacity!==undefined?`;opacity:${o.opacity}`:'');
 const cross=(x,y,r,color=orange,w=4)=>bd(x-r,y-r,x+r,y+r,color,w)+bd(x+r,y-r,x-r,y+r,color,w);
 const wrap=(inner,label,vw=660,vh=230)=>`<div class="struct-wrap"><svg class="model-diagram struct-diagram" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${esc(label)}">${inner}</svg></div>`;
 /* Simplified glucose pyranose ring (Haworth style). flip mirrors it vertically (β chains). */
 const pyr=(cx,cy,o={})=>{
  const s=o.s??1,w=32*s,h=17*s,f=o.flip?-1:1,st=o.stroke??teal,fill=o.fill??pale,op=o.opacity??1;
  const A=[cx-w,cy],B=[cx-w/2,cy-h*f],C=[cx+w/2,cy-h*f],D=[cx+w,cy],E=[cx+w/2,cy+h*f],F=[cx-w/2,cy+h*f];
  let g=`<g opacity="${op}"><path d="M${A} L${B} L${C} L${D} L${E} L${F} Z" fill="${fill}" stroke="${st}" stroke-width="${2.5*s}" stroke-linejoin="round"/>`;
  g+=bd(F[0],F[1],E[0],E[1],st,6*s);
  g+=`<circle cx="${C[0]}" cy="${C[1]}" r="${7*s}" fill="white" stroke="${st}" stroke-width="${2*s}"/>`+tx(C[0],C[1],'O',11*s,orange);
  if(o.c6!==false){const y2=B[1]-14*s*f;g+=bd(B[0],B[1]-h*f*.15,B[0],y2,st,2.5*s)+tx(B[0],y2-8*s*f,'CH₂OH',9.5*s,ink);}
  if(o.label)g+=tx(cx,cy+h*f*.12,o.label,10.5*s,o.labelColor??teal);
  return g+'</g>';
 };
 const oCircle=(x,y,color=teal,s=1)=>`<circle cx="${x}" cy="${y}" r="${7*s}" fill="white" stroke="${color}" stroke-width="${2*s}"/>`+tx(x,y,'O',11*s,color===muted?muted:orange);
 const blob=(x,y,label,o={})=>`<ellipse cx="${x}" cy="${y}" rx="${o.rx??38}" ry="${o.ry??17}" fill="${o.fill??pale}" stroke="${o.stroke??teal}" stroke-width="3"${o.dash?' stroke-dasharray="6 5"':''} opacity="${o.opacity??1}"/>`+tx(x,y,label,o.size??12,o.color??ink,'middle',o.opacity!==undefined?`;opacity:${o.opacity}`:'');
 const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
 function render(lab,scene,t,params,round=0){
  const p=clamp(t/9),phase=Math.min(3,Math.floor(t/3));
  const selected=lab.cases[params.case||0],c={...selected,...params};
  const advanced=scene>=3;let html='',metrics={};
  switch(lab.model){
   case 'fuel':{
    /* Starch (α-glucose chain) → digestion → free glucose → transporter → cell:
       multi-step reactions (teal, matter path) branch energy (orange) to ADP+Pi→ATP → work. */
    const D=advanced?c.digestion:true,A=advanced?c.atp:true;
    const stage=Math.min(A?3:2,Math.floor(t/3)),step=D?stage:0;
    let d=0,e=0,rk=0,aL=0,wL=0,slide=0,stuck=false,noATP=false,legend=false;
    if(scene===1){d=D?clamp((t-3)/1.5):0;e=clamp((t-6)/1.2);rk=t>=7.2?3:0;aL=clamp((t-7.5)/1);wL=clamp((t-9)/1);legend=t>=9;}
    else if(scene===2){d=1;e=clamp(t/2.5);rk=t<3?0:Math.min(3,1+Math.floor(t-3));aL=clamp((t-6)/1.2);wL=clamp((t-9)/1);}
    else if(scene===3){if(D){d=clamp((t-3)/1.5);e=clamp((t-6)/1.2);rk=t>=7.2?3:0;aL=A?clamp((t-7.5)/1):0;wL=A?clamp((t-9)/1):0;}else{slide=clamp((t-3)/1.5);stuck=t>=6;}noATP=!A&&t>=6;}
    else if(scene===4){if(D){d=clamp(t/1.2);e=clamp((t-1.5)/1.2);rk=t>=3?3:0;aL=A?clamp((t-3.3)/1):0;wL=A?clamp((t-6)/1):0;}else{slide=clamp(t/1.5);stuck=t>=3;}noATP=!A&&t>=6;}
    else if(scene===5){d=1;e=1;rk=3;aL=1;wL=1;legend=true;}
    const atpLit=aL>=1,work=wL>0;
    let s='';
    /* cell */
    s+=`<rect x="300" y="14" width="345" height="204" rx="26" fill="${pale}" stroke="${teal}" stroke-width="3"/><rect x="307" y="21" width="331" height="190" rx="20" fill="white" stroke="${teal}" stroke-width="2"/>`;
    s+=tx(330,36,'細胞',14,teal);
    /* transporter in the left wall */
    s+=`<rect x="292" y="94" width="30" height="16" rx="5" fill="${teal}"/><rect x="292" y="126" width="30" height="16" rx="5" fill="${teal}"/><rect x="290" y="150" width="34" height="15" rx="4" fill="white"/>`+tx(307,157,'吸收',11,teal);
    /* starch chain outside */
    const sx=i=>40+i*44+73*slide,sy=118,ss=.55;
    for(let i=0;i<3;i++){const x1=sx(i)+32*ss,x2=sx(i+1)-32*ss,ox=(x1+x2)/2,oy=sy+14;const op=1-d;
     s+=`<g opacity="${op}">`+bd(x1,sy,ox,oy,teal,2)+bd(ox,oy,x2,sy,teal,2)+oCircle(ox,oy,teal,.6)+'</g>';}
    const free=[[205,74],[232,152],[262,92],[262,118]];
    for(let i=0;i<4;i++){const [fx,fy]=free[i];let x=mix(sx(i),fx,ease(d)),y=mix(sy,fy,ease(d));
     if(i===3){x=mix(x,352,ease(e));y=mix(y,118,ease(e));}
     s+=pyr(x,y,{s:ss,c6:false,label:d>.5?'G':'',labelColor:i===3?orange:teal,stroke:i===3&&d>.5?orange:teal});}
    s+=tx(106,66,d<.5?'澱粉（大分子）':'澱粉已消化',14,d<.5?ink:muted);
    if(d>0)s+=blob(106,172,'消化酵素',{opacity:d,rx:40,ry:15})+arr(106,154,106,140,orange,2.5);
    if(d>.5)s+=tx(236,44,'葡萄糖（小分子）',13,teal);
    if(stuck)s+=cross(282,86,9)+tx(214,178,'大分子停在吸收前',13,orange);
    /* matter path inside */
    const lit=k=>rk>k;
    s+=bd(372,118,392,118,e>=1?teal:muted,2.5);
    for(let k=0;k<3;k++){const x=404+k*28;s+=dot(x,118,7,lit(k)?teal:'white',lit(k)?teal:muted);if(k<2)s+=bd(x+8,118,x+20,118,lit(k+1)?teal:muted,2.5);}
    s+=arr(470,118,500,118,rk>=3?teal:muted,2.5)+tx(560,118,'CO₂ ＋ H₂O',13,rk>=3?teal:muted)+tx(432,144,'多步反應',12,rk>0?teal:muted);
    /* energy path */
    const ec=atpLit?orange:muted;
    s+=arr(432,104,432,82,aL>0?orange:muted,2.5,aL>0?'':'4 4');
    if(aL>0&&aL<1)s+=dot(432,mix(106,84,aL),5,orange,'white');
    s+=pill(432,65,106,26,noATP?'沒有可利用 ATP':'ADP + Pi → ATP',12,{stroke:noATP?orange:(atpLit?orange:muted),color:noATP?orange:(atpLit?orange:muted),rx:8,dash:noATP?'5 4':''});
    s+=arr(486,65,546,65,wL>0?orange:muted,2.5,wL>0?'':'4 4');
    if(wL>0&&wL<1)s+=dot(mix(488,540,wL),65,5,orange,'white');
    if(noATP)s+=cross(516,65,8);
    s+=pill(592,65,84,26,noATP&&(scene===4?t>=6:t>=9)?'工作停下':'細胞工作',13,{fill:work?orange:'white',stroke:work?orange:(noATP?orange:muted),color:work?'white':(noATP?orange:muted),rx:8});
    if(legend)s+=bd(40,206,66,206,teal,4)+tx(72,206,'物質路徑',12,teal,'start')+bd(150,206,176,206,orange,4)+tx(182,206,'能量路徑（ATP）',12,orange,'start');
    html=wrap(s,'澱粉消化成葡萄糖，葡萄糖經運輸蛋白進入細胞；多步反應把部分能量轉到 ATP，ATP 再支持細胞工作');
    html+=values([['物質路徑',D?'澱粉 → 葡萄糖 → 多步反應':'澱粉停在消化前'],['能量路徑',A&&D&&t>=6?'部分能量 → ATP → 工作':'此步驟尚未提供能量']]);
    html+=formula('葡萄糖不是直接改名成 ATP');metrics={digestion:D,atp:A,step,work:D&&A&&work};break;
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
    /* Two glucose chains drawn as pyranose rings: starch (α, bridging O below the ring,
       every ring the same way up) and cellulose (β, bridging O in the plane, rings flipped
       alternately). An enzyme blob visits a linkage; a cut opens a gap at that bond. */
    const enzyme=advanced?c.enzyme:'amylase',acting=scene===2||scene===3,cutAlpha=acting&&enzyme==='amylase'&&t>=6,cutBeta=acting&&enzyme==='cellulase'&&t>=6;
    const X0=120,SP=100,N=5,starY=scene===4?50:62,celY=scene===4?190:168;
    const gchain=(y,beta,o={})=>{let s='';const cut=o.cut??-1,g=o.gap??0,hi=o.hi||[],col0=o.dim?muted:teal;
     const shift=i=>cut<0?0:(i<=cut?-6*g:14*g);
     for(let i=0;i<N-1;i++){const x1=X0+i*SP+32+shift(i),x2=X0+(i+1)*SP-32+shift(i+1),on=hi.includes(i),col=on?orange:col0,w=on?4:3,ox=(x1+x2)/2,oy=y+15;
      if(beta){s+=bd(x1,y,ox,y,col,w);if(!(cut===i&&g>0))s+=bd(ox,y,x2,y,col,w);s+=oCircle(ox,y,col);}
      else{s+=bd(x1,y,ox,oy,col,w);if(!(cut===i&&g>0))s+=bd(ox,oy,x2,y,col,w);s+=oCircle(ox,oy,col);}
      if(on&&o.tag)s+=tx(ox,beta?y-26:oy+17,o.tag,11,orange);
     }
     for(let i=0;i<N;i++)s+=pyr(X0+i*SP+shift(i),y,{flip:beta&&i%2===1,label:o.label,labelColor:o.labelColor,stroke:col0,c6:o.c6});
     return s;};
    const col=(y,lines,colors=[])=>lines.map((l,i)=>l?tx(612,y+(i-(lines.length-1)/2)*17,l,i===0?15:12,colors[i]||(i===0?ink:teal)):'').join('');
    const bondX=X0+2*SP+50,all=[0,1,2,3];
    let s='';
    if(scene===0){
     s+=gchain(starY,false,{label:'葡萄糖'})+gchain(celY,true,{label:'葡萄糖'})+col(starY,['澱粉'])+col(celY,['纖維素']);
    }else if(scene===1||scene===5){
     const hiA=t>=3,hiB=t>=6,same=t>=9;
     s+=gchain(starY,false,{label:'葡萄糖',labelColor:same?orange:teal,hi:hiA?all:[],tag:hiA&&t<6?'α':''})+gchain(celY,true,{label:'葡萄糖',labelColor:same?orange:teal,hi:hiB?all:[],tag:hiB&&t<9?'β':''});
     s+=col(starY,['澱粉',hiA?'α 連接':'',hiA?'O 在環下方':'',same?'單元相同':''],[ink,orange,teal,orange])+col(celY,['纖維素',hiB?'β 連接':'',hiB?'相鄰環翻轉':'',same?'連接不同':''],[ink,orange,teal,orange]);
    }else if(scene===2){
     const ex=t<3?mix(40,bondX,ease(t/2.5)):t<6?bondX:bondX,ey=t<3?mix(115,104,ease(t/2.5)):t<6?104:mix(104,134,ease((t-6)/.8));
     const found=t>=3.5&&t<4.5,g=clamp((t-4.5)/1),tryB=t>=7.5;
     s+=gchain(starY,false,{label:'葡萄糖',hi:t>=3.5?[2]:[],cut:2,gap:g,tag:g>=1?'已切開':''})+gchain(celY,true,{label:'葡萄糖',labelColor:t>=9?orange:teal,hi:tryB?[2]:[]});
     if(found)s+=ring(bondX,starY+15,13)+tx(bondX+40,starY+34,'＋H₂O',12,orange);
     if(tryB)s+=cross(bondX,celY,10);
     s+=blob(ex,ey,'澱粉酶');
     s+=col(starY,['澱粉',t>=3?'α 連接':'',g>=1?'酵素可切':''],[ink,teal,orange])+col(celY,['纖維素',t>=6?'β 連接':'',tryB?'此酵素不切':'',t>=9?'也是葡萄糖':''],[ink,teal,orange,orange]);
    }else if(scene===3){
     const amy=enzyme==='amylase',tgtY=amy?104:134,tgtRow=amy?starY:celY;
     const ex=t<3?40:mix(40,bondX,ease((t-3)/2)),ey=t<3?115:mix(115,tgtY,ease((t-3)/2));
     const found=t>=5&&t<6,g=clamp((t-6)/1.2),done=g>=1;
     s+=gchain(starY,false,{label:'葡萄糖',hi:amy&&t>=5?[2]:[],cut:amy?2:-1,gap:amy?g:0,tag:amy&&done?'已切開':''})+gchain(celY,true,{label:'葡萄糖',hi:!amy&&t>=5?[2]:[],cut:amy?-1:2,gap:amy?0:g,tag:!amy&&done?'已切開':''});
     if(found)s+=ring(bondX,amy?tgtRow+15:tgtRow,13);
     s+=blob(ex,ey,amy?'澱粉酶':'纖維素酶',{dash:!amy});
     if(!amy&&t<3)s+=tx(40,142,'（假設加入）',10.5,orange);
     s+=col(starY,['澱粉','α 連接',t>=9?(amy?'已切開':'此酵素不切'):''],[ink,teal,orange])+col(celY,['纖維素','β 連接',t>=9?(amy?'未切開':'已切開（假設）'):''],[ink,teal,orange]);
    }else if(scene===4){
     const bo=clamp((t-3)/1.5),ends=t>=6;
     s+=gchain(starY,false,{label:'葡萄糖'})+gchain(celY,false,{label:'葡萄糖',c6:true});
     /* glycogen branches on main-chain rings 1 and 3: C6 of the ring links up to C1 of a branch ring (α1→6) */
     for(const i of [1,3]){const cx=X0+i*SP,bx=cx-46,by=128,B=[cx-16,celY-17],O=[cx-18,152],D=[bx+32,by];
      s+=`<g opacity="${bo}">`+`<rect x="${B[0]-22}" y="${celY-44}" width="44" height="26" fill="white"/>`+bd(B[0],B[1]-2,O[0],O[1],orange,3)+bd(O[0],O[1],D[0],D[1],orange,3)+oCircle(O[0],O[1],orange)+pyr(bx,by,{label:'葡萄糖'})+tx(cx+24,152,'α(1→6)',11,orange)+'</g>';}
     if(ends){s+=ring(X0-32,starY,12)+ring(X0-32,celY,12)+ring(X0+100-46-32,128,12)+ring(X0+300-46-32,128,12);}
     s+=col(starY,['澱粉','直鏈 α(1→4)',ends?'端點：1':''],[t>=9?orange:ink,teal,orange])+col(celY,['肝醣','主鏈 α(1→4)',bo>0?'分支 α(1→6)':'',ends?'端點：3':''],[t>=9?orange:ink,teal,orange,orange]);
    }
    html=wrap(s,'兩條葡萄糖鏈：澱粉的 α 連接與纖維素的 β 連接，以及所選酵素的切鍵結果');
    if(scene===4)html+=values([['澱粉','直鏈 α(1→4)'],['肝醣','主鏈 α(1→4)＋分支 α(1→6)'],['鏈端點（示意）','澱粉 1；肝醣 3']]);
    else html+=values([['上：澱粉 α 鏈',cutAlpha?'已切開':'仍連接'],['下：纖維素 β 鏈',cutBeta?'假設加入適合酵素後切開':'此酵素未切開']]);
    html+=note('環是簡化的吡喃環；O 的位置表示 α／β，不是精確立體構型。');
    metrics={enzyme,alphaCut:cutAlpha,betaCut:cutBeta,unitsIdentical:true};break;
   }
   case 'membrane':{
    const mode=advanced?c.mode:'passive',outside=advanced?c.outside:8,inside=advanced?c.inside:2,atp=Boolean(c.atp);
    const direction=mode==='passive'?(outside>inside?'in':'out'):(atp?'out':'stop');
    let s='';
    if(scene===2){
     /* zoomed bilayer: hydrophilic heads face water on both sides, tails hide inside */
     const hiHead=t>=3&&t<6,hiTail=t>=6&&t<9,prot=clamp((t-9)/1);
     const water=[[60,36],[150,58],[250,30],[400,54],[520,34],[610,60],[90,206],[210,180],[330,208],[470,184],[580,210]];
     for(const [x,y] of water)s+=tx(x,y,'H₂O',12,teal);
     for(let i=0;i<16;i++){const x=40+i*40;if(prot>0&&Math.abs(x-330)<34)continue;
      for(const [y,sg] of [[86,1],[146,-1]]){const tc=hiTail?orange:'#d9a46a';
       s+=`<path d="M${x-5},${y+sg*12} q-6,${sg*10} 0,${sg*20} q6,${sg*8} 0,${sg*16}" fill="none" stroke="${tc}" stroke-width="3"/><path d="M${x+5},${y+sg*12} q6,${sg*10} 0,${sg*20} q-6,${sg*8} 0,${sg*16}" fill="none" stroke="${tc}" stroke-width="3"/>`;
       s+=`<circle cx="${x}" cy="${y}" r="13" fill="${pale}" stroke="${hiHead?orange:teal}" stroke-width="${hiHead?4:2.5}"/>`;}}
     if(prot>0)s+=`<g opacity="${prot}"><rect x="300" y="70" width="24" height="92" rx="8" fill="${pale}" stroke="${teal}" stroke-width="3"/><rect x="336" y="70" width="24" height="92" rx="8" fill="${pale}" stroke="${teal}" stroke-width="3"/></g>`;
     s+=tx(30,14,'膜外（水）',13,ink,'start')+tx(30,226,'膜內（水）',13,ink,'start');
     if(hiHead)s+=tx(330,14,'親水頭：兩面都朝向水',13,orange);
     else if(hiTail)s+=tx(330,14,'疏水尾：藏在兩層中間，避開水',13,orange);
     else if(prot>0)s+=tx(330,14,'膜蛋白：幫助物質過膜',13,orange);
     html=values([['膜外（示意濃度）',outside],['膜內（示意濃度）',inside],['此路徑',mode==='passive'?'被動淨運輸':atp?'ATP 幫浦':'沒有 ATP 的幫浦']])+wrap(s,'磷脂雙層：親水頭朝兩側的水，疏水尾在中間；膜蛋白可幫助運輸')+formula('親水頭 → 兩側的水；疏水尾 → 膜中間');
     metrics={outside,inside,mode,atp,direction};break;
    }
    const pumpOn=mode==='pump',chanOn=!pumpOn,hi=(scene===1||scene===3||scene===4)&&t<3;
    const op=on=>scene<=1||scene===5?1:(on?1:.3);
    /* bilayer */
    for(let i=0;i<28;i++){const x=30+i*22;if(Math.abs(x-215)<28||Math.abs(x-445)<44)continue;
     for(const [y,sg] of [[96,1],[134,-1]])s+=`<path d="M${x-3},${y+sg*7} q-5,${sg*8} 0,${sg*15}" fill="none" stroke="#d9a46a" stroke-width="2"/><path d="M${x+3},${y+sg*7} q5,${sg*8} 0,${sg*15}" fill="none" stroke="#d9a46a" stroke-width="2"/><circle cx="${x}" cy="${y}" r="7" fill="${pale}" stroke="${teal}" stroke-width="2"/>`;}
    /* proteins */
    s+=`<g opacity="${op(chanOn)}"><rect x="193" y="80" width="15" height="70" rx="6" fill="${pale}" stroke="${teal}" stroke-width="2.5"/><rect x="222" y="80" width="15" height="70" rx="6" fill="${pale}" stroke="${teal}" stroke-width="2.5"/>${tx(215,164,'被動通道',11,teal)}</g>`;
    const atpTxt=pumpOn&&!atp?'沒有 ATP':'ATP → ADP + Pi',atpCol=pumpOn?(atp?orange:muted):muted;
    s+=`<g opacity="${op(pumpOn)}"><rect x="410" y="76" width="70" height="78" rx="14" fill="${pale}" stroke="${teal}" stroke-width="3"/><rect x="439" y="76" width="12" height="78" fill="${paper}"/>${tx(445,168,'ATP 幫浦',11,teal)}</g>`;
    /* population dots */
    const outPos=[[70,46],[120,70],[160,34],[300,60],[345,34],[385,72],[545,40],[595,66]],inPos=[[80,186],[130,162],[170,206],[300,176],[350,200],[390,166],[560,190],[600,164]];
    outPos.slice(0,Math.min(8,outside)).forEach(([x,y])=>s+=dot(x,y,6));inPos.slice(0,Math.min(8,inside)).forEach(([x,y])=>s+=dot(x,y,6));
    const more=outside>inside?'out':'in';
    s+=tx(30,14,`膜外 ${outside} 個${more==='out'?'（多）':'（少）'}`,13,hi&&more==='out'?orange:ink,'start')+tx(30,222,`膜內 ${inside} 個${more==='in'?'（多）':'（少）'}`,13,hi&&more==='in'?orange:ink,'start');
    /* hero particle + arrows */
    const hero=(x,y)=>dot(x,y,8,orange,'white');
    let msg='',msgCol=orange;
    const chanMove=(q)=>{const y=direction==='in'?mix(40,196,ease(q)):mix(196,40,ease(q));s+=hero(215,y);if(q>0)s+=direction==='in'?arr(250,60,250,180,teal,3):arr(250,180,250,60,teal,3);};
    if(scene===0){s+=hero(215,56)+tx(215,30,'往哪裡？',12,orange);}
    else if(scene===1||scene===5){
     const q1=scene===5?1:clamp((t-3)/2.5),q2=scene===5?1:clamp((t-6)/2.5);
     chanMove(q1);
     if(t>=6){s+=hero(445,mix(196,40,ease(q2)))+arr(495,180,495,60,orange,3);}
     s+=tx(445,184,atpTxt,11,t>=6?orange:muted);
     if(t>=9||scene===5)msg='逆著梯度 → 需要 ATP 的能量';else if(t>=6)msg='ATP 幫浦：從少送到多';else if(t>=3)msg='被動：從多往少，不用能量';
    }else{
     const early=scene===4;
     if(chanOn){const q=clamp((t-3)/2.5);chanMove(q);if(t>=6)msg=`淨方向：${direction==='in'?'外 → 內':'內 → 外'}（沿梯度）`;if(t>=9&&early)msg='方向看梯度，不是固定往細胞內';}
     else{
      const st=early?3:6,q=atp?clamp((t-st)/2.5):0;
      s+=hero(445,mix(196,40,ease(q)));
      if(atp&&q>0)s+=arr(495,180,495,60,orange,3);
      s+=tx(445,184,atpTxt,11,atp?(t>=st?orange:muted):(t>=st?orange:muted));
      if(!atp&&t>=(early?6:9)){s+=cross(445,115,12)+tx(445,62,'停止',13,orange);msg='這個幫浦沒有 ATP：停止（被動路徑另計）';}
      else if(atp&&t>=st)msg='ATP 幫浦：逆梯度，從少送到多';
     }
    }
    if(msg)s+=tx(420,14,msg,12,msgCol);
    html=values([['膜外（示意濃度）',outside],['膜內（示意濃度）',inside],['此路徑',mode==='passive'?'被動淨運輸':atp?'ATP 幫浦':'沒有 ATP 的幫浦']])+wrap(s,'磷脂雙層膜、兩側的粒子濃度，以及所選路徑（被動通道或 ATP 幫浦）的粒子移動方向')+formula(direction==='in'?'淨方向：外 → 內':direction==='out'?'淨方向：內 → 外':'此幫浦停止（不代表所有路徑停止）');
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
    /* Citric acid cycle drawn as a ring of stations with carbon counts. An orange marker
       (the current molecule) travels the ring; CO₂ / NADH / FADH₂ / GTP tags light up as it passes. */
    const n=advanced?c.n:1,carbon=phase===0?4:phase===1?6:phase===2?5:4;
    const rad=a=>a*Math.PI/180;
    const events=[{a:-24,l:'NADH',k:'nadh'},{a:-10,l:'CO₂',k:'co2'},{a:33,l:'NADH',k:'nadh'},{a:47,l:'CO₂',k:'co2'},{a:100,l:'GTP',k:'gtp'},{a:160,l:'FADH₂',k:'fadh2'},{a:220,l:'NADH',k:'nadh'}];
    const stations=[{a:-120,l:'草醯乙酸 4C',w:88},{a:-45,l:'檸檬酸 6C',w:74},{a:10,l:'5C',w:38},{a:70,l:'4C',w:36},{a:130,l:'4C',w:36},{a:190,l:'4C',w:36}];
    const perLap={nadh:3,co2:2,gtp:1,fadh2:1};
    /* state: laps completed, current angle (deg from -90 start, null = not on ring), acetyl progress */
    let laps=0,ang=null,q=null,q2=null,oaaHi=false;
    const START=-90,END=240;
    if(scene===0){oaaHi=true;}
    else if(scene===1){if(t<3){q=clamp(t/2.5);oaaHi=true;}else if(t<6)ang=mix(START,-45,(t-3)/3);else if(t<9)ang=mix(-45,70,(t-6)/3);else{ang=mix(70,END,(t-9)/3);oaaHi=ang>=END-12;}}
    else if(scene===2){if(t<3){q=clamp(t/2.5);oaaHi=true;}else if(t<6)ang=mix(START,70,(t-3)/3);else if(t<9){ang=mix(70,END,(t-6)/3);oaaHi=ang>=END-12;}else{laps=1;oaaHi=true;q2=clamp((t-9)/2.5);}}
    else if(scene===3){if(t<9){ang=mix(START,END,t/9);}else if(n>=2){laps=1;ang=mix(START,END,(t-9)/3);}else{laps=1;oaaHi=true;}if(ang!==null&&ang>=END-12)oaaHi=true;}
    else if(scene===4){if(t>=3){const L=6/n,k=(t-3)/L;laps=Math.min(n,Math.floor(k));ang=laps>=n?null:mix(START,END,k-laps);if(laps>=n)oaaHi=true;}}
    else{laps=n;oaaHi=true;}
    const passed=a=>laps*1+(ang!==null&&ang>=a?1:0);
    const count=k=>events.filter(e=>e.k===k).reduce((s,e)=>s+passed(e.a),0);
    const carbonAt=a=>a<-12?'6C':a<47?'5C':'4C';
    const drawCycle=(cx,cy,rx,ry,f)=>{
     const pt=(a,ex=0)=>[cx+(rx+ex)*Math.cos(rad(a)),cy+(ry+ex)*Math.sin(rad(a))];
     let g=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${teal}" stroke-width="${4*f}"/>`;
     for(const a of [-80,-30,25,85,145,205]){const [x1,y1]=pt(a-2),[x2,y2]=pt(a+2);g+=arr(x1,y1,x2,y2,teal,3*f);}
     /* acetyl entry */
     const top=pt(START);g+=arr(cx,6,cx,top[1]-8,teal,2.5*f)+tx(cx+8,16,'乙醯 CoA 2C',11*f,teal,'start');
     for(const e of events){const n0=passed(e.a),on=n0>0,[x1,y1]=pt(e.a,3),[x2,y2]=pt(e.a,16),[lx,ly]=pt(e.a,24),cs=Math.cos(rad(e.a)),anchor=cs>.3?'start':cs<-.3?'end':'middle';
      const colr=on?(e.k==='co2'?orange:teal):muted;
      g+=arr(x1,y1,x2,y2,colr,2*f)+tx(lx+(anchor==='middle'?0:0),ly+(anchor==='middle'?(Math.sin(rad(e.a))>0?6:-6)*f:0),e.l,11*f,colr,anchor,on?';font-weight:700':';font-weight:400');}
     for(const st of stations){const [x,y]=pt(st.a,-19*f),hiS=st.a===-120&&oaaHi;g+=pill(x,y,st.w*f,22*f,st.l,12*f,{fill:hiS?'#fff3c4':'white',stroke:hiS?orange:teal,color:ink,rx:6*f});}
     if(q!==null){const y=mix(10,top[1]-10,ease(q));g+=dot(cx,y,13*f,orange,'white')+tx(cx,y,'2C',11*f,'white');}
     if(q2!==null){const y=mix(10,top[1]-10,ease(q2));g+=dot(cx,y,13*f,orange,'white')+tx(cx,y,'2C',11*f,'white')+tx(cx+8,34,'下一份',11*f,orange,'start');}
     if(ang!==null&&ang<END-12){const [x,y]=pt(ang);g+=dot(x,y,15*f,orange,'white')+tx(x,y,carbonAt(ang),12*f,'white');}
     return g;};
    const tally=(x,title,lit)=>{let g=tx(x,30,title,12,ink);const rows=[['NADH','nadh'],['FADH₂','fadh2'],['GTP','gtp'],['CO₂','co2']];
     rows.forEach(([l,k],i)=>{const v=count(k),y=58+i*26;g+=tx(x-60,y,l,13,v>0?(k==='co2'?orange:teal):muted,'start')+tx(x+62,y,String(v),15,v>0?ink:muted,'end');});return g;};
    let s='';
    if(scene===4){
     const f1=clamp(t/1),f2=clamp((t-1)/1),f3=clamp((t-2)/1);
     s+=pill(90,195,118,24,'葡萄糖 6C',13,{rx:7});
     if(f1>0)s+=`<g opacity="${f1}">${arr(90,182,90,134,teal,2.5)}${pill(90,121,118,24,'2 丙酮酸 3C',13,{rx:7})}</g>`;
     if(f2>0)s+=`<g opacity="${f2}">${arr(90,108,90,60,teal,2.5)}${pill(90,47,118,24,'2 乙醯 CoA 2C',13,{rx:7})}${tx(100,84,'丙酮酸氧化',11,t>=6?orange:muted,'start')}${tx(100,99,'（2 CO₂、2 NADH 另計）',10.5,t>=6?orange:muted,'start')}</g>`;
     if(f3>0)s+=`<g opacity="${f3}">${bd(150,47,350,47,teal,2.5)}${arr(350,47,350,54,teal,2.5)}</g>`;
     s+=drawCycle(350,125,95,68,.92);
     if(t>=3)s+=`<rect x="238" y="8" width="416" height="216" rx="12" fill="none" stroke="${orange}" stroke-width="2" stroke-dasharray="7 5"/>`;
     s+=tally(580,t>=3?`盤點範圍：TCA ${n} 圈`:`TCA ${n} 圈的產物`);
    }else{
     s+=drawCycle(300,122,120,78,1);
     s+=tally(580,scene===3?`${n} 份乙醯 CoA`:'本圈產物');
    }
    html=wrap(s,'4C 草醯乙酸接受 2C 乙醯基形成 6C 檸檬酸，放出兩個 CO₂ 回到 4C；沿途產生 NADH、FADH₂ 與 GTP')+formula('4C + 2C → 6C → 5C → 4C → 再生 4C');
    const show=k=>scene===3?(t>=9?perLap[k]*n:count(k)):scene===4?(t>=9?perLap[k]*n:count(k)):count(k);
    html+=values([['乙醯 CoA 份數／圈數',n],['TCA NADH',show('nadh')],['TCA FADH₂ / GTP',`${show('fadh2')} / ${show('gtp')}`],['TCA CO₂',show('co2')]])+note('只數總碳，不追蹤每一顆碳的來源。');
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
    /* Fatty acyl-CoA as a zigzag carbon chain. Each round the β carbon is marked, the
       C1–C2 unit (with S–CoA) breaks off and lands in the acetyl-CoA tray; the last 4C
       round yields two units. */
    const n=advanced?c.n:16,max=n/2-1;
    let r,f;
    if(scene===4){r=Math.min(max,round);f=t>=6||r>=max?0:t/6;}
    else{
     /* scene 1 follows its cues: ordinary rounds 0–6 s, the special last 4C round 6–9 s. Other scenes spread rounds evenly. */
     const R=scene===1?(t<6?t/6*(max-1):t<9?max-1+(t-6)/3:max):p*(max+1);
     r=Math.min(max,Math.floor(R));f=r<max?R-r:0;}
    const products=r>=max?n/2:r,remaining=n-products*2;
    const dx=n>=18?28:n>=16?30:44,x0=70,yc=142,zig=i=>yc+(i%2?9:-9);
    const m=remaining,last=m===4,q=clamp((f-.4)/.45),units=f>0?(last?2:1):0;
    const slot=k=>[262+k*38,42];
    let s=tx(30,42,'乙醯 CoA（每份 2C）：',13,ink,'start');
    for(let k=0;k<products;k++){const [x,y]=slot(k);s+=pill(x,y,32,20,'2C',12,{fill:orange,stroke:orange,color:'white'});}
    if(m===0)s+=tx(330,150,'碳鏈已用完：全部成為乙醯 CoA',15,teal);
    else{
     const inUnit=i=>units===2?i>=m-4:units===1?i>=m-2:false,unitIdx=i=>units===2&&i<m-2?1:0;
     const ux=[m-2,m-4].map(j=>(x0+j*dx+x0+(j+1)*dx)/2),uy=yc;
     const off=i=>{if(!inUnit(i)||q<=0)return [0,0];const k=unitIdx(i),[sx,sy]=slot(products+k);return [(sx-ux[k])*ease(q),(sy-uy)*ease(q)];};
     const gone=q>=1;
     for(let i=0;i<m-1;i++){if(gone&&inUnit(i))continue;const sameUnit=inUnit(i)&&inUnit(i+1)&&unitIdx(i)===unitIdx(i+1);if(inUnit(i+1)&&!sameUnit)continue;if(inUnit(i)&&!inUnit(i+1))continue;
      const [ox,oy]=off(i),scis=i===m-3&&f>0&&f<.4||(units===2&&i===m-5&&f>0&&f<.4);
      s+=bd(x0+i*dx+ox,zig(i)+oy,x0+(i+1)*dx+ox,zig(i+1)+oy,scis?orange:teal,scis?5:3);}
     for(let i=0;i<m;i++){if(gone&&inUnit(i))continue;const [ox,oy]=off(i),x=x0+i*dx+ox,y=zig(i)+oy,hot=inUnit(i)&&f>0||(f===0&&(last?i>=m-4:i>=m-2));
      s+=dot(x,y,9,hot?orange:pale,hot?orange:teal)+tx(x,y,'C',11,hot?'white':ink);
      if(i===m-1){s+=bd(x-3,y-11,x-3,y-22,ink,2)+bd(x+3,y-11,x+3,y-22,ink,2)+tx(x,y-30,'O',11,orange)+tx(x+13,y,'S–CoA',12,orange,'start');}
     }
     if(gone&&units>0){const e=m-2*units-1;if(e>=0){const x=x0+e*dx,y=zig(e);s+=bd(x-3,y-11,x-3,y-22,ink,2)+bd(x+3,y-11,x+3,y-22,ink,2)+tx(x,y-30,'O',11,orange)+tx(x+13,y,'S–CoA',12,orange,'start');}}
     for(let k=0;k<units;k++)if(gone){const [x,y]=slot(products+k);s+=pill(x,y,32,20,'2C',12,{fill:orange,stroke:orange,color:'white'});}
     if(f>0&&f<.4){const bI=last?m-3:m-3,x=x0+bI*dx;s+=ring(x,zig(bI),14)+tx(x,zig(bI)+28,'β 碳',12,orange)+tx(x0+(m-2)*dx,zig(m-2)+28,'α',12,teal);if(last)s+=tx(x0+(m-4)*dx-14,zig(m-4)+28,'兩份 2C',12,orange);}
     else if(f===0){const a=m-2,b=m-3;if(b>=0)s+=tx(x0+b*dx,zig(b)+28,'β',12,teal);if(a>=0)s+=tx(x0+a*dx,zig(a)+28,'α',12,teal);}
     s+=tx(x0-4,zig(0)-26,'ω 端',11,muted)+tx(60,196,`剩餘 ${m} 個碳`,13,teal,'start');
    }
    html=wrap(s,`脂醯 CoA 碳鏈剩餘 ${remaining} 個碳；每圈在 β 碳切下 2C 的乙醯 CoA`);
    html+=values([['起始碳鏈',`C${n}`],['已完成圈數',`${r} / ${max}`],['乙醯 CoA（每份 2C）',products],['剩餘碳',remaining]])+formula(`${remaining} + ${products}×2 = ${n} 個碳`)+note('最後 4C 的一圈得到兩份乙醯 CoA。');
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
