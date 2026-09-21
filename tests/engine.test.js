import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
const fresh=(seed=42)=>E.newGame('Loups','Test','free',seed);
const ready=s=>{E.autoDraft(s,true);while(s.day<3)E.nextDay(s);};
const encoded=s=>JSON.stringify({format:'SlimballManager',version:1,state:s});
test('six empty rosters start a 48-pick snake draft and keep the 33-game calendar',()=>{
 let s=fresh();assert.equal(s.free.length,0);assert.equal(s.rookies.length,60);assert.equal(s.draft.kind,'initial');
 const first=s.draft.order.slice(0,6);assert.equal(new Set(first).size,6);
 for(let r=0;r<8;r++)assert.deepEqual(s.draft.order.slice(r*6,r*6+6),r%2?[...first].reverse():first);
 for(let t of s.teams){assert.equal(t.roster.length,0);assert.equal(s.schedule.filter(m=>m.away===t.id||m.home===t.id).length,33);for(let d=3;d<=35;d++)assert.equal(s.schedule.filter(m=>m.day===d&&(m.away===t.id||m.home===t.id)).length,1);}
 assert(Object.values(s.players).every(p=>p.age>=21&&p.age<=30));E.autoDraft(s,true);
 assert.equal(s.lastDraft.length,48);assert.equal(s.draft,null);assert.equal(s.free.length,12);assert.equal(s.rookies.length,0);
 assert(s.teams.every(t=>t.roster.length===8&&t.order.length===6));E.validate(s);E.validateStructure(s);
});
test('forced walks preserve an unforced runner and load/empty bases correctly',()=>{let l={bases:[null,null,{id:'c',unearned:false}]};assert.deepEqual(E.advanceBases(l,'BB','a'),[]);assert.equal(l.bases[2].id,'c');E.advanceBases(l,'BB','b');assert.deepEqual(l.bases.map(x=>x?.id),['b','a','c']);assert.equal(E.advanceBases(l,'BB','d')[0].id,'c');assert.equal(E.advanceBases(l,'HR','e').length,4);assert.deepEqual(l.bases,[null,null,null]);});
test('mid-game export/import resumes the exact RNG, stats, score and result',()=>{let s=fresh();ready(s);let id=E.userMatch(s).id;E.startMatch(s,id);for(let i=0;i<13;i++)E.stepMatch(s);let restored=decode(encoded(s));E.simulateMatch(s,id);E.simulateMatch(restored,id);assert.deepEqual(restored,s);assert.throws(()=>E.startMatch(s,id),/match_unavailable/);assert.equal(E.team(s).w+E.team(s).l,1);E.validateStructure(s);});
test('manual lineups persist; active and bench swaps keep batting and defense consistent',()=>{let s=fresh();ready(s);const t=E.team(s),a=t.order[0],b=t.order[1];E.swap(s,a,b,'offense');let order=[...t.order];E.startMatch(s,E.userMatch(s).id);assert.deepEqual(t.order,order);assert.throws(()=>E.cut(s,a),/match_running/);E.simulateMatch(s);let bench=t.roster.find(id=>!t.order.includes(id)),pos=E.position(t,a);E.swap(s,a,bench);assert.equal(t.positions[pos],bench);assert(t.order.includes(bench));assert(!t.order.includes(a));E.validate(s);});
test('fatigue uses both thresholds and never lowers a skill below one',()=>{let s=fresh(),p=s.players[s.rookies[0]];p.base.throw=1;for(let [energy,penalty] of [[30,0],[29,1],[10,1],[9,2],[0,2]]){p.energy=energy;assert.equal(E.penalty(p),penalty);assert.equal(E.eff(p,'throw'),1);}});
test('trade responses are delayed and acceptance moves players and points once',()=>{let s=fresh();E.autoDraft(s,true);let from=E.team(s),to=E.team(s,'t1');let a=from.roster[0],b=to.roster[0];s.players[a].base=E.clone(s.players[b].base);s.players[a].age=s.players[b].age;let tr=E.propose(s,to.id,[a],[b],300,0);assert.throws(()=>E.acceptTrade(s,tr.id),/invalid_trade/);E.nextDay(s);assert.equal(tr.status,'pending');E.nextDay(s);assert.equal(tr.status,'accepted');E.acceptTrade(s,tr.id);assert(from.roster.includes(b));assert(to.roster.includes(a));assert.equal(s.manager.points,700);assert.throws(()=>E.acceptTrade(s,tr.id),/invalid_trade/);E.validateStructure(s);});
test('stale trades close safely, minimum roster enforced, released players remain available',()=>{let s=fresh();E.autoDraft(s,true);let tm=E.team(s),to=E.team(s,'t1'),id=tm.roster[0];let tr=E.propose(s,to.id,[id],[to.roster[0]],0,0);E.cut(s,id);assert(s.free.includes(id));E.processTrades(s);assert.equal(s.tradeHistory.find(x=>x.id===tr.id).status,'stale');E.cut(s,tm.roster[0]);assert.equal(tm.roster.length,6);assert.throws(()=>E.cut(s,tm.roster[0]),/minimum_six/);E.validate(s);});
test('ten full seasons preserve results, scores, archived stats and valid rosters',()=>{let s=fresh(2026);for(let season=1;season<=10;season++){E.autoDraft(s,true);for(let d=0;d<48;d++){E.simulateDay(s);if(d===35){assert.equal(s.teams.reduce((n,t)=>n+t.w,0),99);for(let t of s.teams)assert.equal(t.w+t.l,33);let all=Object.values(s.players).filter(p=>!p.retired);let sum=k=>all.reduce((n,p)=>n+p.stats[k],0);assert.equal(sum('hits'),sum('hitsAllowed'));assert.equal(sum('so'),sum('pitchSO'));assert.equal(sum('bb'),sum('pitchBB'));assert.equal(sum('runs'),sum('allowed'));assert.equal(s.teams.reduce((n,t)=>n+t.runs,0),sum('runs'));}if(s.offseason){while(s.offseason)E.advanceOffseason(s);}else E.nextDay(s);E.validate(s);}assert.equal(s.archives.length,season);assert.equal(s.season,season+1);assert(s.teams.every(t=>t.w===0&&t.l===0));assert.equal(s.archives[season-1].teams.reduce((n,t)=>n+t.w,0),99);assert.equal(s.draft.order[0],E.standings(s.archives.at(-1)).at(-1).id);E.validateStructure(s);}assert.equal(decode(encoded(s)).season,11);assert(JSON.stringify(s).length<12000000); /* Includes permanent individual box scores for all 990 games. */});
test('career title belongs to the playoff winner and can continue as an open league',()=>{let s=fresh();ready(s);while(s.day<46){E.simulateDay(s);E.nextDay(s);}E.simulateDay(s);assert(s.playoffs.winner);s.user=s.playoffs.winner;s.mode='career';E.nextDay(s);assert.equal(s.careerResult,'won');assert.throws(()=>E.nextDay(s),/career_ended/);s.mode='free';s.careerResult=null;while(s.offseason)E.advanceOffseason(s);assert.equal(s.season,2);assert(s.draft);});
test('import rejects malformed JSON, incomplete live matches and broken ownership',()=>{let s=fresh();assert.throws(()=>decode('{}'),/invalid_save/);assert.throws(()=>decode('nope'),/invalid_save/);let broken=E.clone(s);broken.teams[0].roster[0]=broken.teams[1].roster[0];assert.throws(()=>decode(encoded(broken)),/invalid_save/);broken=E.clone(s);broken.players.p1.history=[{}];assert.throws(()=>decode(encoded(broken)),/invalid_save/);ready(s);E.startMatch(s,E.userMatch(s).id);s.live.indices=[99,0];assert.throws(()=>decode(encoded(s)),/invalid_save/);});
test('individual game statistics reconcile with score and events and survive compaction and import',()=>{
 const s=fresh(93);ready(s);const id=E.userMatch(s).id;E.startMatch(s,id);const baseline=E.clone(s.live.statStart);E.simulateMatch(s,id);const r=s.schedule.find(m=>m.id===id).result;
 for(const [i,tm] of r.gameStats.entries()){
   const sum=k=>tm.players.reduce((n,p)=>n+p.stats[k],0);
   assert.equal(sum('runs'),r.score[i]);assert.equal(sum('hits'),r.events.filter(e=>e.half===i&&['1B','2B','3B','HR'].includes(e.type)).length);
   assert.equal(sum('ab')+sum('bb'),r.events.filter(e=>e.half===i).length);
   for(const p of tm.players)for(const k of Object.keys(E.blankStats()))assert.equal(p.stats[k],s.players[p.id].stats[k]-baseline[p.id][k]);
 }
 const stored=E.clone(r.gameStats);assert.deepEqual(E.compactResult(r).gameStats,stored);E.simulateDay(s);E.nextDay(s);E.simulateMatch(s,E.userMatch(s).id);assert.deepEqual(s.schedule.find(m=>m.id===id).result.gameStats,stored);assert.deepEqual(decode(encoded(s)).schedule.find(m=>m.id===id).result.gameStats,stored);
 const bad=E.clone(s);bad.schedule.find(m=>m.id===id).result.gameStats[0].players[0].stats.hits=-1;assert.throws(()=>decode(encoded(bad)),/invalid_save/);
});
test('all ten logo choices are reserved, NPC identities are unique and gameplay RNG is independent',()=>{
 const base=E.newGame('Loups','Test','free',127,'wolf');
 for(const logo of E.LOGOS){const s=E.newGame('Loups','Test','free',127,logo.id);assert.equal(E.team(s).logo,logo.id);assert.equal(new Set(s.teams.map(t=>t.logo)).size,6);assert.deepEqual(s.players,base.players);assert.equal(s.rng,base.rng);assert.deepEqual(decode(encoded(s)),s);E.validateStructure(s);}
 const different=E.newGame('Loups','Test','free',128,'wolf');assert.notDeepEqual(different.teams.map(t=>t.logo),base.teams.map(t=>t.logo));
 const old=E.clone(base);old.teams.forEach(t=>delete t.logo);const restored=decode(encoded(old));assert.equal(new Set(restored.teams.map(t=>t.logo)).size,6);assert.deepEqual(restored.players,base.players);assert.equal(restored.rng,old.rng);
 const bad=E.clone(base);bad.teams[1].logo=bad.teams[0].logo;assert.throws(()=>decode(encoded(bad)),/invalid_save/);bad.teams[1].logo='../bad';assert.throws(()=>decode(encoded(bad)),/invalid_save/);
});

