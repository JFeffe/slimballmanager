import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const E=await import(pathToFileURL(process.argv[2])),out=process.argv[3],years=Number(process.argv[4]||15),rows=[],mean=a=>a.reduce((n,x)=>n+x,0)/(a.length||1);
for(let seed=92600;seed<92603;seed++){
 const s=E.newGame('Control','Coach','free',seed);
 for(let season=1;season<=years;season++){
  E.autoDraft(s,true);E.team(s).auto=true;
  while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
  E.validateStructure(s);if(E.auditStats(s).length)throw Error(E.auditStats(s));
  const ps=s.teams.flatMap(t=>E.roster(s,t)),free=s.free.map(id=>s.players[id]);
  const row={seed,season,free:free.length,talent:mean(ps.map(E.total)),freeTalent:mean(free.map(E.total)),freeNeverPlayed:free.filter(p=>!p.stats.ab&&!p.stats.bf&&!p.history.some(h=>h.stats.ab||h.stats.bf)).length,winner:s.playoffs.winner,rosterAge:mean(ps.map(p=>p.age))};
  E.advanceOffseason(s);row.retired=s.summary.retirements.length;row.retiredFree=s.summary.retirements.filter(id=>s.players[id].journal.some(e=>e.key==='retired_free'&&e.season===season)).length;
  row.growth=mean(s.summary.changes.filter(c=>ps.some(p=>p.id===c.id)).map(c=>Object.values(c.delta).reduce((n,v)=>n+v,0)));
  while(s.offseason)E.advanceOffseason(s);E.validateStructure(s);rows.push(row);
 }
 console.log('Completed seed',seed);
}
await writeFile(out,JSON.stringify({protocol:{seeds:[92600,92601,92602],years,user:'auto draft and lineup; no user market',gamesPerSeason:99},rows},null,2)+'\n');
