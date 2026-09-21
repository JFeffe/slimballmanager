import {portraitSvg,portraitById} from './portraits.js';
import {capPlacement} from './cap-renderer.js';
import {logoById} from './logos.js';
import {ACTION_POSES,SKIN_TONES} from './action-masks.js';
let serial=0;
const order=['bat','pitch','catch','run','swing','throw'];
const channels=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
const matrix=(rgb,base=[255,255,255])=>`${rgb[0]/base[0]} 0 0 0 0 0 ${rgb[1]/base[1]} 0 0 0 0 0 ${rgb[2]/base[2]} 0 0 0 0 0 1 0`;
export function actionSvg(face,kit=null,pose='bat'){
 const index=Math.max(0,order.indexOf(pose)),a=ACTION_POSES[index],p=portraitById(face)||portraitById('p01'),brand=logoById(kit),uid=`action-${++serial}`;
 const body=`<image href="./assets/action-bodies.png" x="${-(index%3)*512}" y="${-Math.floor(index/3)*512}" width="1536" height="1024"/>`;
 const tint=(key,color,base)=>`<clipPath id="${uid}-${key}"><path d="${a[key]}"/></clipPath><filter id="${uid}-${key}-tint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix(color,base)}"/></filter>`;
 const layer=key=>`<g clip-path="url(#${uid}-${key})" filter="url(#${uid}-${key}-tint)">${body}</g>`;
 // Fit each portrait from its measured skull, with a pose-specific neck pivot.
 const fit=capPlacement(p.id),scale=64/(fit.right-fit.left),hw=330*scale;
 const bottom=p.neck[1]-12,top=-18,hh=(bottom-top)*scale;
 const neckX=(p.neck[0]+p.neck[2])/2,headX=a.anchor[0]-(neckX-13)*scale,headY=a.anchor[1]+14-hh;
 const angle=[-9,7,0,12,-12,10][index];
 const head=portraitSvg(p.id,brand?.id||null,true).replace(/viewBox="13 -18 330 [^"]+"/,`viewBox="13 -18 330 ${bottom-top}"`).replace('<svg ',`<svg x="${headX}" y="${headY}" width="${hw}" height="${hh}" `);
 const fittedHead=`<g transform="rotate(${angle} ${a.anchor[0]} ${a.anchor[1]+8})">${head}</g>`;

 return `<svg xmlns="http://www.w3.org/2000/svg" class="athlete" viewBox="0 0 512 512" aria-hidden="true" focusable="false" data-athlete-face="${p.id}" data-athlete-kit="${brand?.id||'none'}" data-pose="${order[index]}"><defs>${brand?tint('cloth',channels(brand.colors[0]))+tint('trim',channels(brand.colors[1]),[60,90,160]):''}${tint('skin',SKIN_TONES[p.id]||[195,130,75],[195,130,75])}</defs>${body}${brand?layer('cloth')+layer('trim'):''}${layer('skin')}${fittedHead}${brand?layer('cloth')+layer('trim'):''}</svg>`;
}