test('every initial draft pick can be saved and resumed deterministically',()=>{
 let s=fresh(91);const uninterrupted=E.clone(s);E.autoDraft(uninterrupted,true);
 for(let i=0;i<48;i++){assert.equal(s.draft.index,i);s=decode(encoded(s));E.draftPick(s,null,null,true);E.validate(s);E.validateStructure(s);}
 assert.deepEqual(s,uninterrupted);assert.equal(new Set(s.lastDraft.map(p=>p.id)).size,48);
});
test('next user pick stops correctly including back-to-back snake selections',()=>{
 for(let seed=1;seed<=12;seed++){const s=fresh(seed);E.autoDraft(s);assert.equal(s.draft.order[s.draft.index],s.user);const i=s.draft.index,id=s.rookies.at(-1);E.draftPick(s,id);assert(E.team(s).roster.includes(id));assert.equal(s.draft.index,i+1);E.autoDraft(s);assert.equal(s.draft.order[s.draft.index],s.user);}
 const starts=Array.from({length:12},(_,i)=>fresh(i+1).draft.order[0]);assert(new Set(starts).size>1);
});
test('initial draft rejects roster mutations, skipped picks and malformed imports',()=>{
 const s=fresh();assert.throws(()=>E.nextDay(s),/draft_required/);assert.throws(()=>E.simulateDay(s),/draft_required/);
 assert.throws(()=>E.startMatch(s,s.schedule[0].id),/draft_required/);assert.throws(()=>E.cut(s,'p1'),/draft_required/);assert.throws(()=>E.sign(s,'p1'),/draft_required/);assert.throws(()=>E.propose(s,'t1',[],[],0,0),/draft_required/);
 for(const corrupt of [b=>b.draft.index++,b=>b.draft.order[7]=b.draft.order[6],b=>b.draft.picks.push({}),b=>b.teams[0].roster.push('p1'),b=>b.day=1,b=>b.draft.kind='annual']){const b=E.clone(s);corrupt(b);assert.throws(()=>decode(encoded(b)),/invalid_save/);}
 E.autoDraft(s);const before=E.clone(s);assert.throws(()=>E.draftPick(s,'missing'),/invalid_player/);assert.deepEqual(s,before);
 E.draftPick(s,s.rookies[0]);assert.throws(()=>E.draftPick(s,null,'p1',true),/invalid_player/);
});
test('NPC draft choices fill a missing pitcher instead of a higher total redundant hitter',()=>{
 const s=fresh(),t=E.team(s);const build=base=>{let id=E.makePlayer(s);s.players[id].base=base;return id;};
 t.roster=Array.from({length:5},()=>build({contact:8,power:8,catch:8,throw:1,speed:8}));
 const pitcher=build({contact:1,power:1,catch:1,throw:10,speed:1}),hitter=build({contact:9,power:9,catch:9,throw:1,speed:9});
 s.rookies=[hitter,pitcher];assert.equal(E.chooseDraftPlayer(s,t),pitcher);
});
test('legacy annual draft saves keep full rosters and the two-round replacement flow',()=>{
 const s=fresh();E.autoDraft(s,true);E.makeRookies(s);const order=E.standings(s).reverse().map(t=>t.id);s.draft={order:[...order,...order],index:0,picks:[]};
 const restored=decode(encoded(s));E.autoDraft(restored,true);assert.equal(restored.lastDraft.length,12);assert(restored.teams.every(t=>t.roster.length===8));E.validate(restored);E.validateStructure(restored);
});

test('solo annual draft can skip both choices without recruiting or releasing players',()=>{
 const s=E.newGame('Loups','Test','free',913);
 assert.throws(()=>E.skipDraftTurn(s),/invalid_draft_skip/);
 E.autoDraft(s,true);E.makeRookies(s);
 const order=s.teams.map(t=>t.id);s.draft={kind:'annual',order:[...order,...order],index:0,picks:[]};
 const before=E.clone(E.team(s)),players=E.clone(E.roster(s,E.team(s)));
 E.skipDraftTurn(s);assert.throws(()=>E.skipDraftTurn(s),/not_your_draft_turn/);
 E.autoDraft(s);E.skipDraftTurn(s);E.autoDraft(s);
 assert.equal(s.draft,null);assert.deepEqual(E.team(s),before);assert.deepEqual(E.roster(s,E.team(s)),players);
 assert.equal(s.lastDraft.filter(p=>p.teamId===s.user&&p.skipped).length,2);E.validateStructure(s);
});
