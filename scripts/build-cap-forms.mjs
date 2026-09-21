// Analyze generated material regions; emit SVG clipping geometry only.
// The original PNG stays byte-for-byte unchanged.
import {readFile,writeFile} from 'node:fs/promises';
const {default:sharp}=await import(process.env.SLIMBALL_SHARP_MODULE||'sharp');
const file=await readFile(new URL('../dist/assets/portraits/cap-forms.png',import.meta.url));
const {data,info}=await sharp(file).removeAlpha().raw().toBuffer({resolveWithObject:true});
const W=info.width/3,H=info.height,forms={};
function pathFor(mask){let path='';for(let y=0;y<H;y++)for(let x=0;x<W;){if(!mask[y*W+x]){x++;continue;}const a=x;while(x<W&&mask[y*W+x])x++;path+=`M${a} ${y}h${x-a}v1H${a}z`;}return path;}
for(const [cell,name] of ['narrow','regular','round'].entries()){
 const silhouette=new Uint8Array(W*H),trim=new Uint8Array(W*H),crown=new Uint8Array(W*H);
 let left=W,right=0,top=H,bottom=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=(y*info.width+cell*W+x)*3,[r,g,b]=data.subarray(k,k+3);
  if(Math.min(r,g,b)<210){silhouette[y*W+x]=1;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(g-r>18&&b-r>18)trim[y*W+x]=1;
 }
 // Fill each actual silhouette row, including its gray highlights; no white halo.
 for(let y=top;y<=bottom;y++){
  const xs=[];for(let x=left;x<=right;x++)if(silhouette[y*W+x])xs.push(x);
  // The arch below the visor must remain empty: preserve split spans there.
  if(y<(top+bottom)/2&&xs.length)for(let x=xs[0];x<=xs.at(-1);x++)silhouette[y*W+x]=1;
 }
 // Cyan material includes its dark seam; all other retained pixels are crown.
 for(let k=0;k<silhouette.length;k++){
  if(!silhouette[k]){trim[k]=0;continue;}
  if(!trim[k])crown[k]=1;
 }
 const center=Math.round((left+right)/2);let centerBottom=top;
 for(let y=top;y<=bottom;y++)if(silhouette[y*W+center])centerBottom=y;
 forms[name]={cell,left,right,top,bottom,centerBottom,crown:pathFor(crown),trim:pathFor(trim)};
 console.log(name,{left,right,top,bottom,centerBottom,ratio:(centerBottom-top)/(right-left)});
}
await writeFile(new URL('../dist/cap-forms.js',import.meta.url),`// Generated SVG material masks; original image in assets/portraits/cap-forms.png.\nexport const CAP_SHEET={width:${info.width},height:${H},cellWidth:${W}};\nexport const CAP_FORMS=${JSON.stringify(forms)};\n`);
