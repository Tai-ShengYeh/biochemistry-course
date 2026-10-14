#!/usr/bin/env python3
"""Decode and validate every shared animation; retain review contact sheets."""
from pathlib import Path
import json,subprocess,re,math,ast
from PIL import Image,ImageDraw,ImageFont,ImageChops
from fontTools.ttLib import TTFont
from animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'site/assets/animations';REPORT=ROOT/'reports/animations';REPORT.mkdir(parents=True,exist_ok=True)
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True).stdout
def sec(s):
 h,m,x=s.replace(',','.').split(':');return int(h)*3600+int(m)*60+float(x)
def main():
 expected={f'w{w:02}' for w in CONTENT};actual={p.parent.name for p in BASE.glob('w*/*_animation.mp4')};assert actual==expected,(actual,expected)
 results=[];all_text=''
 for slug in sorted(expected):
  folder=BASE/slug;mp4=folder/f'{slug}_animation.mp4';data=json.loads((folder/'storyboard.json').read_text());all_text+=data['title']+''.join(data['key_terms'])+''.join(c['text'] for c in data['timing']['cues'])
  probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(mp4)]));duration=float(probe['format']['duration']);streams=probe['streams'];assert {s['codec_type'] for s in streams}=={'audio','video'}
  assert abs(duration-data['timing']['video_seconds'])<.1;assert duration-data['timing']['speech_seconds']>=1.9
  run(['ffmpeg','-v','error','-i',str(mp4),'-f','null','-'])
  for ext in ('srt','vtt'):
   s=(folder/f'{slug}_animation.{ext}').read_text();matches=re.findall(r'(\d\d:\d\d:\d\d[.,]\d{3}) --> (\d\d:\d\d:\d\d[.,]\d{3})\n(.*?)(?=\n\n|\Z)',s,re.S);assert len(matches)==len(data['timing']['cues'])
   last=0
   for (a,b,text),cue in zip(matches,data['timing']['cues']):
    start,end=sec(a),sec(b);assert start>=last-.002 and end<=duration and end>start
    assert abs(start-cue['start'])<.002 and abs(end-cue['end'])<.002
    assert text.strip().replace('\n','')==cue['text'];last=end
  images=[]
  for k,t in enumerate([.5,duration/2,duration-.3]):
   p=REPORT/f'{slug}-{k}.jpg';run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(mp4),'-frames:v','1',str(p)]);images.append(Image.open(p).copy());p.unlink()
  # Verify moving instructional area, excluding the narration caption.
  a=REPORT/'motion-a.png';b=REPORT/'motion-b.png'
  for p,t in [(a,1),(b,1.75)]:run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(mp4),'-frames:v','1',str(p)])
  diff=ImageChops.difference(Image.open(a).crop((50,140,910,445)),Image.open(b).crop((50,140,910,445)));pixels=diff.tobytes();changed_pixels=sum(1 for r,g,b in zip(pixels[0::3],pixels[1::3],pixels[2::3]) if r+g+b>60);assert changed_pixels>200,(slug,changed_pixels)
  a.unlink();b.unlink()
  sheet=Image.new('RGB',(960,570),'white');d=ImageDraw.Draw(sheet)
  for k,img in enumerate(images):img.thumbnail((480,270));sheet.paste(img,((k%2)*480,(k//2)*285+15))
  d.text((485,310),f'{slug.upper()} opening / middle / ending',fill='black');sheet.save(REPORT/f'{slug}-frames.jpg',quality=90)
  # Resolve authored slide URLs and ensure exam pages have not gained video.
  html=(ROOT/f'site/vi-a2/{slug}.html').read_text();assert html.count('<video ')==1
  for path in re.findall(r'(?:src|poster)="([^"]*animations[^"]*)"',html):assert (ROOT/'site/vi-a2'/path).resolve().exists(),path
  results.append({'week':slug,'mp4':str(mp4.relative_to(ROOT)),'bytes':mp4.stat().st_size,'duration_seconds':duration,'video_codec':next(s['codec_name'] for s in streams if s['codec_type']=='video'),'audio_codec':next(s['codec_name'] for s in streams if s['codec_type']=='audio'),'full_decode':'passed','subtitle_cues':len(matches),'subtitle_text_and_timing':'passed','motion_region_difference':'passed','changed_diagram_pixels':changed_pixels,'ending_hold_seconds':duration-data['timing']['speech_seconds'],'review_sheet':str((REPORT/f'{slug}-frames.jpg').relative_to(ROOT))})
 for w in (9,18):assert '<video' not in (ROOT/f'site/vi-a2/w{w:02}.html').read_text()
 cmap=TTFont('/mnt/c/Windows/Fonts/msjh.ttc',fontNumber=0).getBestCmap() or {};cmap.update(TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf').getBestCmap() or {});missing=sorted({c for c in all_text if not c.isspace() and ord(c) not in cmap});assert not missing,missing
 report={'expected_count':len(CONTENT),'verified_count':len(results),'exam_weeks_omitted':['w09','w18'],'font_missing_glyphs':missing,'total_mp4_bytes':sum(x['bytes'] for x in results),'results':results};(REPORT/'media-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
