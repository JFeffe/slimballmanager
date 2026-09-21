const {default:sharp}=await import(process.env.SLIMBALL_SHARP_MODULE||'sharp');
import {readFile,mkdir} from 'node:fs/promises';
import {LOGOS} from '../dist/logos.js';
import {portraitSvg,PORTRAITS} from '../dist/portraits.js';
const cache=new Map(),out=process.argv[2]||'/tmp/slimball-cap-review';
await mkdir(out,{recursive:true});
for(let page=0;page<(process.argv.includes('--cards-only')?0:Math.ceil(PORTRAITS.length/8));page++){
 let pieces=[];
 for(let i=0;i<8;i++){
  const p=PORTRAITS[page*8+i];if(!p)break;
  let svg=portraitSvg(p.id,['wolf','hawk','bison','shark','lynx','fox','horse','bear'][i]);
  for(const [,path] of svg.matchAll(/href="(\.\/assets\/[^\"]+)"/g)){
   if(!cache.has(path))cache.set(path,'data:image/png;base64,'+(await readFile(new URL('../dist/'+path,import.meta.url))).toString('base64'));
   svg=svg.replaceAll(path,cache.get(path));
  }
  const input=await sharp(Buffer.from(svg)).resize(312,312).png().toBuffer();
  pieces.push({input,left:(i%4)*312,top:Math.floor(i/4)*336});
 }
 await sharp({create:{width:1248,height:672,channels:4,background:'#ece8dc'}}).composite(pieces).png().toFile(`${out}/portraits-${page+1}.png`);
 console.log('page',page);
}

// Actual roster-card scale, one contact sheet per team, all 40 faces.
if(!process.argv.includes('--full-only'))for(const kit of LOGOS.filter(k=>!process.argv.some(a=>a.startsWith('--kit='))||process.argv.includes('--kit='+k.id))){
 const pieces=[];
 for(const [i,p] of PORTRAITS.entries()){
  let svg=portraitSvg(p.id,kit.id);
  for(const [,path] of svg.matchAll(/href="(\.\/assets\/[^\"]+)"/g)){
   if(!cache.has(path))cache.set(path,'data:image/png;base64,'+(await readFile(new URL('../dist/'+path,import.meta.url))).toString('base64'));
   svg=svg.replaceAll(path,cache.get(path));
  }
  pieces.push({input:await sharp(Buffer.from(svg)).resize(96,96).png().toBuffer(),left:i%8*104,top:Math.floor(i/8)*120});
  pieces.push({input:Buffer.from(`<svg width="104" height="24"><text x="36" y="18" font-size="13">${p.id}</text></svg>`),left:i%8*104,top:Math.floor(i/8)*120+96});
 }
 await sharp({create:{width:832,height:Math.ceil(PORTRAITS.length/8)*120,channels:4,background:'#faf6e5'}}).composite(pieces).png().toFile(`${out}/cards-${kit.id}.png`);
}
