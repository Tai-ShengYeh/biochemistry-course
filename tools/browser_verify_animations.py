#!/usr/bin/env python3
"""Real Chromium desktop/mobile video + cue + Reveal isolation checks.
Run after rendering. Set LD_LIBRARY_PATH if Chromium dependencies are local.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json
from playwright.sync_api import sync_playwright
from animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1];REPORT=ROOT/'reports/animations';REPORT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'site')));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
# Resume a partial same-artifact run explicitly; normal runs start clean.
import os
progress=REPORT/'browser-progress.json'
results=json.loads(progress.read_text()) if os.environ.get('BIO_VERIFY_RESUME')=='1' and progress.exists() else []
completed={(r['profile'],r['week'],r['page']) for r in results}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--autoplay-policy=no-user-gesture-required'])
  for profile,size in [('desktop',{'width':1365,'height':900}),('mobile',{'width':390,'height':844})]:
   context=browser.new_context(viewport=size,is_mobile=profile=='mobile',has_touch=profile=='mobile');page=context.new_page()
   for w in CONTENT:
    for kind,url in [('slide',f'/vi-a2/w{w:02}.html#/animation'),('interactive',f'/vi-a2/lessons/w{w:02}.html#animation')]:
     if (profile,f'w{w:02}',kind) in completed:continue
     errors=[];page.goto(base+url,wait_until='load')
     if kind=='slide':page.wait_for_function('window.Reveal && Reveal.isReady()');page.evaluate("Reveal.slide(Reveal.getIndices(document.querySelector('#animation')).h)")
     page.locator('video').wait_for();page.locator('video').scroll_into_view_if_needed()
     page.evaluate('''() => {const v=document.querySelector('video');v.muted=true;v.load();}''')
     page.wait_for_function('document.querySelector("video").readyState>=2')
     page.evaluate('document.querySelector("video").textTracks[0].mode="showing"')
     page.wait_for_function('document.querySelector("video").textTracks[0].cues && document.querySelector("video").textTracks[0].cues.length===5')
     page.evaluate('document.querySelector("video").play()');page.wait_for_function('document.querySelector("video").currentTime>.2')
     result=page.evaluate('''() => {const v=document.querySelector('video'),r=v.getBoundingClientRect();return {currentTime:v.currentTime,paused:v.paused,videoWidth:v.videoWidth,videoHeight:v.videoHeight,duration:v.duration,cues:v.textTracks[0].cues.length,controls:v.controls,playsInline:v.playsInline,viewportWidth:innerWidth,videoLeft:r.left,videoRight:r.right,documentWidth:document.documentElement.scrollWidth};}''')
     assert result['videoWidth']==960 and result['videoHeight']==540 and result['controls'] and not result['paused']
     assert result['videoLeft']>=-2 and result['videoRight']<=size['width']+2,(w,profile,kind,result)
     if kind=='slide':
      before=page.evaluate('Reveal.getIndices().h');page.locator('video').focus();page.keyboard.press('ArrowRight');assert page.evaluate('Reveal.getIndices().h')==before
      page.evaluate('Reveal.next()');page.wait_for_function('document.querySelector("video").paused')
     else:assert result['documentWidth']<=size['width']+2
     if w in (1,15) and kind=='interactive':page.screenshot(path=str(REPORT/f'browser-{profile}-w{w:02}.png'),full_page=False)
     page.evaluate('document.querySelector("video").pause()');results.append({'week':f'w{w:02}','profile':profile,'page':kind,'playback':'passed','subtitle_cues':result['cues'],'media_width':result['videoWidth'],'inline_layout':'passed','reveal_keyboard_and_pause':'passed' if kind=='slide' else 'not_applicable'})
     (REPORT/'browser-progress.json').write_text(json.dumps(results,indent=2)+'\n');print(profile,w,kind,'passed',flush=True)
   page.goto(base+'/animations.html',wait_until='networkidle');assert page.locator('video').count()==16
   assert page.evaluate('document.documentElement.scrollWidth')<=size['width']+2
   context.close()
  browser.close()
 report={'browser':'Chromium','page_playback_checks':len(results),'expected_page_playback_checks':64,'gallery_video_count':16,'results':results};assert len(results)==64
 (REPORT/'browser-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
finally:server.shutdown()
