// Approved mascot board, displayed as ten cropped tiles without altering the artwork.
export const LOGOS = [
 {id:'wolf',teamName:'Les Loups de Circuit',names:['Loup','Wolf','Lobo'],colors:['#174A38','#F1DEAC','#C65B2B']},
 {id:'hawk',teamName:'Les Faucons Voleurs',names:['Faucon','Hawk','Halcón'],colors:['#162C52','#C53345','#E3ECF0']},
 {id:'bison',teamName:'Les Bisons Frappeurs',names:['Bison','Bison','Bisonte'],colors:['#512D5B','#E2AB35','#F4E3BF']},
 {id:'shark',teamName:'Les Requins du Marbre',names:['Requin','Shark','Tiburón'],colors:['#006A73','#F07E68','#BFE5D3']},
 {id:'lynx',teamName:'Les Lynx de Ligne',names:['Lynx','Lynx','Lince'],colors:['#282A32','#F5BE28','#CAD0D8']},
 {id:'fox',teamName:'Les Renards du Butin',names:['Renard','Fox','Zorro'],colors:['#B4412B','#302D58','#F8D5AD']},
 {id:'horse',teamName:'Les Étalons du Circuit',names:['Cheval','Horse','Caballo'],colors:['#2558C5','#F58126','#C4E8F7']},
 {id:'owl',teamName:'Les Hiboux de Relève',names:['Hibou','Owl','Búho'],colors:['#742C48','#99B596','#F1D5D8']},
 {id:'bear',teamName:'Les Ours du Grand Chelem',names:['Ours','Bear','Oso'],colors:['#51372E','#35B7AB','#F6E4BA']},
 {id:'wasp',teamName:'Les Guêpes du Marbre',names:['Guêpe','Wasp','Avispa'],colors:['#453085','#B6D53D','#D9D0F0']}
];
export const logoById=id=>LOGOS.find(x=>x.id===id);
// Separate deterministic random stream: branding never changes players or match outcomes.
export function assignLogos(s,chosen='wolf'){
 if(!logoById(chosen))throw Error('invalid_save');
 let seed=0;for(const c of s.id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const remaining=LOGOS.map(x=>x.id).filter(id=>id!==chosen);
 for(let i=remaining.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=Math.floor(seed/4294967296*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
 for(const tm of s.teams){tm.logo=tm.id===s.user?chosen:remaining.shift();if(tm.id!==s.user)tm.name=logoById(tm.logo).teamName;}
 s.brandVersion=1;
}
export function ensureLogos(s){
 if(s.teams.every(tm=>tm.logo==null))assignLogos(s);
 for(const archive of s.archives)for(const tm of archive.teams)if(tm.logo==null)tm.logo=s.teams.find(t=>t.id===tm.id)?.logo;
 if(!s.brandVersion){for(const tm of s.teams)if(tm.id!==s.user)tm.name=logoById(tm.logo).teamName;s.brandVersion=1;}
 return s;
}
