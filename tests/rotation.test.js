import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
const fresh=()=>{const s=E.newGame('Rotation','Coach','free',1881);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);return s;};
const restore=s=>decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
test('rotation respects cyclic order, exact energy threshold, highest energy fallback and cyclic ties',()=>{
 const s=fresh(),t=E.team(s),ids=t.roster.slice(0,4);E.setPitchingRotation(s,ids);t.rotation.next=ids[0];
 const energy=values=>ids.forEach((id,i)=>s.players[id].energy=values[i]);
 energy([59,60,100,100]);assert.equal(E.projectedPitcher(s,t),ids[1]);E.autoAlign(s,t);assert.equal(t.positions.P,ids[1]);assert.equal(t.rotation.next,ids[0]);
 energy([12,59,58,40]);assert.equal(E.projectedPitcher(s,t),ids[1]);
 energy([59,10,59,10]);t.rotation.next=ids[2];assert.equal(E.projectedPitcher(s,t),ids[2]);
 energy([100,100,59,59]);assert.equal(E.projectedPitcher(s,t),ids[0]);
});
test('preview and repeated auto lineups never advance; actual completed starter advances exactly once across save/resume',()=>{
 const s=fresh(),t=E.team(s),ids=t.roster.slice(0,3);E.setPitchingRotation(s,ids);t.rotation.next=ids[0];t.auto=true;
 s.players[ids[0]].energy=59;s.players[ids[1]].energy=60;s.players[ids[2]].energy=100;
 const id=E.userMatch(s).id,before=E.clone(s);E.preMatchReport(s,id);E.preMatchReport(s,id);assert.deepEqual(s,before);
 for(let i=0;i<3;i++)E.autoAlign(s,t);assert.equal(t.positions.P,ids[1]);assert.equal(t.rotation.next,ids[0]);
 E.startMatch(s,id);assert.equal(t.rotation.next,ids[0]);assert.throws(()=>E.setPitchingRotation(s,ids),/match_running/);
 E.stepMatch(s);const copy=restore(s);E.simulateMatch(s,id);E.simulateMatch(copy,id);assert.deepEqual(copy,s);assert.equal(t.rotation.next,ids[2]);assert.throws(()=>E.startMatch(s,id),/match_unavailable/);
});
test('other rotation pitchers may field, manual starters remain, and NPCs follow the same rule',()=>{
 const s=fresh(),t=E.team(s),ids=t.roster.slice(0,4);E.setPitchingRotation(s,ids);t.rotation.next=ids[0];
 t.roster.forEach((id,i)=>s.players[id].energy=i<4?100:50);E.autoAlign(s,t);assert(ids.every(id=>t.order.includes(id)));
 E.swap(s,t.positions.P,ids[1]);const manual=t.positions.P;E.startMatch(s,E.userMatch(s).id);assert.equal(t.positions.P,manual);E.simulateMatch(s);assert.equal(t.rotation.next,ids[2]);
 for(const npc of s.teams.slice(1)){assert.equal(npc.rotation.players.length,3);npc.roster.forEach(id=>s.players[id].energy=100);const r=npc.rotation; s.players[r.next].energy=59;const expected=E.projectedPitcher(s,npc);E.autoAlign(s,npc);assert.equal(npc.positions.P,expected);}
});
test('configuration validates ownership and size, keeps next turn, and repairs departures without RNG changes',()=>{
 const s=fresh(),t=E.team(s),ids=t.roster.slice(0,4);E.setPitchingRotation(s,ids);t.rotation.next=ids[1];
 for(const bad of [[ids[0]],[...ids, t.roster[4]],[ids[0],ids[0]],[ids[0],E.team(s,'t1').roster[0]],null])assert.throws(()=>E.setPitchingRotation(s,bad),/invalid_rotation/);
 E.setPitchingRotation(s,[ids[2],ids[1],ids[0]]);assert.equal(t.rotation.next,ids[1]);const rng=s.rng;E.cut(s,ids[1]);assert.equal(t.rotation.players.length,3);assert.equal(t.rotation.next,ids[0]);assert(!t.rotation.players.includes(ids[1]));assert.equal(s.rng,rng);E.validateStructure(restore(s));
});
test('legacy rotations project without mutation and invalid saved rotations are rejected',()=>{
 const s=fresh();for(const t of s.teams)delete t.rotation;const old=E.clone(s),t=E.team(s);const r=E.pitchingRotation(s,t);assert.equal(r.players.length,3);assert.deepEqual(s,old);assert.deepEqual(restore(s),s);E.autoAlign(s,t);assert.deepEqual(t.rotation,r);
 for(const rotation of [{players:[t.roster[0]],next:t.roster[0]},{players:[t.roster[0],t.roster[0]],next:t.roster[0]},{players:t.roster.slice(0,2),next:'bad'}]){const bad=E.clone(s);E.team(bad).rotation=rotation;assert.throws(()=>restore(bad),/invalid_save/);}
});
test('choosing next pitcher updates manual defense, respects fatigue and survives saves',()=>{
 const s=fresh(),t=E.team(s);t.auto=false;const ids=t.roster.slice(0,3);E.setPitchingRotation(s,ids);E.setNextPitcher(s,ids[1]);assert.equal(t.rotation.next,ids[1]);assert.equal(t.positions.P,ids[1]);assert.equal(t.auto,false);assert.equal(new Set(Object.values(t.positions)).size,6);
 s.players[ids[1]].energy=59;E.setNextPitcher(s,ids[1]);assert.equal(t.positions.P,ids[2]);assert.equal(t.rotation.next,ids[1]);assert.deepEqual(E.team(restore(s)).positions,t.positions);assert.throws(()=>E.setNextPitcher(s,'wrong'),/invalid_rotation/);
});
test('preferences solve conflicts, reduce bench usage and never displace more rested players',()=>{
 const s=fresh(),t=E.team(s);E.autoAlign(s,t);const pitcher=t.positions.P,ids=t.roster.filter(id=>id!==pitcher),a=ids[0],b=ids[1],bench=ids[2];
 E.setPositionPreferences(s,a,['GO','FO']);E.setPositionPreferences(s,b,['FO','GO']);E.setPositionPreferences(s,bench,['Bench','C']);E.autoAlign(s,t);
 assert.equal(t.positions.GO,a);assert.equal(t.positions.FO,b);assert(!t.order.includes(bench));
 t.roster.forEach(id=>s.players[id].energy=id===bench||id===pitcher?100:59);E.autoAlign(s,t);assert(t.order.includes(bench));
 assert.deepEqual(E.team(restore(s)).positionPreferences,t.positionPreferences);
 assert.throws(()=>E.setPositionPreferences(s,a,['GO','GO']),/invalid_preferences/);assert.throws(()=>E.setPositionPreferences(s,a,['C','Bench']),/invalid_preferences/);assert.throws(()=>E.setPositionPreferences(s,E.team(s,'t1').roster[0],['P','C']),/invalid_preferences/);
});
