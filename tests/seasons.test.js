import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
const encode=s=>JSON.stringify({format:'SlimballManager',version:1,state:s});
const winter=seed=>{const s=E.newGame('Test','Coach','free',seed);E.autoDraft(s,true);while(s.day<36){E.simulateDay(s);E.nextDay(s);}return s;};
test('winter bracket seeds top four, preserves regular stats and resumes an exact playoff game',()=>{
 let s=winter(901);const seeds=E.standings(s).map(t=>t.id);assert.deepEqual(s.playoffs.series.map(x=>x.teams),[[seeds[0],seeds[3]],[seeds[1],seeds[2]]]);assert.equal(s.summary,null);
 const stats=Object.fromEntries(Object.entries(s.players).map(([id,p])=>[id,E.clone(p.stats)])),standings=E.clone(s.teams.map(t=>[t.w,t.l,t.runs]));
 assert.equal(E.todayMatches(s).length,0);E.nextDay(s);const m=E.todayMatches(s)[0];E.startMatch(s,m.id);for(let i=0;i<12;i++)E.stepMatch(s);E.validateStructure(s);const resumed=decode(encode(s));E.simulateMatch(s,m.id);E.simulateMatch(resumed,m.id);assert.deepEqual(s,resumed);
 while(s.day<47){E.simulateDay(s);E.nextDay(s);E.validateStructure(s);}
 assert.deepEqual(Object.fromEntries(Object.entries(s.players).map(([id,p])=>[id,p.stats])),stats);assert.deepEqual(s.teams.map(t=>[t.w,t.l,t.runs]),standings);
 assert(s.playoffs.winner);assert.equal(s.playoffs.series.at(-1).target,3);assert.equal(s.summary.winner,E.team(s,s.playoffs.winner).name);
 assert(s.schedule.filter(m=>m.playoff).length>=7);assert(s.schedule.filter(m=>m.playoff).length<=11);assert(s.schedule.filter(m=>m.playoff).every(m=>m.day>=36&&m.day<=46));
 const archived=E.clone(s.archives[0]),snapshot=decode(encode(s));assert.equal(snapshot.offseason.stage,'awards');assert.throws(()=>E.nextDay(s),/offseason_required/);
 E.advanceOffseason(s);assert.equal(s.offseason.stage,'development');const history=Object.values(s.players).reduce((n,p)=>n+p.history.length,0);E.validateStructure(s);
 assert(s.rookies.length===24);const rookieIds=[...s.rookies];
 assert.equal(Object.values(s.players).reduce((n,p)=>n+p.history.length,0),history);
 const preserved=E.clone(s.archives[0]);preserved.awards=preserved.awards.filter(a=>a.type!=='award_progress');preserved.leagueNews=preserved.leagueNews.filter(e=>e.args?.prize!=='award_progress');for(const [id,p] of Object.entries(preserved.players)){if(!archived.players[id]){delete preserved.players[id];continue;}p.awards=p.awards.filter(a=>a.type!=='award_progress');p.journal=p.journal.filter(e=>e.args?.prize!=='award_progress');}assert.deepEqual(preserved,archived);E.advanceOffseason(s);assert.equal(s.season,2);assert.equal(s.day,0);assert.equal(s.draft.kind,'annual');assert.deepEqual(s.rookies,rookieIds);assert.equal(s.draft.order[0],seeds.at(-1));assert.equal(s.playoffs,null);E.validateStructure(s);assert.deepEqual(decode(encode(s)),s);
});
test('tampered playoff wins, unqualified finalists and invalid offseason steps are rejected on import',()=>{
 const s=winter(902);for(const corrupt of [x=>x.playoffs.series[0].wins=[2,0],x=>x.playoffs.series[0].teams[0]=x.playoffs.seeds[5],x=>x.offseason={stage:'ready'},x=>x.schedule.at(-1).day=35]){const x=E.clone(s);corrupt(x);assert.throws(()=>decode(encode(x)),/invalid_save/);}
});
test('auto alignment benches lower energy players for user and NPC teams; manual lineup stays fixed',()=>{
 const s=E.newGame('Test','Coach','free',903);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);
 for(const tm of s.teams){tm.auto=true;tm.rotation={players:tm.roster.slice(3,6),next:tm.roster[3]};tm.roster.forEach((id,i)=>{s.players[id].energy=[15,55,56,72,80,90,100,100][i];});E.autoAlign(s,tm);assert(!tm.order.includes(tm.roster[0]));assert(!tm.order.includes(tm.roster[1]));assert.deepEqual(Object.values(tm.positions).sort(),[...tm.order].sort());}
 const m=E.userMatch(s),own=E.team(s);own.auto=false;E.swap(s,own.order[0],own.roster[0]);const manual=[...own.order];E.startMatch(s,m.id);assert.deepEqual(own.order,manual);const opponent=E.team(s,m.away===s.user?m.home:m.away);assert(!opponent.order.includes(opponent.roster[0]));
 E.simulateMatch(s,m.id);assert.equal(s.players[opponent.roster[0]].energy,100);E.autoAlign(s,opponent);assert(opponent.order.includes(opponent.roster[0]));
});
test('legacy rotation initializes with the best thrower even when total talent is lower',()=>{
 const s=E.newGame('Test','Coach','free',904);E.autoDraft(s,true);const tm=E.team(s);for(const id of tm.roster){const p=s.players[id];p.energy=100;p.base=Object.fromEntries(E.ATTR.map(k=>[k,7]));}const specialist=s.players[tm.roster[7]];specialist.base=Object.fromEntries(E.ATTR.map(k=>[k,k==='throw'?10:1]));delete tm.rotation;E.autoAlign(s,tm);assert.equal(tm.positions.P,specialist.id);
});
test('old completed seasons keep their archives and adopt the new calendar next year',()=>{
 const s=winter(905);while(s.day<47){E.simulateDay(s);E.nextDay(s);}E.advanceOffseason(s);
 s.calendarVersion=undefined;s.playoffs=null;s.offseason=null;s.schedule=s.schedule.filter(m=>!m.playoff);s.day=46;const archive=E.clone(s.archives);E.ensureSeason(s);assert.equal(s.calendarVersion,undefined);E.nextDay(s);E.nextDay(s);assert.equal(s.calendarVersion,2);assert.equal(s.season,2);assert.deepEqual(s.archives,archive);
});
