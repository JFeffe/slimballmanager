import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
import * as M from '../dist/multiplayer.js';
const restore=s=>decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
test('autumn scouting preserves the exact rookie class through two offseason stages and save reload',()=>{
 let s=E.newGame('Test','Coach','free',811);E.autoDraft(s,true);
 while(s.day<24){E.simulateDay(s);E.nextDay(s);}assert.equal(s.rookies.length,24);
 const ids=[...s.rookies],skills=ids.map(id=>E.clone(s.players[id].base));s=restore(s);
 while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
 assert.deepEqual(s.rookies,ids);assert.equal(s.offseason.stage,'awards');
 E.advanceOffseason(s);assert.equal(s.offseason.stage,'development');
 assert.deepEqual(s.rookies.map(id=>s.players[id].base),skills);s=restore(s);
 E.advanceOffseason(s);assert.equal(s.season,2);assert.equal(s.offseason,null);assert.equal(s.draft.kind,'annual');assert.deepEqual(s.rookies,ids);E.validateStructure(s);
 assert.throws(()=>E.advanceOffseason(s),/offseason_required/);
});
test('playoff games are consecutive with full rest days before semis, final, and deciding game five',()=>{
 let sawFive=false;
 for(let seed=1;seed<=12;seed++){
  const s=E.newGame('Test','Coach','free',seed);E.autoDraft(s,true);
  while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
  assert.equal(s.schedule.filter(m=>!m.playoff).at(-1).day,35);
  for(const series of s.playoffs.series.slice(0,2))assert.deepEqual(series.games.map(id=>s.schedule.find(m=>m.id===id).day),Array.from({length:series.games.length},(_,i)=>37+i));
  const semiEnd=Math.max(...s.schedule.filter(m=>m.playoff&&m.playoff!=='final').map(m=>m.day));
  const days=s.schedule.filter(m=>m.playoff==='final').map(m=>m.day);
  assert.equal(days[0],semiEnd+2);for(let i=1;i<days.length;i++)assert.equal(days[i]-days[i-1],i===4?2:1);
  E.validateStructure(restore(s));if(days.length===5)sawFive=true;
 }
 assert(sawFive,'covers at least one deciding fifth game');
});
test('award podiums retain ranked candidates and exact season snapshots across development',()=>{
 const s=E.newGame('Test','Coach','free',811);E.autoDraft(s,true);while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
 const a=s.archives[0],awards=E.clone(a.awards);
 for(const prize of awards){assert.equal(prize.podium[0].id,prize.id);assert.equal(prize.podium[0].score,prize.score);assert.equal(new Set(prize.podium.map(p=>p.id)).size,prize.podium.length);prize.podium.forEach((p,i)=>{assert.equal(p.rank,i+1);assert(a.players[p.id]);if(i)assert(prize.podium[i-1].score>=p.score);});}
 const snapshots=E.clone(a.players);E.advanceOffseason(s);for(const [id,p] of Object.entries(snapshots)){assert.deepEqual(a.players[id].stats,p.stats);assert.deepEqual(a.players[id].base,p.base);}assert.deepEqual(restore(s).archives[0].awards.filter(a=>a.type!=='award_progress'),awards);
});
test('online consecutive snake turns reject a second command for the previous pick index',()=>{
 let s=M.createLeague('Test','Coach','wolf',92);const presence=['t0'];s=M.command(s,'t0',{id:'launch',type:'launch'},presence);
 const index=s.draft.index;s=M.command(s,'t0',{id:'pick-a',type:'draft',args:{auto:true,index}},presence);
 const snapshot=E.clone(s);assert.throws(()=>M.command(s,'t0',{id:'pick-b',type:'draft',args:{auto:true,index}},presence),/déjà/);assert.deepEqual(s,snapshot);
});
