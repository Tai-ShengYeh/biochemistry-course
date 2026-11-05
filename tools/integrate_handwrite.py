"""Publish the already-validated W01–W08 handwriting lessons and course entry points.

python tools/integrate_handwrite.py --source-root <folder containing both lesson packages>
Rerun after embedding/exporting the weekly labs. Never copies synthesis cache or skill sources.
"""
import argparse,hashlib,html,json,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site';OUT=SITE/'handwrite'
TITLES={1:'細胞與生物分子',2:'水、pH 與緩衝溶液',3:'胺基酸與胜肽',4:'蛋白質三維結構',5:'肌紅蛋白與血紅蛋白',6:'酵素的催化作用',7:'酵素動力學與調節',8:'碳水化合物'}
STYLE='''*{box-sizing:border-box}body{margin:0;background:#f5f2e8;color:#213b49;font:17px/1.7 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:35px 20px}h1{font-size:clamp(30px,5vw,48px);line-height:1.35}nav{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}nav a{border:1px solid #507a75;padding:8px 16px;border-radius:9px;text-decoration:none}a{color:#245f58}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}.card{display:block;background:#fffef9;color:inherit;text-decoration:none;padding:24px;border:1px solid #dbd8c9;border-radius:15px;box-shadow:0 6px 0 #e5dfcd}.card span{font-weight:800;color:#2b7369}.card h2{font-size:23px;line-height:1.4}.card p{font-size:15px}a:focus-visible{outline:3px solid #e1a735}aside{padding:18px;background:#e6f0eb;border-left:5px solid #2b7369;margin:28px 0}footer{font-size:15px;color:#50636b}'''

def page(title,body,nav):
    return f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}｜手寫教學</title><style>{STYLE}</style><main><small>Hóa sinh · 手寫動畫課堂</small><h1>{html.escape(title)}</h1><p>中文女聲＋越南語關鍵詞。先看圖、作答，再說出理由。遇到題目停頓，想好後按「繼續」。</p><nav>{nav}</nav>{body}<footer><p>可暫停、拖曳、切換幕次與調速。手機建議橫放。</p><p><a href="notes/w01-w02.md">第 1–2 週來源與教學備註</a> · <a href="notes/w03-w08.md">第 3–8 週來源與教學備註</a></p></footer></main></html>'

