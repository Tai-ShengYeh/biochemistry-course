#!/usr/bin/env python3
"""Regenerate shared MP4 packages: Pillow + ffmpeg + Windows Hanhan TTS.
Run from any directory. Python: Pillow/fonttools; Windows System.Speech required.
"""
from pathlib import Path
import sys, json, math, subprocess, wave, os
from functools import lru_cache
from PIL import Image,ImageDraw,ImageFont
from animation_content import CONTENT
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]; ASSETS=ROOT/'site/assets/animations'
W,H,FPS=960,540,12
FONT=os.environ.get('BIO_FONT','/mnt/c/Windows/Fonts/msjh.ttc')
BLUE='#267e96'; RED='#ce6045'; INK='#193946'
@lru_cache(maxsize=32)
def font(n): return ImageFont.truetype(FONT,n)
LATIN=os.environ.get('BIO_LATIN_FONT','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
CJK_CMAP=TTFont(FONT,fontNumber=0).getBestCmap()
LATIN_CMAP=TTFont(LATIN).getBestCmap()
@lru_cache(maxsize=32)
def latin_font(n):return ImageFont.truetype(LATIN,n)
@lru_cache(maxsize=1024)
def text_runs(s,n):
 runs=[]
 for char in s:
  face=font(n) if ord(char)>=0x2E80 and ord(char) in CJK_CMAP else latin_font(n)
  assert ord(char) in CJK_CMAP or ord(char) in LATIN_CMAP or char.isspace(),char
  if runs and runs[-1][0] is face:runs[-1]=(face,runs[-1][1]+char)
  else:runs.append((face,char))
 return runs
def text(d,x,y,s,n=24,c=INK):
 runs=text_runs(s,n);start=x-sum(f.getlength(t) for f,t in runs)/2
 for f,t in runs:d.text((start,y),t,font=f,fill=c,anchor='lm');start+=f.getlength(t)
@lru_cache(maxsize=256)
def wrap(s,n=25,width=870):
 lines=['']
 for c in s:
  if font(n).getlength(lines[-1]+c)>width: lines.append('')
  lines[-1]+=c
 return '\n'.join(lines)
def ball(d,x,y,label='',color=BLUE,r=22):
 d.ellipse((x-r,y-r,x+r,y+r),fill=color);text(d,x,y,label,19,'white')
def arrow(d,a,b,c=BLUE):
 d.line((a,b),fill=c,width=4); ang=math.atan2(b[1]-a[1],b[0]-a[0]);d.polygon([b,(b[0]-14*math.cos(ang-.5),b[1]-14*math.sin(ang-.5)),(b[0]-14*math.cos(ang+.5),b[1]-14*math.sin(ang+.5))],fill=c)
def diagram(d,w,s,p,t):
 # Each family changes geometry/particles continuously, not merely card text.
 if w in (1,13):
  d.ellipse((430,180,900,380),outline=BLUE,width=4);text(d,680,190,'細胞質' if w==13 else '細胞',24)
  if w==1:
   for i,label in enumerate(['澱粉','葡萄糖','ATP','做事']):text(d,125+i*225,400,label)
   for i in range(6):
    x=70+((t*55+i*110)%800); label='澱粉' if x<250 else ('G' if x<520 else ('ATP' if x<760 else '工作'));ball(d,x,290+15*math.sin(t+i),label,BLUE,24)
   text(d,480,150,'消化後吸收，再進入細胞',26)
  else:
   x=180+min(p*2,1)*230; ball(d,x,275,'6C',RED,32)
   if p>.35:
    for y in (245,340):arrow(d,(440,280),(650,y));ball(d,650+80*math.sin(p*math.pi),y,'3C')
   text(d,480,155,'1 葡萄糖 → 2 丙酮酸',26);text(d,480,408,'花 2 ATP；得 4 ATP；淨 2 ATP + 2 NADH',24)
 elif w==3:
  a=280+100*p;b=680-100*p
  for x in (a,b):ball(d,x,275,'C',BLUE,32);text(d,x,220,'R');text(d,x,335,'H')
  text(d,a-90,275,'NH3+',22);text(d,b+90,275,'COO-',22)
  d.line((a+32,275,b-32,275),fill=RED,width=5);text(d,480,240,'CO — NH',26);ball(d,480+100*p,340+20*p,'H2O',RED,27)
  text(d,480,155,'N 端 → 胜肽鍵 → C 端',26);text(d,480,418,'縮合示意；細胞合成需要額外步驟',23)
 elif w==4:
  f=(s+p)/5; f=math.sin(f*math.pi)
  pts=[]
  for i in range(24):
   a=i*.8; radius=.45 if i%3==0 else 1; pts.append((150+i*28*(1-f)+f*170*radius*math.cos(a)+f*330,280+f*90*radius*math.sin(a)))
  d.line(pts,fill=BLUE,width=5)
  for i,(x,y) in enumerate(pts):ball(d,x,y,'',RED if i%3==0 else BLUE,9)
  text(d,480,155,'同一條鏈：順序不變，形狀改變',26);text(d,480,418,'紅色：疏水部分的簡化示意',23)
 elif w==5:
  for i in range(4):
   x=390+(i%2)*180;y=235+(i//2)*110;ball(d,x,y,'Fe',RED,47)
   a=t*1.4+i; bound=1-p if s==4 else (max(0,min(1,p*4-i)) if s in (2,3) else p); ox=x+25+90*math.cos(a)*(1-bound);oy=max(190,min(385,y+25+90*math.sin(a)*(1-bound)));ball(d,ox,oy,'O2',BLUE,19)
  text(d,480,155,'四條鏈，四個血基質結合位置',26);text(d,480,418,'協同性：結合後，其他位置較容易抓氧',24)
 elif w==6:
  for amp,c in ((140,RED),(65,BLUE)):
   pts=[(140+i*6,350-amp*math.sin(i/100*math.pi)-i*.5) for i in range(101)];d.line(pts,fill=c,width=4)
   q=int(p*100);ball(d,*pts[q],'',c,10)
  text(d,480,155,'活化能降低；起點與終點不變',26);text(d,480,418,'紅：無酵素　藍：有酵素　橫軸：反應進程',22)
 elif w==7:
  arrow(d,(160,380),(850,380));arrow(d,(160,380),(160,180))
  for km,v,c in ((110,170,BLUE),(240,170,RED),(110,105,'#8a65a9')):
   pts=[(160+x,380-v*x/(km+x)) for x in range(0,651,5)];d.line(pts,fill=c,width=4)
  x=650*p;ball(d,160+x,380-170*x/(110+x),'',BLUE,10)
  d.line((160,295,270,295,270,380),fill='#7c919a',width=2);text(d,270,400,'Km',19);text(d,100,295,'½ Vmax',18)
  text(d,500,155,'藍：正常　紅：競爭　紫：純非競爭',23);text(d,500,417,'橫軸：受質濃度；縱軸：反應速率',24)
 elif w==8:
  for row in range(2):
   pts=[(160+i*100,245+row*110+ (20*math.sin(t+i) if row==0 else (-1)**i*5)) for i in range(7)]
   d.line(pts,fill=BLUE,width=5)
   for x,y in pts:ball(d,x,y,'G',RED if row else BLUE,23)
  text(d,480,155,'葡萄糖單元：連接方式不同',26);text(d,870,245,'澱粉',23);text(d,870,355,'纖維素',23);text(d,480,418,'示意圖，不是精確原子模型',23)
 elif w in (10,15):
  for i in range(15):
   x=90+i*55+4*math.sin(t+i)
   for y,sgn in ((235,1),(335,-1)):
    ball(d,x,y,'',BLUE,11);d.line((x-4,y+sgn*12,x-8,y+sgn*38),fill=RED,width=3);d.line((x+4,y+sgn*12,x+8,y+sgn*38),fill=RED,width=3)
  d.rounded_rectangle((650,215,725,355),12,fill='#afcfbb');text(d,790,286,'通道' if w==10 else 'ATP 合成酶',19)
  for i in range(5):ball(d,685,175+((t*35+i*45)%230),'H+' if w==15 else 'X',RED,15)
  if w==15:
   text(d,120,370,'基質',18);text(d,120,200,'膜間隙',18)
   for x,label in [(210,'I'),(330,'II'),(450,'III'),(560,'IV')]:
    d.rounded_rectangle((x-25,235,x+25,335),8,fill='#c8dde7',outline=BLUE,width=2);text(d,x,285,label,21)
   for x in (210,450,560):ball(d,x,340-((t*30)%150),'H+',RED,15)
   arrow(d,(190,380),(600,380));ball(d,190+(t*45%410),380,'e-',BLUE,15);text(d,600,395,'O2 → H2O',18)
  text(d,450,155,'親水頭向外；疏水尾向內' if w==10 else '膜間隙：H+ 多；基質：H+ 少',24)
  text(d,450,415,'膜蛋白協助運輸；圖是簡化示意' if w==10 else 'H+ 流回基質，帶動 ADP + Pi → ATP',23)
 elif w==11:
  for i in range(6):
   y=195+i*35;shift=25*math.sin(t*.6+i*.7);a=330+shift;b=630-shift
   ball(d,a,y,'A' if i%2 else 'G',BLUE,14);ball(d,b,y,'T' if i%2 else 'C',RED,14)
   for j in range(2 if i%2 else 3):d.line((a+20,y+j*5-5,b-20,y+j*5-5),fill='#94aeb6',width=2)
  arrow(d,(260,195),(260,380));arrow(d,(700,380),(700,195));text(d,260,175,"5'",20);text(d,700,175,"3'",20)
  text(d,480,145,'A — T；G — C；兩股反平行',25);text(d,480,419,'短線表示氫鍵，不是主鏈的共價鍵',23)
 elif w==12:
  arrow(d,(220,210),(680,355));arrow(d,(220,360),(680,210),RED)
  ball(d,220+460*p,210+145*p,'ATP',BLUE,28);ball(d,220+460*p,360-150*p,'反應',RED,28)
  text(d,480,155,'ATP 水解 + 吸能反應：耦合',26);text(d,480,418,'總 ΔG < 0 才有利；不是單純斷鍵就放能',24)
 elif w==14:
  pts=[(480+145*math.cos(i*2*math.pi/60),285+95*math.sin(i*2*math.pi/60)) for i in range(61)];d.line(pts,fill=BLUE,width=5)
  a=t*.7;ball(d,480+145*math.cos(a),285+95*math.sin(a),'',RED,12)
  for x,y,l in ((480,185,'檸檬酸 6C'),(480,390,'草醯乙酸 4C'),(770,280,'3 NADH'),(190,280,'2 CO2')):text(d,x,y,l,23)
  arrow(d,(760,195),(590,220));text(d,800,170,'乙醯基 2C',22);text(d,480,440,'每圈：1 FADH2 + 1 GTP；草醯乙酸再生',23)
 elif w==16:
  phase=(s+p)/5*8;step=min(7,int(phase)); n=0 if step==7 else 16-2*step; local=phase-int(phase)
  for i in range(n):ball(d,140+i*37+(40*local if i>=n-2 else 0),240+(80*local if i>=n-2 else 0),'C',BLUE,14)
  for i in range((16-n)//2):
   x=170+i*95;ball(d,x,340,'2C',RED,22)
  text(d,480,155,'C16 → 7 圈 → 8 乙醯 CoA',26);text(d,480,416,'最後的 4C，分成兩個 2C；氮由尿素循環處理',23)
 elif w==17:
  labels=['腸道','肝臟','肌肉','脂肪','腦'];xy=[(120,280),(350,280),(600,200),(600,365),(830,280)]
  for (x,y),l in zip(xy,labels):d.rounded_rectangle((x-55,y-35,x+55,y+35),12,outline=BLUE,width=3);text(d,x,y,l,25)
  edges=[(0,1),(1,2),(1,3),(1,4)] if s<2 else [(1,4),(3,2)]
  for a,b in edges:
   x,y=xy[a];xx,yy=xy[b];arrow(d,(x+55,y),(xx-55,yy));ball(d,x+(xx-x)*p,y+(yy-y)*p,'',RED,8)
  text(d,480,145,'吃飽：使用、儲存' if s<2 else '空腹：動員、維持血糖',26);text(d,480,425,'燃料流向示意；不是所有激素作用的完整圖',23)
def frame(data,i,p,t,caption):
 im=Image.new('RGB',(W,H),'#f4fafc');d=ImageDraw.Draw(im)
 text(d,480,28,f"生物化學 {data['week']} · 中文 A2",22,BLUE);text(d,480,75,data['title'],29)
 text(d,480,115,data['key_terms'][i%len(data['key_terms'])].replace('|',' / '),18,BLUE)
 diagram(d,int(data['week'][1:]),i,p,t)
 d.rounded_rectangle((25,455,935,530),12,fill='white',outline='#c5dce3',width=2)
 d.multiline_text((480,492),wrap(caption),font=font(25),fill=INK,anchor='mm',align='center',spacing=4)
 return im
def stamp(t,sep=','):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}{sep}{n%1000:03}'
def render(w):
 title,terms,speech=CONTENT[w];slug=f'w{w:02}';out=ASSETS/slug;out.mkdir(parents=True,exist_ok=True);cache=out/'.render-cache';cache.mkdir(exist_ok=True)
 data={'week':slug.upper(),'title':title,'key_terms':terms,'sources':[f'vi-a2/{slug}.html',f'vi-a2/lessons/{slug}.html'],'simplification':'概念示意，非分子尺度模擬','scenes':[{'speech':s} for s in speech]}
 (out/'storyboard.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 ps=ASSETS/'make_narration.ps1';p=subprocess.check_output(['wslpath','-w',str(ps)],text=True).strip();folder=subprocess.check_output(['wslpath','-w',str(out)],text=True).strip()
 subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',p,'-Folder',folder],check=True,capture_output=True)
 durations=[]
 with wave.open(str(cache/'speech-000.wav'),'rb') as f: params=f.getparams()
 with wave.open(str(cache/'narration.wav'),'wb') as f:
  f.setparams(params)
  for i in range(len(speech)):
   with wave.open(str(cache/f'speech-{i:03}.wav'),'rb') as a:durations.append(a.getnframes()/a.getframerate());f.writeframes(a.readframes(a.getnframes()))
 cues=[];start=0
 for s,dur in zip(speech,durations):cues.append({'start':start,'end':start+dur,'text':s});start+=dur
 total=math.ceil((start+2)*FPS)/FPS;data['timing']={'speech_seconds':start,'video_seconds':total,'cues':cues}
 (out/'storyboard.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 for ext,sep in [('srt',','),('vtt','.')]:
  lines=['WEBVTT',''] if ext=='vtt' else []
  for i,c in enumerate(cues,1):lines += [str(i),stamp(c['start'],sep)+' --> '+stamp(c['end'],sep),wrap(c['text']),'']
  (out/f'{slug}_animation.{ext}').write_text('\n'.join(lines)+'\n')
 frame(data,0,.5,1,speech[0]).save(out/'poster.jpg',quality=88)
 command=['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(cache/'narration.wav'),'-af','apad','-t',str(total),'-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','80k','-movflags','+faststart',str(out/f'{slug}_animation.mp4')]
 proc=subprocess.Popen(command,stdin=subprocess.PIPE)
 try:
  i=0
  for f in range(round(total*FPS)):
   t=f/FPS
   while i<len(cues)-1 and t>=cues[i]['end']:i+=1
   c=cues[i];p=min(1,max(0,(t-c['start'])/(c['end']-c['start'])))
   proc.stdin.write(frame(data,i,p,t,c['text']).tobytes())
 finally:proc.stdin.close()
 assert proc.wait()==0;print(slug,total,flush=True)
 return {'week':slug,'duration':total,'path':str(out.relative_to(ROOT))}
if __name__=='__main__':
 results=[]
 for w in (list(map(int,sys.argv[1:])) if len(sys.argv)>1 else CONTENT):
  results.append(render(w));(ASSETS/'render-results.json').write_text(json.dumps(results,indent=2)+'\n')
