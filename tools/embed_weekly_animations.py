#!/usr/bin/env python3
"""Idempotently embed the 16 existing teaching weeks; never edit exam pages."""
from pathlib import Path
import re,json
from animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
TEACHING_WEEKS=sorted([*CONTENT,2]) # W02 is the shared interactive lab, not an MP4.
def media(w,base):
 if w==2:
  path=f'{base}assets/animations/w02/simulation.html'
  return f'''<div class="teaching-animation" data-week="w02">
<h3>W02 緩衝液互動實驗室</h3>
<p>先預測，再觀察、解釋與應用。六幕互動，緩衝有容量。</p>
<iframe src="{path}" title="緩衝液實驗室：六幕互動模擬" style="width:100%;height:780px;border:1px solid #c5dce3;border-radius:12px"></iframe>
<p><a href="{path}" target="_blank" rel="noopener">另開實驗室 ↗</a></p>
</div>'''
 slug=f'w{w:02}';title,terms,_=CONTENT[w];path=f'{base}assets/animations/{slug}'
 return f'''<div class="teaching-animation" data-week="{slug}">
<h3>{slug.upper()} 教學動畫：{title}</h3>
<video controls playsinline preload="metadata" poster="{path}/poster.jpg" aria-label="{title}">
<source src="{path}/{slug}_animation.mp4" type="video/mp4">
<track kind="subtitles" src="{path}/{slug}_animation.vtt" srclang="zh-Hant" label="繁體中文（完整旁白）">
您的瀏覽器不支援影片，請下載 MP4。</video>
<p class="animation-terms">{' · '.join(t.replace('|',' / ') for t in terms)}</p>
<p class="animation-note">先看分子怎麼移動，再用一句話說明原因。概念示意，不是精確分子模擬。<br>字幕已燒錄；可選完整旁白字幕。／ Xem chuyển động, rồi giải thích bằng một câu.</p>
<p class="animation-links"><a href="{path}/{slug}_animation.mp4" download>MP4</a> · <a href="{path}/{slug}_animation.srt" download>SRT 完整字幕</a> · <a href="{path}/{slug}_animation.vtt" download>VTT</a></p>
</div>'''
css='''/* Shared accessible video layout; no global lesson styles. */
.teaching-animation{max-width:960px;margin:1rem auto;color:#193946;font-family:"Microsoft JhengHei",system-ui,sans-serif}
.teaching-animation h3{font-size:1.1rem;margin:.35rem 0}
.teaching-animation video{display:block;width:100%;max-width:100%;height:auto;aspect-ratio:16/9;background:#f4fafc;border-radius:10px}
.teaching-animation p{font-size:.9rem;line-height:1.5;margin:.4rem 0;overflow-wrap:anywhere}
.teaching-animation a{color:#216d81}
.reveal .animation-slide .teaching-animation{max-width:880px;margin:0 auto}
.reveal .animation-slide .teaching-animation h3{font-size:27px;margin:12px 0}
.reveal .animation-slide .teaching-animation video{max-height:470px;object-fit:contain}
.reveal .animation-slide .teaching-animation p{font-size:18px;margin:7px 0}
@media(max-width:600px){.teaching-animation h3{font-size:1rem}.teaching-animation p{font-size:.85rem}}
'''
(SITE/'assets/css/animations.css').write_text(css)
# Desktop/media keyboard actions must not flip slides; pause off-screen slides.
js='''(() => {
 document.querySelectorAll('.teaching-animation video').forEach(video => {
  ['keydown','click','pointerdown'].forEach(type => video.addEventListener(type, e => e.stopPropagation()));
 });
 if (window.Reveal) Reveal.on('slidechanged', event => {
  document.querySelectorAll('.teaching-animation video').forEach(v => {if (!event.currentSlide.contains(v)) v.pause();});
 });
})();
'''
(SITE/'assets/animation-controls.js').write_text(js)
for w in TEACHING_WEEKS:
 slug=f'w{w:02}'
 p=SITE/f'vi-a2/{slug}.html';s=p.read_text()
 if 'animation-slide' not in s:
  s=s.replace('</head>','<link rel="stylesheet" href="../assets/css/animations.css">\n</head>')
  # After the initial objectives/vocabulary, before the first substantive diagram.
  sections=list(re.finditer(r'</section>',s));at=sections[2].end()
  s=s[:at]+f'\n<section class="animation-slide" id="animation">{media(w,"../")}</section>\n'+s[at:]
  s=s.replace('</body>','<script src="../assets/animation-controls.js"></script>\n</body>');p.write_text(s)
 p=SITE/f'vi-a2/lessons/{slug}.html';s=p.read_text()
 if 'weekly-animation.js' not in s:
  s=s.replace('</head>','<link rel="stylesheet" href="../../assets/css/animations.css"></head>')
  s=s.replace("<script src='bio_engine.js'></script>","<script src='bio_engine.js'></script>\n<script src='../../assets/weekly-animation.js'></script>")
  p.write_text(s)
html={w:media(w,'../../') for w in TEACHING_WEEKS}
(SITE/'assets/weekly-animation.js').write_text('''(() => {
 const packages = '''+json.dumps(html,ensure_ascii=False)+''';
 const w = typeof WEEK !== 'undefined' ? WEEK.week : 0;
 if (!packages[w]) return;
 const host = document.querySelector('#keypoints');
 if (!host) return;
 const section = document.createElement('section'); section.id='animation';
 section.innerHTML=packages[w]; host.before(section);
 const nav=document.querySelector('.nav .wrap');
 if(nav){const a=document.createElement('a');a.href='#animation';a.textContent='▶ 教學動畫';nav.prepend(a);}
 section.querySelector('video')?.addEventListener('keydown',e=>e.stopPropagation());
})();
''')
page='''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>16 週生物化學教學動畫</title><link rel="stylesheet" href="assets/css/animations.css"><style>body{margin:0;background:#f4fafc;color:#193946;font-family:system-ui,sans-serif}main{max-width:960px;margin:auto;padding:20px}nav{display:flex;flex-wrap:wrap;gap:12px}article{background:white;padding:16px;margin:24px 0;border:1px solid #c5dce3;border-radius:12px}</style></head><body><main><a href="index.html">回課程首頁</a><h1>16 週教學動畫</h1><p>W02 為六幕互動實驗；其他週為中文 A2 旁白影片。中文／English／Tiếng Việt 關鍵詞。W09 期中考與 W18 期末考不製作動畫。</p><nav>'''
page+=''.join(f'<a href="#w{w:02}">W{w:02}</a>' for w in TEACHING_WEEKS)+'</nav>'
for w in TEACHING_WEEKS:page+=f'<article id="w{w:02}">{media(w,"")}<a href="vi-a2/w{w:02}.html#/animation">投影片</a> · <a href="vi-a2/lessons/w{w:02}.html#animation">互動課程</a></article>'
page+='</main></body></html>';(SITE/'animations.html').write_text(page)
for name,base in [('index.html',''),('vi-a2/lessons/index.html','../../')]:
 p=SITE/name;s=p.read_text()
 if 'animations.html' not in s:s=s.replace('<body>',f'<body>\n<p style="text-align:center;padding:12px"><a href="{base}animations.html">▶ 16 週教學動畫總覽／Video bài học</a></p>',1);p.write_text(s)
print(json.dumps({'weeks':TEACHING_WEEKS,'slide_pages':len(TEACHING_WEEKS),'interactive_pages':len(TEACHING_WEEKS),'video_weeks':list(CONTENT),'gallery':'site/animations.html'}))
