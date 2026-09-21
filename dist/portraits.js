import {capSvg,capPlacement} from './cap-renderer.js';
import {PORTRAIT_MASKS} from './portrait-masks.js';
import {logoById} from './logos.js';
import {ATLAS_PORTRAITS,atlasPanel} from './portrait-atlases.js';

// Permanent cosmetic IDs: never use the size/order of the bank as a saved identity.
export const PORTRAITS=Object.freeze([
 {id:'p01',gender:0,weight:1,row:[8,367,722],neck:[104,251,247,251]},
 {id:'p02',gender:0,weight:1,row:[8,365,726],neck:[102,239,252,239]},
 {id:'p03',gender:0,weight:1,row:[8,365,722],neck:[104,249,247,249]},
 {id:'p04',gender:1,weight:2,row:[8,363,724],neck:[113,248,243,248]},
 {id:'p05',gender:1,weight:2,row:[8,363,726],neck:[110,251,243,251]},
 {id:'p06',gender:1,weight:1,row:[8,365,726],neck:[116,255,241,255],fantasy:true},
 ...ATLAS_PORTRAITS
]);
export const portraitById=id=>PORTRAITS.find(p=>p.id===id);
const hash=text=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export function assignPortrait(s,p){
 if(p.portraitId)return p.portraitId;
 const gender=p.gender??p.portrait%2,pool=PORTRAITS.filter(x=>x.gender===gender);
 // Prefer unused / least represented faces in the current population. Existing
 // players are never rerolled; this stream does not consume the sports RNG.
 const uses=new Map(pool.map(x=>[x.id,0]));
 for(const existing of Object.values(s.players))if(!existing.retired&&uses.has(existing.portraitId))uses.set(existing.portraitId,uses.get(existing.portraitId)+1);
 const minimum=Math.min(...uses.values()),choices=pool.filter(x=>uses.get(x.id)===minimum);
 p.portraitId=choices[hash(`${s.id}:${p.id}:portrait`)%choices.length].id;
 return p.portraitId;
}
export function ensurePortraits(s){
 for(const p of Object.values(s.players))assignPortrait(s,p);
 for(const a of s.archives)for(const p of Object.values(a.players)){
  if(!p.portraitId)p.portraitId=s.players[p.id]?.portraitId||assignPortrait(s,p);
 }
 return s;
}
export function appearance(s,p,owner=undefined){
 const tm=owner===undefined?s?.teams.find(t=>t.roster.includes(p.id)):owner;
 return {portraitId:portraitById(p.portraitId)?.id||PORTRAITS.find(x=>x.gender===(p.gender??p.portrait%2)).id,logo:logoById(tm?.logo)?.id||null};
}
let serial=0;
// All uniforms use one uncapped drawing per person. Only real cap silhouettes
// and the individual cloth contours are composited; no rectangular head patches.
export function portraitSvg(id,logo=null,headOnly=false){
 const p=portraitById(id)||PORTRAITS[0],brand=logoById(logo),uid=`portrait-${++serial}`;
 const asset=`./assets/pilots/${p.id}.png`,xs=[5,365,726,1088];
 const panel=index=>{const x=xs[index%4],y=p.row[Math.floor(index/4)];return `<svg width="356" height="312" viewBox="${x} ${y} 356 312"><image href="${asset}" width="1448" height="1086"/></svg>`;};
 const rawBase=p.atlas?atlasPanel(p):panel(1);
 const capTop=brand?capPlacement(p.id).brim-10:-18;
 const base=brand?`<defs><clipPath id="${uid}-below-cap"><rect x="0" y="${capTop}" width="356" height="${330-capTop}"/></clipPath></defs><g clip-path="url(#${uid}-below-cap)">${rawBase}</g>`:rawBase;
 // The crown hair is tucked into the cap, rather than enlarging the cap to
 // cover the hairstyle. Keep the entire original drawing when unassigned.
 const subject=(brand?PORTRAIT_MASKS.cappedSubjects:PORTRAIT_MASKS.subjects)[p.id];
 const shirt=PORTRAIT_MASKS.shirts[p.id];
 const rgb=brand?.colors[0].slice(1).match(/../g).map(v=>parseInt(v,16)/255);
 const matrix=rgb?.map((v,i)=>[0,0,0,0,0].map((_,j)=>j===i?v*(p.darkShirt?4.8:1):0).join(' ')).join(' ')+' 0 0 0 1 0';
 const height=headOnly?p.neck[1]+10:330;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="13 -18 330 ${height}" aria-hidden="true" focusable="false" data-face="${p.id}" data-kit="${brand?.id||'none'}"><defs><clipPath id="${uid}-subject"><path d="${subject}"/></clipPath><clipPath id="${uid}-shirt"><path d="${shirt}"/></clipPath>${brand?`<filter id="${uid}-tint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix}"/></filter>`:''}</defs>${headOnly?'':'<rect x="13" y="-18" width="330" height="330" fill="#faf6e5"/>'}<g clip-path="url(#${uid}-subject)">${base}</g>${brand?capSvg(p.id,brand,uid):''}${brand&&!headOnly?`<g clip-path="url(#${uid}-shirt)" filter="url(#${uid}-tint)">${base}</g>`:''}</svg>`;
}