def marked(content,name,new):
    """Replace only the integration's own marked block, keeping host content."""
    pat=rf'<!-- handwrite:{name}:start -->.*?<!-- handwrite:{name}:end -->'
    return re.sub(pat+r'(?:\r?\n)?','',content,flags=re.S),f'<!-- handwrite:{name}:start -->{new}<!-- handwrite:{name}:end -->'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--source-root',type=Path,required=True);args=parser.parse_args()
    records=[];provenance=[]
    for package in ['biochemistry-w01-w02','biochemistry-w03-w08']:
        source=args.source_root/package
        rows=json.loads((source/'course-manifest.json').read_text(encoding='utf-8'))
        assert all(r['audio'] for r in rows)
        for row in rows:
            original=source/row['id'];dest=OUT/row['id'];dest.mkdir(parents=True,exist_ok=True)
            layout=json.loads((original/'layout.json').read_text(encoding='utf-8'))
            assert len(layout['voices'])==row['scenes']
            files=[original/n for n in ['player.html','index.html','lesson.json','lesson-notes.md','layout.json']]
            files += [f for f in (original/'assets').rglob('*') if f.is_file() and not f.name.endswith('.raw.mp3')]
            for file in files:
                relative=file.relative_to(original);target=dest/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,target)
            records.append(row)
            provenance.append({'chapter':row['id'],'source_package':package,'lesson_sha256':hashlib.sha256((original/'lesson.json').read_bytes()).hexdigest()})
        notes=OUT/'notes';notes.mkdir(parents=True,exist_ok=True)
        tag='w01-w02' if 'w01' in package else 'w03-w08'
        shutil.copy2(source/'teacher-notes.md',notes/(tag+'.md'))
        if (source/'source-map.md').exists():shutil.copy2(source/'source-map.md',notes/(tag+'-source-map.md'))
        licenses=OUT/'licenses';shutil.copytree(source/'licenses',licenses,dirs_exist_ok=True)
    records.sort(key=lambda r:r['id']);assert len(records)==32
    (OUT/'course-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    for i,row in enumerate(records):
        path=OUT/row['id']/'player.html';content=path.read_text(encoding='utf-8');w=row['week']
        links=[f'<a href="../w{w:02}.html">← 第 {w} 週動畫目錄</a>',f'<a href="../../vi-a2/w{w:02}.html#/handwrite">回本週投影片</a>',f'<a href="../../vi-a2/lessons/w{w:02}.html">互動講義</a>']
        if i:links.append(f'<a href="../{records[i-1]["id"]}/player.html">上一章</a>')
        if i+1<len(records):links.append(f'<a href="../{records[i+1]["id"]}/player.html">下一章 →</a>')
        links.append(f'<a href="../../assets/animations/w{w:02}/simulation.html">動手驗證 ↗</a>')
        nav='<nav id="course-nav" style="display:flex;gap:18px;flex-wrap:wrap;font:16px system-ui">'+''.join(links)+'</nav>'
        content=re.sub(r'<nav id="course-nav".*?</nav>',nav,content,count=1,flags=re.S)
        content=content.replace('無法讀取動畫。若瀏覽器限制本機檔案，請在專案資料夾執行 python -m http.server 8000，再開啟 http://localhost:8000/player.html','動畫暫時無法載入，請重新整理，或回本週動畫目錄重試。')
        path.write_text(content,encoding='utf-8')
    week_links='<a href="index.html">動畫總覽</a>'+''.join(f'<a href="w{w:02}.html">第 {w} 週</a>' for w in TITLES)
    total=sum(r['minutes'] for r in records);scenes=sum(r['scenes'] for r in records);pauses=sum(r['pauses'] for r in records)
    cards=''
    for w,title in TITLES.items():
        rows=[r for r in records if r['week']==w];mins=sum(r['minutes'] for r in rows)
        cards+=f'<a class="card week" href="w{w:02}.html"><span>W{w:02}</span><h2>{title}</h2><p>4 章 · {sum(r["scenes"] for r in rows)} 幕 · 約 {mins:.1f} 分鐘</p><b>選擇章節 →</b></a>'
        chapters=''.join(f'<a class="card chapter" href="{r["id"]}/player.html"><span>第 {i+1} 章</span><h2>{html.escape(r["title"])}</h2><p>{r["scenes"]} 幕 · {r["minutes"]:.1f} 分鐘 · {r["pauses"]} 個作答點</p><b>播放手寫動畫 →</b></a>' for i,r in enumerate(rows))
        body=f'<p><b>4 章 · 約 {mins:.1f} 分鐘</b>，另加自己的思考時間。</p><section class="grid">{chapters}</section><aside><b>看完，再換條件試試。</b><nav><a href="../assets/animations/w{w:02}/simulation.html">本週互動實驗</a><a href="../vi-a2/w{w:02}.html#/handwrite">回投影片</a><a href="../vi-a2/lessons/w{w:02}.html">互動講義</a></nav></aside>'
        (OUT/f'w{w:02}.html').write_text(page(f'第 {w} 週：{title}',body,week_links),encoding='utf-8')
        # Append a stable named Reveal route; existing numeric slide order remains.
        path=SITE/f'vi-a2/w{w:02}.html';content=path.read_text(encoding='utf-8')
        content,block=marked(content,'slide',f'<section id="handwrite"><div class="hd"><h2>手寫動畫：{title}</h2><p class="vi">Bài giảng viết tay</p></div><p style="font-size:.85em">先選一章；遇到題目想好後，再按「繼續」。</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'+''.join(f'<a class="handwrite-chapter" href="../handwrite/{r["id"]}/player.html" target="_blank" rel="noopener" style="font-size:1em;line-height:1.5;padding:16px;border:2px solid #2e7d8a;border-radius:10px">{i+1}．{html.escape(r["title"])}</a>' for i,r in enumerate(rows))+f'</div><p style="font-size:1em"><a href="../handwrite/w{w:02}.html" target="_blank" rel="noopener">本週動畫目錄 ↗</a> · <a href="#/animation">互動實驗</a></p></section>')
        assert content.count('</div></div>')==1
        content=content.replace('</div></div>',block+'\n</div></div>')
        content,shortcut=marked(content,'shortcut','<p style="font-size:1em;margin-top:1em"><a href="#/handwrite" style="color:#9fd3de">✍ 手寫動畫／Bài giảng viết tay →</a></p>')
        title_match=re.search(r'<div class="title-slide">.*?</div>',content,re.S);assert title_match
        at=title_match.end()-len('</div>');content=content[:at]+shortcut+content[at:]
        path.write_text(content,encoding='utf-8')
        # Each interactive lesson loads the shared opt-in navigation helper.
        path=SITE/f'vi-a2/lessons/w{w:02}.html';content=path.read_text(encoding='utf-8')
        tag='<script src="../../assets/handwrite-links.js"></script>'
        if tag not in content:content=content.replace('</body>',tag+'\n</body>')
        path.write_text(content,encoding='utf-8')
    body=f'<p><b>第 1–8 週 · 32 章 · {scenes} 幕 · 約 {total:.0f} 分鐘 · {pauses} 個作答停頓</b>（另加思考時間）</p><section class="grid">{cards}</section>'
    (OUT/'index.html').write_text(page('生物化學：手寫教學動畫',body,'<a href="../index.html">← 課程首頁</a>'+week_links),encoding='utf-8')
    for relative,href in [('index.html','handwrite/index.html'),('vi-a2/lessons/index.html','../../handwrite/index.html'),('animations.html','handwrite/index.html')]:
        path=SITE/relative;content=path.read_text(encoding='utf-8');content,block=marked(content,'overview',f'<p style="text-align:center;padding:12px"><a href="{href}">✍ 第 1–8 週手寫動畫／Bài giảng viết tay</a></p>')
        content=content.replace('<body>','<body>\n'+block,1);path.write_text(content,encoding='utf-8')
    # Add direct per-week links to the existing homepage week cells.
    path=SITE/'index.html';content=path.read_text(encoding='utf-8')
    for w in TITLES:
        content,block=marked(content,f'home-w{w:02}',f'<a class="lesson handwrite-link" href="handwrite/w{w:02}.html">✍ 手寫動畫</a>')
        pattern=rf'(<a class="lesson" href="vi-a2/lessons/w{w:02}\.html">.*?</a>)'
        content,count=re.subn(pattern,lambda m:m[0]+block,content,count=1);assert count==1
    path.write_text(content,encoding='utf-8')
    report={'chapters':32,'scenes':scenes,'audio_files':scenes,'pauses':pauses,'minutes':round(total,2),'source_lessons':provenance}
    (ROOT/'reports/handwrite').mkdir(parents=True,exist_ok=True)
    (ROOT/'reports/handwrite/integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='source_lessons'},ensure_ascii=False))

if __name__=='__main__':main()
