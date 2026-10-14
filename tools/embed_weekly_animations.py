#!/usr/bin/env python3
"""Idempotent lab integration. Build labs first; W09/W18 are not modified."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
LABS=json.loads((SITE/'assets/animations/learning-labs/manifest.json').read_text(encoding='utf-8'))
WEEKS=sorted(map(int,LABS))
def media(w,base):
    info=LABS[str(w)];path=f'{base}assets/animations/{info["simulation"]}'
    return f'''<div class="teaching-animation" data-week="w{w:02}">
<h3>W{w:02} 互動實驗：{info['title']}</h3><p>先預測，再觀察、解釋與應用。</p>
<iframe src="{path}" title="W{w:02} 六幕互動實驗室" style="width:100%;height:780px;border:1px solid #c5dce3;border-radius:12px"></iframe>
<p><a href="{path}" target="_blank" rel="noopener">另開實驗室 ↗</a></p></div>'''
for w in WEEKS:
    if w==2:continue
    p=SITE/f'vi-a2/w{w:02}.html';s=p.read_text(encoding='utf-8')
    path=f'../assets/animations/w{w:02}/simulation.html'
    replacement=f'''<section class="animation-slide learning-lab-slide" id="animation">
<iframe class="learning-frame" data-week="{w}" src="{path}" title="W{w:02} 六幕互動實驗室"></iframe>
<p class="learning-open"><a href="{path}" target="_blank" rel="noopener">另開實驗室 ↗</a> · <a href="#/learning-return">回本週課程 →</a></p>
<aside class="notes">每幕一個觀看任務。先預測，再觀察、解釋與應用；答錯可重試。模型範圍見實驗室說明。</aside></section>'''
    s,count=re.subn(r'<section class="animation-slide[^\"]*" id="animation">.*?</section>',lambda _:replacement,s,flags=re.S)
    assert count==1,f'{p}: expected one animation route'
    if 'learning-lab-route.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="../assets/learning-lab-route.css">\n</head>')
    if 'learning-lab-route.js' not in s:s=s.replace('</body>','<script src="../assets/learning-lab-route.js"></script>\n</body>')
    if 'scrollActivationWidth' not in s:s=s.replace('center:false,','center:false, scrollActivationWidth:null,')
    at=s.index('</section>',s.index('id="animation"'))+len('</section>');tail=s[at:]
    if 'id="learning-return"' not in tail:tail=re.sub(r'<section(?:\s[^>]*)?>',lambda m:m.group(0)[:-1]+' id="learning-return">',tail,count=1)
    p.write_text(s[:at]+tail,encoding='utf-8')
packages={w:media(w,'../../') for w in WEEKS}
js='''(() => {
 const packages = '''+json.dumps(packages,ensure_ascii=False)+''';
 const w = typeof WEEK !== 'undefined' ? WEEK.week : 0;
 if (!packages[w]) return;
 const host = document.querySelector('#keypoints'); if (!host) return;
 const section = document.createElement('section'); section.id='animation';
 section.innerHTML=packages[w]; host.before(section);
 const nav=document.querySelector('.nav .wrap');
 if(nav){const a=document.createElement('a');a.href='#animation';a.textContent='▶ 互動實驗';nav.prepend(a);}
})();
'''
(SITE/'assets/weekly-animation.js').write_text(js,encoding='utf-8')
page='''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>16 週生物化學互動實驗</title><link rel="stylesheet" href="assets/css/animations.css"><style>body{margin:0;background:#f4fafc;color:#193946;font-family:system-ui,sans-serif}main{max-width:960px;margin:auto;padding:20px}nav{display:flex;flex-wrap:wrap;gap:12px}article{background:white;padding:16px;margin:24px 0;border:1px solid #c5dce3;border-radius:12px}</style></head><body><main><a href="index.html">回課程首頁</a><h1>16 週互動實驗</h1><p>先預測，再觀察、解釋與應用。繁中短句＋英文／越南文關鍵詞。W09、W18 為考試週。</p><nav>'''
page+=''.join(f'<a href="#w{w:02}">W{w:02}</a>' for w in WEEKS)+'</nav>'
for w in WEEKS:page+=f'<article id="w{w:02}">{media(w,"")}<a href="vi-a2/w{w:02}.html#/animation">投影片</a> · <a href="vi-a2/lessons/w{w:02}.html#animation">互動課程</a></article>'
page+='</main></body></html>';(SITE/'animations.html').write_text(page,encoding='utf-8')
print(json.dumps({'interactive_weeks':WEEKS,'video_count':0,'gallery':'site/animations.html'}))
