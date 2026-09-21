// Simulation variants only; production error mechanics and statistics stay unchanged.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),source=execFileSync('git',['show','5f4c6cfaf199333322b9b1405c278ba1e453f18e:dist/engine.js'],{cwd:root,encoding:'utf8'}),temp=await fs.mkdtemp(path.join(os.tmpdir(),'fielding-'));
const variants={current:'slim(s,1,ed)&&slim(s,1,ed)',moderate:'rng(s)<Math.max(.006,1.5/(1+ed)**2)',linear:'rng(s)<Math.max(.006,Math.min(.045,.045-.0022*(ed-2)))'};
const result={protocol:{revision:'5f4c6cfaf199333322b9b1405c278ba1e453f18e',seeds:30,gamesPerRegularSeason:99,variants,firstSeason:true},rows:[],mature:[]};
function measure(E,s,variant,seed,season){
 const ps=s.teams.flatMap(t=>E.roster(s,t)),all=Object.values(s.players),sum=k=>all.reduce((n,p)=>n+p.stats[k],0),qualified=ps.filter(p=>p.stats.balls>=10);
 const errors=sum('errors'),balls=sum('balls'),outs=sum('catchOuts')+sum('throwOuts'),realChance=p=>p.stats.catchOuts+p.stats.throwOuts+p.stats.errors;
 return {variant,seed,season,errors,balls,outs,games:99,runs:sum('runs'),ab:sum('ab'),hits:sum('hits'),qualified:qualified.length,perfect:qualified.filter(p=>p.stats.errors===0).length,tenPerfect:E.leaderboard(s,'def').filter(p=>p.stats.errors===0).length,players:ps.map(p=>({id:p.id,balls:p.stats.balls,errors:p.stats.errors,outs:p.stats.catchOuts+p.stats.throwOuts,catch:p.base.catch,speed:p.base.speed})),thresholds:[10,20,30,50].map(n=>{const old=ps.filter(p=>p.stats.balls>=n),conventional=ps.filter(p=>realChance(p)>=n);return {n,oldN:old.length,oldPerfect:old.filter(p=>!p.stats.errors).length,newN:conventional.length,newPerfect:conventional.filter(p=>!p.stats.errors).length};})};
}
for(const [variant,condition] of Object.entries(variants)){
 assert(source.includes(variants.current));
 const code=source.replace(variants.current,condition).replace(/from '(\.\/[^']+)'/g,(_,rel)=>`from '${pathToFileURL(path.resolve(root,'dist',rel)).href}'`),file=path.join(temp,variant+'.mjs');await fs.writeFile(file,code);const E=await import(pathToFileURL(file));
 for(let seed=50010;seed<50040;seed++){
  const s=E.newGame('Test','Coach','free',seed);E.autoDraft(s,true);E.team(s).auto=true;
  while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
  E.validateStructure(s);assert.deepEqual(E.auditStats(s),[]);result.rows.push(measure(E,s,variant,seed,1));
 }
 for(let seed=50050;seed<50053;seed++){
  const s=E.newGame('Test','Coach','free',seed);
  for(let year=1;year<=8;year++){
   E.autoDraft(s,true);E.team(s).auto=true;while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
   E.validateStructure(s);assert.deepEqual(E.auditStats(s),[]);
   if(year>=6)result.mature.push(measure(E,s,variant,seed,year));
   E.advanceOffseason(s);while(s.offseason)E.advanceOffseason(s);
  }
 }
 console.log('Completed',variant);await fs.writeFile(path.join(root,'reports/fielding-experiment.json'),JSON.stringify(result,null,2));
}
await fs.rm(temp,{recursive:true,force:true});
for(const [group,rows] of [['first',result.rows],['mature',result.mature]])for(const variant of Object.keys(variants)){
 const rs=rows.filter(r=>r.variant===variant),sum=k=>rs.reduce((n,r)=>n+r[k],0),n=rs.length;
 console.log(JSON.stringify({group,variant,n,errorsPerGame:sum('errors')/sum('games'),oldPct:100*(1-sum('errors')/sum('balls')),conventionalPct:100*sum('outs')/(sum('outs')+sum('errors')),perfectPercent:100*sum('perfect')/sum('qualified'),perfectTop10:sum('tenPerfect')/n,runsPerTeamGame:sum('runs')/(sum('games')*2),avg:sum('hits')/sum('ab')}));
}
