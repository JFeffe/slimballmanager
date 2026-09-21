import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';

test('fielding percentage excludes hits and includes catching outs, throwing outs and errors',()=>{
 const p={stats:{...E.blankStats(),balls:100,catchOuts:30,throwOuts:18,errors:2}};
 assert.equal(E.fieldingChances(p),50);assert.equal(E.stats(p).def,.96);
 p.stats.balls=150;assert.equal(E.stats(p).def,.96);
 p.stats={...E.blankStats(),balls:10};assert.equal(E.stats(p).def,null);
 p.stats.errors=2;assert.equal(E.stats(p).def,0);
 p.stats={...E.blankStats(),balls:100,throwOuts:10};assert.equal(E.stats(p).def,1);
});
test('leader qualification uses real fielding chances rather than hits directed at a player',()=>{
 const s=E.newGame('Test','Coach','free',230);E.autoDraft(s,true);const [a,b]=E.team(s).roster.map(id=>s.players[id]);
 a.stats.balls=100;a.stats.catchOuts=9;
 b.stats.balls=10;b.stats.throwOuts=9;b.stats.errors=1;
 assert.deepEqual(E.leaderboard(s,'def').map(p=>p.id),[b.id]);
});
test('the single-roll error odds exactly match the approved moderate model',()=>{
 for(let ed=2;ed<=20;ed++){
  const [a,b]=E.fieldingErrorCheck(ed);assert(Number.isInteger(a)&&Number.isInteger(b));
  assert.equal(a/(a+b),Math.max(.006,1.5/(1+ed)**2));
 }
 assert.deepEqual(E.fieldingErrorCheck(20),[3,497]);
 assert(E.fieldingErrorCheck(8)[0]/E.fieldingErrorCheck(8).reduce((a,b)=>a+b)>3/338);
});
test('a complete season reproduces approved moderate match totals and survives save/reload',()=>{
 const expected=JSON.parse(fs.readFileSync(new URL('../reports/fielding-experiment.json',import.meta.url))).rows.find(r=>r.variant==='moderate'&&r.seed===50010);
 const s=E.newGame('Test','Coach','free',50010);E.autoDraft(s,true);E.team(s).auto=true;
 while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
 for(const k of ['errors','balls','runs','ab','hits'])assert.equal(Object.values(s.players).reduce((n,p)=>n+p.stats[k],0),expected[k],k);
 assert.deepEqual(E.auditStats(s),[]);E.validateStructure(s);
 const loaded=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
 assert.deepEqual(loaded.archives[0].players,s.archives[0].players);
 const checks=s.schedule.flatMap(m=>m.result?.events||[]).flatMap(e=>e.checks||[]).filter(c=>c[0]==='E');
 assert(checks.length>0);assert(checks.every(c=>c[1]===3&&Number.isInteger(c[2])));
});
