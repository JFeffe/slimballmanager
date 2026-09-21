// Derive SVG clipping geometry from unchanged source artwork. No raster edits.
const {default:sharp}=await import(process.env.SLIMBALL_SHARP_MODULE||'sharp');
import {readFile,writeFile} from 'node:fs/promises';
import {capPlacement} from '../dist/cap-renderer.js';
import {PORTRAITS} from '../dist/portraits.js';
import {atlasPanel} from '../dist/portrait-atlases.js';
const W=356,H=312,cache=new Map();
async function pixels(body){
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="356" height="312" viewBox="0 0 356 312">${body}</svg>`;
 for(const [,path] of svg.matchAll(/href="(\.\/assets\/[^\"]+)"/g)){
  if(!cache.has(path))cache.set(path,'data:image/png;base64,'+(await readFile(new URL('../dist/'+path,import.meta.url))).toString('base64'));
  svg=svg.replaceAll(path,cache.get(path));
 }
 return sharp(Buffer.from(svg)).flatten({background:'#faf6e5'}).removeAlpha().raw().toBuffer();
}
function pathFor(mask){let d='';for(let y=0;y<H;y++){let x=0;while(x<W){if(!mask[y*W+x]){x++;continue;}let a=x;while(x<W&&mask[y*W+x])x++;d+=`M${a} ${y}h${x-a}v1H${a}z`;}}return d;}
function components(mask){const seen=new Uint8Array(W*H),out=[];for(let start=0;start<mask.length;start++){if(!mask[start]||seen[start])continue;let queue=[start],minY=H,maxY=0;seen[start]=1;for(let n=0;n<queue.length;n++){const k=queue[n],x=k%W,y=Math.floor(k/W);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const j of [x? k-1:-1,x<W-1?k+1:-1,y?k-W:-1,y<H-1?k+W:-1])if(j>=0&&mask[j]&&!seen[j]){seen[j]=1;queue.push(j);}}out.push({pixels:queue,minY,maxY});}return out;}
const result={shirts:{},subjects:{},cappedSubjects:{}};
for(const p of PORTRAITS){
 const body=p.atlas?atlasPanel(p):`<svg width="356" height="312" viewBox="365 ${p.row[0]} 356 312"><image href="./assets/pilots/${p.id}.png" width="1448" height="1086"/></svg>`;
 const data=await pixels(body),candidate=new Uint8Array(W*H),mask=new Uint8Array(W*H);
 for(let k=0;k<candidate.length;k++){const [r,g,b]=data.subarray(k*3,k*3+3);candidate[k]=p.darkShirt?(Math.floor(k/W)>=210&&Math.max(r,g,b)-Math.min(r,g,b)<30&&r<125&&g<125&&b<130?1:0):r>220&&g>205&&b>170&&r-g<32&&g-b<62?1:0;}
 const parts=components(candidate).filter(c=>c.minY>=(p.darkShirt?210:220)&&c.maxY>=297&&c.pixels.length>12);
 for(const c of parts)for(const k of c.pixels)mask[k]=1;
 // Include cloth shading and piping between the detected upper/lower cloth edges.
 if(!p.darkShirt)for(let x=0;x<W;x++){let top=H,bottom=-1;for(let y=220;y<H;y++)if(mask[y*W+x]){top=Math.min(top,y);bottom=y;}for(let y=top;y<=bottom;y++)mask[y*W+x]=1;}
 // Pilot p05 has a break in the outer seam joining its pale sleeve to the paper.
 // Trace that sleeve's dark outer seam before filling only the fabric below it.
 if(p.id==='p05')for(let x=0;x<105;x++){let edge=false;for(let y=Math.max(235,Math.round(310-.5*x)-18);y<H;y++){if(!candidate[y*W+x])edge=true;else if(edge){for(let j=y;j<H;j++)mask[j*W+x]=1;break;}}}
 if(!parts.length){console.log(components(candidate).map(c=>[c.minY,c.maxY,c.pixels.length]).filter(x=>x[2]>12));throw Error('No cloth components '+p.id);}
 // Trace the exterior silhouette, preserving all original pixels inside it.
 const subject=new Uint8Array(W*H);
 let outerLeft=W,outerRight=0;
 for(let y=0;y<H;y++){
  const xs=[];for(let x=0;x<W;x++){
   const [r,g,b]=data.subarray((y*W+x)*3,(y*W+x)*3+3);
   if((r<205||g<180||b<125)&&(y>220||(x>45&&x<310)))xs.push(x);
  }
  if(xs.length>4){
   let l=xs[0],r=xs.at(-1);
   if(y>=250){outerLeft=Math.min(outerLeft,l);outerRight=Math.max(outerRight,r);l=outerLeft;r=outerRight;}
   for(let x=l;x<=r;x++)subject[y*W+x]=1;
  }
 }
 result.subjects[p.id]=pathFor(subject);
 const capped=subject.slice(),{left,right,brim,edge}=capPlacement(p.id);
 for(let y=0;y<(p.darkShirt?Math.min(edge+30,120):edge+30);y++){
  const opening=Math.max(0,(y-(edge-4))/34);
  let outsideLeft=0,outsideRight=W;
  // Bob hair should join the fitted temple gradually, without a horizontal shelf.
  if(['p13','p15','p16','p24','p33','p36','p39','p52','p54','p56','p59'].includes(p.id)){
   while(outsideLeft<W&&!subject[y*W+outsideLeft])outsideLeft++;
   while(outsideRight>0&&!subject[y*W+outsideRight-1])outsideRight--;
  }
  for(let x=0;x<W;x++)if(y<brim-5||x<(left+5)*(1-opening)+outsideLeft*opening||x>(right-5)*(1-opening)+outsideRight*opening)capped[y*W+x]=0;
 }
 result.cappedSubjects[p.id]=pathFor(capped);
 for(let k=0;k<mask.length;k++){mask[k]&=subject[k];if(p.darkShirt&&Math.floor(k/W)<Math.max(265,(p.gender?297:300)-(p.gender?.006:.004)*(k%W-178)**2))mask[k]=0;}
 result.shirts[p.id]=pathFor(mask);console.log(p.id,'cloth pixels',mask.reduce((a,b)=>a+b,0));
}
await writeFile(new URL('../dist/portrait-masks.js',import.meta.url),'// SVG clip geometry derived from the unchanged artwork; see scripts/build-portrait-masks.mjs.\nexport const PORTRAIT_MASKS='+JSON.stringify(result)+';\n');
