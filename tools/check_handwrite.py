"""Validate published integration locally under the Pages prefix, or against the live site."""
import argparse,io,json,re,threading
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urljoin,urlsplit,unquote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site';OUT=ROOT/'reports/handwrite'
OUT.mkdir(parents=True,exist_ok=True)

class Links(HTMLParser):
    def __init__(self):super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for key in ['src','href']:
            if key in a:self.refs.append(a[key])
        if 'srcdoc' in a:
            child=Links();child.feed(a['srcdoc']);self.refs+=child.refs

def audit():
    checked=0;broken=[]
    for file in (SITE/'handwrite').rglob('*.html'):
        parser=Links();parser.feed(file.read_text(encoding='utf-8'))
        for ref in parser.refs:
            url=urlsplit(ref)
            if url.scheme or url.netloc or not url.path:continue
            target=(file.parent/unquote(url.path)).resolve()
            if not target.is_relative_to(SITE.resolve()) or not target.exists():broken.append({'file':str(file.relative_to(SITE)),'ref':ref})
            checked+=1
    assert not broken,broken
    return checked

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--base');args=parser.parse_args()
    server=None
    if args.base:base=args.base.rstrip('/')+'/'
    else:
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self,*a,**kw):super().__init__(*a,directory=str(SITE),**kw)
            def translate_path(self,path):
                prefix='/biochemistry-course/'
                if path.startswith(prefix):path=path[len(prefix)-1:]
                return super().translate_path(path)
            def send_head(self):
                # GitHub Pages supports byte ranges. Python's stock static
                # handler does not, which makes browser MP3 seeking misleading.
                path=Path(self.translate_path(self.path));header=self.headers.get('Range','')
                match=re.fullmatch(r'bytes=(\d+)-(\d*)',header)
                if path.is_file() and match:
                    size=path.stat().st_size;start=int(match[1]);end=min(int(match[2]) if match[2] else size-1,size-1)
                    if start>=size or end<start:
                        self.send_error(416);return None
                    with path.open('rb') as stream:stream.seek(start);data=stream.read(end-start+1)
                    self.send_response(206);self.send_header('Content-Type',self.guess_type(str(path)))
                    self.send_header('Accept-Ranges','bytes');self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
                    self.send_header('Content-Length',str(len(data)));self.end_headers();return io.BytesIO(data)
                return super().send_head()
            def log_message(self,*a):pass
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        threading.Thread(target=server.serve_forever,daemon=True).start()
        base=f'http://127.0.0.1:{server.server_port}/biochemistry-course/'
    report={'base':base,'static_references_checked':audit(),'weeks':[],'chapters':[],'page_errors':[],'failed_requests':[],'http_errors':[]}
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        page=browser.new_page(viewport={'width':1440,'height':1100})
        page.on('pageerror',lambda e:report['page_errors'].append(str(e)))
        page.on('requestfailed',lambda r:report['failed_requests'].append({'url':r.url,'error':r.failure}) if r.failure!='net::ERR_ABORTED' and r.url.startswith(base) else None)
        page.on('response',lambda r:report['http_errors'].append({'url':r.url,'status':r.status}) if r.status>=400 and r.url.startswith(base) else None)
        records=page.request.get(base+'handwrite/course-manifest.json').json()
        assert len(records)==32 and sum(r['scenes'] for r in records)==234
        page.goto(base);assert page.locator('a.handwrite-link').count()==8
        page.locator('a[href="handwrite/index.html"]').first.click()
        assert page.locator('a.week').count()==8
        page.screenshot(path=str(OUT/('live-overview.png' if args.base else 'local-overview.png')),full_page=True)
        for w in range(1,9):
            page.goto(base+f'handwrite/w{w:02}.html');assert page.locator('a.chapter').count()==4
            page.goto(base+f'vi-a2/lessons/w{w:02}.html')
            link=page.locator('#handwrite-link a');assert link.count()==1
            assert link.get_attribute('href')==f'../../handwrite/w{w:02}.html'
            assert page.locator('#animation iframe').count()==1
            page.goto(base+f'vi-a2/w{w:02}.html#/handwrite')
            page.wait_for_function('window.Reveal&&Reveal.isReady()&&Reveal.getCurrentSlide()?.id==="handwrite"')
            assert page.locator('#handwrite a.handwrite-chapter').count()==4
            for size in [{'width':1280,'height':720},{'width':844,'height':390}]:
                page.set_viewport_size(size);page.wait_for_timeout(80)
                assert page.locator('#handwrite').evaluate('''el=>[...el.querySelectorAll('a')].every(a=>{const r=a.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1})''')
            if w in [1,8]:page.screenshot(path=str(OUT/f'{"live" if args.base else "local"}-w{w:02}-reveal.png'))
            page.set_viewport_size({'width':1440,'height':1100})
            # The original interactive lab still runs and pauses when leaving its route.
            page.locator('#handwrite a[href="#/animation"]').click()
            page.wait_for_function('Reveal.getCurrentSlide()?.id==="animation"')
            assert page.locator('#animation iframe').get_attribute('src')==f'../assets/animations/w{w:02}/simulation.html'
            lab=page.frame_locator('#animation iframe')
            lab.locator('#activity .choices button').first.click();lab.locator('#next').click();lab.locator('#play').click()
            page.evaluate('Reveal.slide(Reveal.getIndices(document.getElementById("handwrite")).h)')
            page.wait_for_function('Reveal.getCurrentSlide()?.id==="handwrite"')
            page.wait_for_timeout(100)
            assert lab.locator('#lab').get_attribute('data-playing')=='false'
            report['weeks'].append({'week':w,'four_chapters':True,'lesson_entry':True,'reveal_route':True,'landscape':True,'existing_lab_pause':True})
        for record in records:
            print('Checking',record['id'],flush=True)
            page.goto(base+f'handwrite/{record["id"]}/player.html')
            page.wait_for_function('window.lessonPlayer&&lessonPlayer.ready')
            meta=page.evaluate('lessonPlayer.meta');frame=page.frame_locator('#frame')
            assert len(meta['scenes'])==record['scenes']
            assert frame.locator('audio').count()==record['scenes']
            page.evaluate('lessonPlayer.jump(.5)');page.locator('#speed').select_option('1.25');page.locator('#play').click()
            try:
                page.wait_for_function('''[...document.querySelector('#frame').contentDocument.querySelectorAll('audio')].some(a=>!a.paused&&a.playbackRate===1.25&&a.readyState>=2)''',timeout=10000)
            except Exception:
                print(json.dumps({'chapter':record['id'],'state':page.evaluate('({time:lessonPlayer.time,playing:lessonPlayer.playing,speed:document.querySelector("#speed").value})'),'audio':frame.locator('audio').evaluate_all('xs=>xs.map(a=>({src:a.currentSrc,state:a.readyState,paused:a.paused,rate:a.playbackRate,time:a.currentTime,error:a.error?.message}))'),'hint':page.locator('#hint').inner_text(),'requests':report['failed_requests'],'http':report['http_errors']},ensure_ascii=False),flush=True)
                raise
            page.locator('#play').click();page.locator('#speed').select_option('1')
            for gate in [s for s in meta['scenes'] if s['pause']]:
                page.evaluate('t=>lessonPlayer.jump(t)',gate['end']-.55);page.locator('#play').click()
                page.wait_for_function('!lessonPlayer.playing&&document.querySelector("#play").textContent==="繼續"')
                assert page.evaluate('lessonPlayer.time')<gate['end']
                page.locator('#play').click();page.wait_for_function('lessonPlayer.playing');page.locator('#play').click()
            page.evaluate('t=>lessonPlayer.jump(t)',meta['duration']-.5);page.locator('#reset').click()
            assert page.evaluate('lessonPlayer.time')==0
            assert frame.locator(f'#sc{len(meta["scenes"])}').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
            page.locator('#seek').fill('2.5');page.locator('#seek').dispatch_event('input');assert page.evaluate('lessonPlayer.time')==2.5
            page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(50)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.locator('#next').click();assert page.evaluate('lessonPlayer.time')==meta['scenes'][1]['start']
            if record['id'] in ['w01-01-life','w08-03-polysaccharides']:page.screenshot(path=str(OUT/f'{"live" if args.base else "local"}-{record["id"]}-mobile.png'),full_page=True)
            nav=page.locator('#course-nav')
            assert nav.locator('a[href$="/simulation.html"]').get_attribute('href')==f'../../assets/animations/w{record["week"]:02}/simulation.html'
            page.set_viewport_size({'width':1440,'height':1100})
            report['chapters'].append({'id':record['id'],'audio_files':record['scenes'],'pause_gates':record['pauses'],'mobile':True,'seek_reset_speed':True})
        browser.close()
    if server:server.shutdown()
    name='live' if args.base else 'local'
    (OUT/(name+'-qa.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    assert not report['page_errors'],report['page_errors']
    assert not report['failed_requests'],report['failed_requests']
    assert not report['http_errors'],report['http_errors']
    print(json.dumps({'target':name,'weeks':len(report['weeks']),'chapters':len(report['chapters']),'audio_files':sum(r['audio_files'] for r in report['chapters']),'pause_gates':sum(r['pause_gates'] for r in report['chapters']),'errors':0,'static_references_checked':report['static_references_checked']}))

if __name__=='__main__':main()
