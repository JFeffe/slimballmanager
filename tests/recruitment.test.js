import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
const fresh=()=>{const s=E.newGame('Club','Coach','free',780);E.autoDraft(s,true);s.day=6;return s;};
test('NPC recruitment improves role coverage, preserves user control, survives import and respects cooldown',()=>{
 const s=fresh(),t=E.npcMarketOrder(s)[0],own=E.clone(E.team(s)),points=s.manager.points;
 for(const id of t.roster)s.players[id].base=Object.fromEntries(E.ATTR.map(k=>[k,1]));
 const id=s.free[0];s.players[id].base=Object.fromEntries(E.ATTR.map(k=>[k,10]));
 const value=E.recruitmentValue(s,t);E.npcRecruitment(s);assert(t.roster.includes(id));assert(E.recruitmentValue(s,t)>value);assert.deepEqual(E.team(s),own);assert.equal(s.manager.points,points);assert(s.log.some(e=>e.key==='npc_sign'));E.validateStructure(s);
 const after=E.clone(t);E.npcRecruitment(s);assert.deepEqual(t,after);
 const restored=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));s.day=12;restored.day=12;E.npcRecruitment(s);E.npcRecruitment(restored);assert.deepEqual(restored,s);
});
test('contenders and rebuilders value age differently, while biographies never consume RNG',()=>{
 const s=fresh(),t=s.teams[1],p=s.players[t.roster[0]];t.w=2;t.l=10;assert.equal(E.npcStrategy(s,t),'rebuild');p.age=19;const young=E.recruitmentValue(s,t);p.age=33;const old=E.recruitmentValue(s,t);assert(young>old);t.w=10;t.l=2;assert.equal(E.npcStrategy(s,t),'contender');const oldC=E.recruitmentValue(s,t);p.age=19;assert(E.recruitmentValue(s,t)-oldC<young-old);
 const before=s.rng,bio=E.biography(p);assert.equal(E.biography(E.clone(p)),bio);assert.equal(s.rng,before);
});
test('playoffs and live matches freeze NPC market; reserved trade players stay put',()=>{
 const s=fresh();s.day=36;const before=E.clone(s);E.npcRecruitment(s);assert.deepEqual(s,before);
 s.day=6;const t=s.teams[1],id=t.roster[0];E.propose(s,t.id,[E.team(s).roster[0]],[id]);E.npcRecruitment(s);assert(t.roster.includes(id));
});
test('season records use archived regular stats and do not count current/history twice',()=>{
 const s=fresh(),p=E.clone(s.players[E.team(s).roster[0]]);p.stats.hr=12;p.playoffStats={hr:99};s.archives=[{season:1,players:{[p.id]:p}}];s.players[p.id].stats.hr=30;const r=E.leagueRecords(s).find(r=>r.key==='hr');assert.equal(r.value,12);assert.equal(r.season,1);
});
test('NPC trade exchanges complementary specialists with gains for both clubs and no manager payment',()=>{
 const s=fresh(),a=s.teams[1],b=s.teams[2];for(const id of s.free)s.players[id].retired=true;s.retired.push(...s.free);s.free=[];
 for(const t of s.teams.filter(t=>![s.user,a.id,b.id].includes(t.id)))t.marketDay=s.day;
 for(const [t,skill] of [[a,'throw'],[b,'catch']])for(const id of t.roster){const p=s.players[id];p.base=Object.fromEntries(E.ATTR.map(k=>[k,k===skill?10:1]));p.age=24;}
 const av=E.recruitmentValue(s,a),bv=E.recruitmentValue(s,b),own=E.clone(E.team(s)),points=s.manager.points;E.npcRecruitment(s);
 assert(s.log.some(e=>e.key==='npc_trade'));assert(E.recruitmentValue(s,a)>av);assert(E.recruitmentValue(s,b)>bv);assert.deepEqual(E.team(s),own);assert.equal(s.manager.points,points);assert.equal(a.roster.length,8);assert.equal(b.roster.length,8);assert.equal(new Set(s.teams.flatMap(t=>t.roster)).size,48);E.validateStructure(s);
});
