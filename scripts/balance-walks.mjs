// Compare full seasons with the same seeds. Source module is an absolute path.
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const E=await import(pathToFileURL(process.argv[2])),out=process.argv[3];
const rows=[];
for(let seed=92500;seed<92503;seed++){
 const s=E.newGame('Control','Coach','free',seed);
 for(let season=1;season<=10;season++){
  E.autoDraft(s,true);E.team(s).auto=true;
  while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
  E.validateStructure(s);if(E.auditStats(s).length)throw Error(E.auditStats(s));
  const ps=Object.values(s.players).filter(p=>!p.retired),sum=k=>ps.reduce((n,p)=>n+p.stats[k],0);
  rows.push({seed,season,games:99,pa:sum('ab')+sum('bb'),ab:sum('ab'),hits:sum('hits'),bb:sum('bb'),so:sum('so'),hr:sum('hr'),runs:sum('runs'),winner:s.playoffs.winner});
  while(s.offseason)E.advanceOffseason(s);
 }
 console.log('Completed seed',seed);
}
await writeFile(out,JSON.stringify({protocol:{seeds:[92500,92501,92502],seasons:10,user:'auto draft and lineup; no user market',regularStatsOnly:true},rows},null,2)+'\n');
