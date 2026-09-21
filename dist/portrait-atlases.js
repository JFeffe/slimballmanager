// Each atlas is an original generated sheet. Crops and masks are applied at
// render time so every player's face pixels stay unchanged between uniforms.
export const ATLASES={
 e:{file:'lot-e.png',width:1698,height:926,columns:5,rows:2,tops:[0,450],heights:[417,417],edges:[0,360,698,1020,1340,1698]},
 f:{file:'lot-f.png',width:1983,height:793,columns:5,rows:2,tops:[0,402],heights:[373,352]},
 a:{file:'lot-a.png',width:2113,height:744,columns:5,rows:2},
 b:{file:'lot-b.png',width:2113,height:744,columns:5,rows:2},
 c:{file:'lot-c.png',width:2113,height:744,columns:5,rows:2},
 d:{file:'lot-d.png',width:1330,height:1182,columns:2,rows:2,bottomTrim:18}
};
export const ATLAS_PORTRAITS=['a','b','c'].flatMap((atlas,lot)=>Array.from({length:10},(_,cell)=>({
 id:`p${String(lot*10+cell+7).padStart(2,'0')}`,gender:cell<5?0:1,
 atlas,cell,neck:[104,249,250,249],fantasy:cell===[1,4,5][lot]
}))).concat(Array.from({length:4},(_,cell)=>({
 id:`p${cell+37}`,gender:cell<2?0:1,atlas:'d',cell,
 neck:cell<2?[109,239,248,239]:[108,250,249,250],fantasy:false
}))).concat(['e','f'].flatMap((atlas,lot)=>Array.from({length:10},(_,cell)=>({id:`p${41+lot*10+cell}`,gender:lot,atlas,cell,neck:[105,250,250,250],fantasy:cell>=5,darkShirt:true}))));

export function atlasPanel(p){
 const a=ATLASES[p.atlas],w=a.edges?a.edges[p.cell%a.columns+1]-a.edges[p.cell%a.columns]:a.width/a.columns,h=a.height/a.rows;
 const row=Math.floor(p.cell/a.columns),x=a.edges?.[p.cell%a.columns]??p.cell%a.columns*w,y=a.tops?.[row]??row*h,hh=a.heights?.[row]??h-(a.bottomTrim||0);
 return `<svg width="356" height="312" viewBox="${x} ${y} ${w} ${hh}" preserveAspectRatio="${p.darkShirt?'xMidYMid meet':'none'}"><defs><clipPath id="cell-${p.id}"><rect x="${x}" y="${y}" width="${w}" height="${hh}"/></clipPath></defs><image clip-path="url(#cell-${p.id})" href="./assets/portraits/${a.file}" width="${a.width}" height="${a.height}"/></svg>`;
}
