#!/usr/bin/env python3
"""Final byte-identifiable desktop/mobile playback against every rendered MP4."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import hashlib,json
from playwright.sync_api import sync_playwright
from animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1];REPORT=ROOT/'reports/animations'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'site')));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
results=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--autoplay-policy=no-user-gesture-required'])
  for profile,width,height in [('desktop',1365,900),('mobile',390,844)]:
   context=b.new_context(viewport={'width':width,'height':height},is_mobile=profile=='mobile');page=context.new_page();page.goto(base+'/animations.html',wait_until='load')
   assert page.locator('video').count()==16
   for w in CONTENT:
    slug=f'w{w:02}';selector=f'#{slug} video';page.locator(selector).scroll_into_view_if_needed()
    page.eval_on_selector(selector,"v => {v.muted=true;v.textTracks[0].mode='showing';v.play();}")
    page.wait_for_function('(s)=>{const v=document.querySelector(s);return v.currentTime>.2 && v.textTracks[0].cues?.length===5}',arg=selector)
    result=page.eval_on_selector(selector,'v=>({currentTime:v.currentTime,readyState:v.readyState,paused:v.paused,error:v.error?.code||null,width:v.videoWidth})');assert not result['paused'] and result['width']==960 and not result['error']
    page.eval_on_selector(selector,'v=>{v.pause();v.currentTime=v.duration-.5;}');page.wait_for_function('(s)=>{const v=document.querySelector(s);return !v.seeking && v.readyState>=2}',arg=selector)
    path=ROOT/f'site/assets/animations/{slug}/{slug}_animation.mp4';results.append({'week':slug,'profile':profile,'playback_and_ending_seek':'passed','mp4_sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    (REPORT/'final-media-progress.json').write_text(json.dumps(results,indent=2)+'\n')
   for w in (1,15):
    page.goto(base+f'/vi-a2/lessons/w{w:02}.html#animation',wait_until='load');page.locator('video').scroll_into_view_if_needed();page.evaluate('document.querySelector("video").muted=true;document.querySelector("video").play()');page.wait_for_function('document.querySelector("video").currentTime>.2');page.screenshot(path=str(REPORT/f'browser-{profile}-w{w:02}.png'))
   context.close()
  b.close()
 assert len(results)==len(CONTENT)*2
 report={'final_media_checks':len(results),'results':results};(REPORT/'final-media-browser-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
finally:server.shutdown()
