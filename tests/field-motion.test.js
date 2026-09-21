import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {runnerTransitions,replayLineup} from '../dist/presentation.js';
const r=id=>({id}),ev=(type,bases,runs=0)=>({inning:1,half:0,batterId:'b',type,bases,runs});
test('walk animation moves only forced runners, including a bases-loaded score',()=>{
 const before=ev('1B',[r('a'),null,r('c')]);
 assert.deepEqual(runnerTransitions(before,ev('BB',[r('b'),r('a'),r('c')])),[{id:'a',from:1,to:2,scored:false},{id:'b',from:0,to:1,scored:false}]);
 const full=ev('1B',[r('a'),r('c'),r('d')]);
 const routes=runnerTransitions(full,ev('BB',[r('b'),r('a'),r('c')],1));assert.equal(routes.find(x=>x.id==='d').to,4);assert.equal(routes.filter(x=>x.scored).length,1);
});
test('single, double, triple, error and home-run paths match engine advancement',()=>{
 for(const type of ['1B','2B','3B','E','HR'])for(let mask=0;mask<8;mask++){
  const bases=[0,1,2].map(i=>mask&(1<<i)?r('r'+i):null),before=ev('1B',structuredClone(bases)),live={bases:structuredClone(bases)};
  const scored=E.advanceBases(live,type,'b');const routes=runnerTransitions(before,ev(type,live.bases,scored.length));
  assert.equal(routes.filter(x=>x.scored).length,scored.length);
  for(const route of routes)assert(route.to>route.from&&route.to<=4);
 }
});
test('outs do not invent runner movement and a new half starts from empty bases',()=>{
 for(const type of ['K','C','T'])assert.deepEqual(runnerTransitions(ev('1B',[r('a'),r('c'),r('d')]),ev(type,[null,null,null])),[]);
 const before={...ev('1B',[r('a'),r('c'),r('d')]),half:1};assert.deepEqual(runnerTransitions(before,ev('1B',[r('b'),null,null])),[{id:'b',from:0,to:1,scored:false}]);
});
test('finished full replay preserves defensive positions despite later lineup changes',()=>{
 const s=E.newGame('Club','Coach','free',323);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);const m=E.userMatch(s);E.startMatch(s,m.id);const saved=structuredClone(s.live.lineups);E.simulateMatch(s,m.id);
 const result=s.schedule.find(x=>x.id===m.id).result;assert.deepEqual(result.lineups,saved);
 const tm=E.team(s);[tm.positions.P,tm.positions.C]=[tm.positions.C,tm.positions.P];assert.deepEqual(replayLineup(result,tm).positions,saved.find(x=>x.id===tm.id).positions);
 const old=structuredClone(result);delete old.lineups;assert.deepEqual(replayLineup(old,tm).positions,saved.find(x=>x.id===tm.id).positions);E.validate(s);
});
test('personalized action art carries each face and actual club kit in all six poses',()=>{
 for(const face of ['p01','p04','p23','p42','p60'])for(const logo of E.LOGOS)for(const pose of ['bat','pitch','catch','run','swing','throw']){
  const svg=E.actionSvg(face,logo.id,pose);assert(svg.includes(`data-athlete-face="${face}"`));assert(svg.includes(`data-athlete-kit="${logo.id}"`));assert(svg.includes(`data-pose="${pose}"`));assert(svg.includes('action-bodies.png'));assert(!svg.includes('undefined'));assert(!svg.includes('NaN'));
 }
});
