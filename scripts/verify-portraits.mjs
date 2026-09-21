// Optional visual regression check: install sharp or set SLIMBALL_SHARP_MODULE.
const {default:sharp}=await import(process.env.SLIMBALL_SHARP_MODULE||'sharp');
import assert from 'node:assert/strict';
import {capPlacement} from '../dist/cap-renderer.js';
import {LOGOS} from '../dist/logos.js';
import {readFile} from 'node:fs/promises';
import {portraitSvg,PORTRAITS} from '../dist/portraits.js';
// SVG clip extents can shift edge antialiasing by 1–2 levels in librsvg.
// Keep a strict 2/255 tolerance; no displaced/covered facial pixel is accepted.
const samePixels=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<=2);
const panels=[],variants=[null,...LOGOS.map(x=>x.id)],cache=new Map();
const selected=PORTRAITS.filter(p=>!process.argv[3]||p.atlas===process.argv[3]);
for(const [row,p] of selected.entries()){
 let reference,original;
 for(const [col,kit] of variants.entries()){
  let svg=portraitSvg(p.id,kit);
  for(const [,path] of svg.matchAll(/href="(\.\/assets\/[^\"]+)"/g)){
   if(!cache.has(path))cache.set(path,'data:image/png;base64,'+(await readFile(new URL('../dist/'+path,import.meta.url))).toString('base64'));
   svg=svg.replaceAll(path,cache.get(path));
  }
  const raw=await sharp(Buffer.from(svg)).resize(312,312).ensureAlpha().raw().toBuffer();
  // All eyes/nose/mouth in the central face must survive every wardrobe change.
  const oldTop=p.atlas==='d'?(p.gender?120:114):p.atlas==='c'?120:p.atlas?126:134;
  // Map the original face region to the new padded 330-unit portrait frame.
  // The narrower new busts put the lower visor corners just below the old ROI.
  const top=Math.ceil((Math.max(oldTop,p.darkShirt?capPlacement(p.id).edge+3:0)+18)*312/330);
  const face=Buffer.concat(Array.from({length:242-top},(_,i)=>raw.subarray(((i+top)*312+89)*4,((i+top)*312+225)*4)));
  if(reference)assert(samePixels(face,reference),`${p.id} ${kit} changed the face`);else {reference=face;original=raw;}
  const patch=(pixels,x,y,w,h)=>Buffer.concat(Array.from({length:h},(_,i)=>pixels.subarray(((y+i)*312+x)*4,((y+i)*312+x+w)*4)));
  if(kit){
   // Temple hair is intentionally tucked in. Below that transition, side
   // lengths must be unchanged; the face check above remains independent.
   const hairTop=Math.max(155,Math.ceil((capPlacement(p.id).edge+30+18)*312/330)+1);
   for(const [x,y,w,h] of [[5,20,35,65],[272,20,35,65],[5,hairTop,40,235-hairTop],[272,hairTop,35,235-hairTop],[140,250,30,20]])assert(samePixels(patch(raw,x,y,w,h),patch(original,x,y,w,h)),`${p.id} ${kit}: background, side hair or neck changed`);
   for(const x of (p.darkShirt?[65,240]:[40,265]))assert.notDeepEqual(patch(raw,x,298,7,7),patch(original,x,298,7,7),`${p.id} ${kit}: sleeve was not recolored`);
  }
  const input=await sharp(raw,{raw:{width:312,height:312,channels:4}}).resize(144,144).png().toBuffer();
  panels.push({input,left:col*144,top:row*144});
 }
 console.log(`${p.id}: all 11 appearances rendered, face invariant`);
}
await sharp({create:{width:1584,height:selected.length*144,channels:4,background:'#faf4e3'}}).composite(panels).png().toFile(process.argv[2]||'/tmp/slimball-portrait-qa.png');
console.log(`${selected.length*11} rendered combinations; ${selected.length*10} pixel comparisons passed.`);
