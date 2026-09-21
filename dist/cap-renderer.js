import {CAP_FORMS,CAP_SHEET} from './cap-forms.js';
import {PORTRAIT_FIT} from './portrait-fit.js';
import {LOGOS} from './logos.js';
// These are the same original mascot rectangles used by the team interface.
const LOGO_FRAMES=[[38,13,316,328],[383,39,394,294],[809,20,386,321],[1231,33,371,309],[1655,9,282,331],[38,408,322,318],[385,407,397,304],[795,431,394,283],[1219,415,384,303],[1631,415,327,297]];
export function capPlacement(id){
 const [left,right,brim,pattern]=PORTRAIT_FIT[id],form=CAP_FORMS[pattern];
 const scale=(right-left)/(form.right-form.left);
 return {form,pattern,scale,left,right,brim,x:left-form.left*scale,y:brim-form.centerBottom*scale,edge:brim+(form.bottom-form.centerBottom)*scale,top:brim-(form.centerBottom-form.top)*scale};
}
const rgb=color=>color.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
function tint(color,gain){const channels=rgb(color);return channels.map(c=>`0 ${c*gain} 0 0 0`).join(' ')+' 0 0 0 1 0';}
export function capSvg(id,brand,uid){
 const {form,pattern,scale,x,y,left,right,top}=capPlacement(id),w=right-left;
 const trimColor=brand.id==='wolf'?brand.colors[2]:brand.colors[1];
 const image=`<svg width="${CAP_SHEET.cellWidth}" height="${CAP_SHEET.height}" viewBox="${form.cell*CAP_SHEET.cellWidth} 0 ${CAP_SHEET.cellWidth} ${CAP_SHEET.height}"><image href="./assets/portraits/cap-forms.png" width="${CAP_SHEET.width}" height="${CAP_SHEET.height}"/></svg>`;
 const [lx,ly,lw,lh]=LOGO_FRAMES[LOGOS.indexOf(brand)],box=w*.30;
 const logoWidth=box*Math.min(1,lw/lh),logoHeight=box*Math.min(1,lh/lw);
 return `<defs><clipPath id="${uid}-crown"><path d="${form.crown}"/></clipPath><clipPath id="${uid}-trim"><path d="${form.trim}"/></clipPath><filter id="${uid}-crown-color" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${tint(brand.colors[0],1.5)}"/></filter><filter id="${uid}-trim-color" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${tint(trimColor,1.25)}"/></filter></defs><g data-cap-pattern="${pattern}" transform="translate(${x} ${y}) scale(${scale})"><g clip-path="url(#${uid}-crown)" filter="url(#${uid}-crown-color)">${image}</g><g clip-path="url(#${uid}-trim)" filter="url(#${uid}-trim-color)">${image}</g></g><svg x="${(left+right-logoWidth)/2}" y="${top+w*.11}" width="${logoWidth}" height="${logoHeight}" viewBox="${lx} ${ly} ${lw} ${lh}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${uid}-logo-frame"><rect x="${lx}" y="${ly}" width="${lw}" height="${lh}"/></clipPath></defs><image clip-path="url(#${uid}-logo-frame)" href="./assets/team-logos-transparent.png" width="1983" height="793"/></svg>`;
}
