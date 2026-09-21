// Reproducible full-match soak test. The user club auto-drafts/aligns but never
// accepts offers or signs free agents; report it separately from autonomous NPCs.
import * as E from '../dist/engine.js';
import {writeFile} from 'node:fs/promises';
const count=Number(process.argv[2]||12),years=Number(process.argv[3]||10),out=process.argv[4]||'/tmp/slimball-balance.json';
const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:0;
const report={protocol:{count,years,seeds:Array.from({length:count},(_,i)=>91200+i),user:'auto draft + auto lineup, no market decisions',matches:'all regular season and playoff games; no fabricated results'},runs:[]};
for(const seed of report.protocol.seeds){
 const s=E.newGame('Control','Coach','free',seed),run={seed,seasons:[]};let streak=0,last=null;
 for(let season=1;season<=years;season++){
  E.autoDraft(s,true);E.team(s).auto=true;const original=new Set(s.teams.flatMap(t=>t.roster));let moves={npc_sign:0,npc_release:0,npc_trade:0};
  while(!s.offseason){const seen=new Set(s.log);E.simulateDay(s);E.nextDay(s);for(const e of s.log)if(!seen.has(e)&&e.key in moves)moves[e.key]++;}
  E.validateStructure(s);const ps=s.teams.flatMap(t=>E.roster(s,t)),np=s.teams.filter(t=>t.id!==s.user),winner=s.playoffs.winner;streak=winner===last?streak+1:1;last=winner;
  const row={season,winner,streak,activeTalent:mean(ps.map(E.total)),activeAge:mean(ps.map(p=>p.age)),activeUnder24:ps.filter(p=>p.age<24).length,activeOver34:ps.filter(p=>p.age>34).length,activeMaxTalent:Math.max(...ps.map(E.total)),freeCount:s.free.length,freeTalent:mean(s.free.map(id=>E.total(s.players[id]))),npcWinSpread:Math.max(...np.map(t=>t.w))-Math.min(...np.map(t=>t.w)),teams:s.teams.map(t=>({id:t.id,w:t.w,talent:mean(E.roster(s,t).map(E.total)),age:mean(E.roster(s,t).map(p=>p.age))})),turnover:ps.filter(p=>!original.has(p.id)).length,moves};
  E.advanceOffseason(s);row.retirements=s.summary.retirements.length;row.development=mean(s.summary.changes.map(c=>Object.values(c.delta).reduce((a,b)=>a+b,0)));
  E.advanceOffseason(s);row.rookieCount=s.rookies.length;row.rookieTalent=mean(s.rookies.map(id=>E.total(s.players[id])));E.advanceOffseason(s);E.advanceOffseason(s);E.validateStructure(s);run.seasons.push(row);
 }
 run.uniqueChampions=new Set(run.seasons.map(r=>r.winner)).size;report.runs.push(run);console.log(`seed ${seed}: ${years} seasons, ${run.uniqueChampions} champions, ${run.seasons.at(-1).freeCount} free agents`);
}
report.summary={uniqueChampions:mean(report.runs.map(r=>r.uniqueChampions)),maxStreak:Math.max(...report.runs.flatMap(r=>r.seasons.map(s=>s.streak))),bySeason:Array.from({length:years},(_,i)=>{const rows=report.runs.map(r=>r.seasons[i]);return Object.fromEntries(['season','activeTalent','activeAge','activeUnder24','activeOver34','freeCount','freeTalent','npcWinSpread','turnover','retirements','development','rookieTalent'].map(k=>[k,mean(rows.map(r=>r[k]))]));}),npcWins:Object.fromEntries(['t1','t2','t3','t4','t5'].map(id=>[id,mean(report.runs.flatMap(r=>r.seasons.map(s=>s.teams.find(t=>t.id===id).w)))]))};
await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
