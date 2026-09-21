# Trace the foreground of existing raster icons into SVG clipping paths.
# Original artwork stays unchanged; the browser renders only the traced pixels.
import json
from pathlib import Path
from PIL import Image
im=Image.open('dist/assets/stat-icons.png').convert('RGB')
frames={'contact':[65,80,290,231],'power':[450,70,290,244],'catch':[817,80,282,234],'throw':[1185,110,305,201],'speed':[45,400,310,203],'avg':[475,395,220,208],'hr':[800,394,314,211],'energy':[65,720,280,147],'value':[445,666,285,245],'awards':[845,678,245,232],'champion':[1195,680,300,227]}
paths={}
for key,(x,y,w,h) in frames.items():
 rows=[]
 for yy in range(y,y+h):
  start=None
  for xx in range(x,x+w+1):
   r,g,b=im.getpixel((xx,yy)) if xx<x+w else (0,0,0)
   on=xx<x+w and (r>65 or g>98 or b>125)
   if on and start is None:start=xx
   if not on and start is not None:rows.append(f'M{start} {yy}h{xx-start}v1H{start}z');start=None
 paths[key]=''.join(rows)
Path('dist/stat-clips.js').write_text('export const STAT_FRAMES='+json.dumps(frames)+';\nexport const STAT_CLIPS='+json.dumps(paths)+';\n')
