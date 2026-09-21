import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import * as M from '../dist/multiplayer.js';
import {decode} from '../dist/storage.js';
let serial=0;
const act=(s,actor,type,args={},presence=s.online.members.map(m=>m.teamId))=>M.command(s,actor,{id:'cmd-'+(++serial),type,args},presence);
function setup(n=2,seed=500){let s=M.createLeague('Loups','Host','wolf',seed);for(let i=1;i<n;i++)s=act(s,'t'+i,'join',{name:'Friend '+i,logo:E.LOGOS[i].id},Array.from({length:n},(_,j)=>'t'+j));return act(s,'t0','launch');}
function draft(s){while(s.draft){s=act(s,s.draft.order[s.draft.index],'draft',{auto:true});}return s;}
function approve(s){for(const m of s.online.members)if(m.teamId!=='t0')s=act(s,m.teamId,'vote',{vote:s.online.vote.id,accept:true});return s;}
function day(s){return M.tick(approve(act(s,'t0','next')),s.online.members.map(m=>m.teamId));}
test('fixed roster, unique logos, initial snake draft for six humans',()=>{let s=setup(6);assert.equal(s.draft.order.length,48);assert.equal(new Set(s.teams.map(t=>t.logo)).size,6);s=draft(s);assert.ok(s.teams.every(t=>t.roster.length===8));assert.equal(s.free.length,12);E.validateStructure(s);assert.throws(()=>act(s,'t1','join',{name:'Intruder',logo:'wolf'}));});
test('atomic logo choice, identity protection, host rights and own draft turn',()=>{let s=M.createLeague('Host','Host','wolf');assert.throws(()=>act(s,'t1','join',{name:'Friend',logo:'wolf'},['t0','t1']),/logo/);s=act(s,'t1','join',{name:'Friend',logo:'hawk'},['t0','t1']);assert.throws(()=>act(s,'t1','launch'),/hôte/);s=act(s,'t0','launch');const turn=s.draft.order[s.draft.index],other=turn==='t0'?'t1':'t0';assert.throws(()=>act(s,other,'draft',{auto:true}),/tour/);assert.throws(()=>act(s,'t5','ready',{},['t0','t5']),/participant/);});
test('host proposals wait for explicit consent and refusal names the participant',()=>{
 let s=draft(setup(3));assert.throws(()=>act(s,'t1','next'),/hôte/);assert.throws(()=>act(s,'t1','vote-propose'),/hôte/);assert.throws(()=>act(s,'t0','next',{},['t1']),/retour/);
 s=act(s,'t0','next');const id=s.online.vote.id;assert.equal(s.day,0);assert.equal(M.tick(s,['t0','t1','t2']),s);
 s=act(s,'t1','vote',{vote:id,accept:true});assert.equal(s.day,0);s=act(s,'t2','vote',{vote:id,accept:false});
 assert.equal(s.online.vote,null);assert.match(s.online.timeNotice.message,/Friend 2/);assert.equal(s.day,0);
 assert.throws(()=>act(s,'t1','vote',{vote:id,accept:true}),/terminé/);s=day(s);assert.equal(s.day,1);assert.equal(M.tick(s,['t0','t1','t2']),s);
});
test('simultaneous human matches, home controls and identical projections',()=>{let s=draft(setup(6));s=day(day(day(s)));const games=E.todayMatches(s);for(const m of games){s=act(s,m.away,'match-ready',{match:m.id});assert.ok(!s.online.lives[m.id]);s=act(s,m.home,'match-ready',{match:m.id});}assert.equal(Object.keys(s.online.lives).length,3);const a=games[0],b=games[1];assert.throws(()=>act(s,a.away,'control',{match:a.id,action:'step'}),/domicile/);s=act(s,a.home,'control',{match:a.id,action:'step'});assert.equal(s.online.lives[a.id].events.length,1);assert.equal(s.online.lives[b.id].events.length,0);assert.deepEqual(M.project(s,a.home).live,M.project(s,a.away).live);assert.throws(()=>act(s,a.home,'swap',{from:E.team(s,a.home).order[0],to:E.team(s,a.home).order[1]}),/match_running/);s=act(s,a.home,'control',{match:a.id,action:'toggle'});s=M.tick(s,[a.home,...s.online.members.map(m=>m.teamId).filter(id=>id!==a.away)],[a.id]);assert.equal(s.online.controls[a.id].playing,false);assert.equal(s.online.lives[a.id].events.length,1);});
test('match random sequence unaffected by interleaving another game',()=>{let s=draft(setup(6));s=day(day(day(s)));const [a,b]=E.todayMatches(s);for(const m of [a,b]){s=act(s,m.home,'match-ready',{match:m.id});s=act(s,m.away,'match-ready',{match:m.id});}let x=s,y=E.clone(s);for(let i=0;i<10;i++){x=act(x,a.home,'control',{match:a.id,action:'step'});y=act(y,b.home,'control',{match:b.id,action:'step'});y=act(y,a.home,'control',{match:a.id,action:'step'});}assert.deepEqual(x.online.lives[a.id],y.online.lives[a.id]);});
test('host-only save restores concurrent games without advancing or auto playing',()=>{let s=draft(setup(6));s=day(day(day(s)));for(const m of E.todayMatches(s)){s=act(s,m.away,'match-ready',{match:m.id});s=act(s,m.home,'match-ready',{match:m.id});s=act(s,m.home,'control',{match:m.id,action:'step'});}const restored=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));assert.deepEqual(restored.online.lives,s.online.lives);M.resetSession(restored);assert.ok(Object.values(restored.online.controls).every(c=>!c.playing));assert.ok(!M.publicState(s).online.keys);assert.throws(()=>decode(JSON.stringify({format:'SlimballManager',version:1,state:M.publicState(s)})));});
test('human trades need both parties and cannot be accepted by a third team',()=>{let s=draft(setup(3));const a=E.team(s,'t0'),b=E.team(s,'t1'),p=a.roster[0],q=b.roster[0];s=act(s,'t0','propose',{to:'t1',offered:[p],asked:[q],pay:10,receive:0});const id=s.trades[0].id;assert.throws(()=>act(s,'t0','accept',{trade:id}),/invalid_trade/);assert.throws(()=>act(s,'t2','accept',{trade:id}),/invalid_trade/);s=day(day(s));assert.equal(s.trades[0].status,'pending');s=act(s,'t1','accept',{trade:id});assert.ok(E.team(s,'t1').roster.includes(p));assert.equal(s.online.managers.t0.points,990);assert.equal(s.online.managers.t1.points,1010);assert.throws(()=>act(s,'t0','accept',{trade:id}),/invalid_trade/);});
test('duplicate commands cannot repeat actions',()=>{let s=draft(setup());const c={id:'unique',type:'next'};s=M.command(s,'t0',c,['t0','t1']);const next=M.command(s,'t0',c,['t0','t1']);assert.equal(next,s);assert.equal(next.online.vote.approvals.t0,true);});
test('full online season stops at offseason, then annual two-player draft',()=>{let s=draft(setup(2));while(!s.offseason){s=act(s,'t0','vote-propose');s=act(s,'t1','vote',{vote:s.online.vote.id,accept:true});for(let i=0;s.online.vote&&i<20;i++)s=M.tick(s,['t0','t1']);}assert.equal(s.day,47);assert.equal(s.offseason.stage,'awards');
const cmd={id:'annual-review-once',type:'next'};const presence=['t0','t1'];
const saved=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
assert.throws(()=>M.command(s,'t1',cmd,presence),/hôte/);
const applied=M.command(s,'t0',cmd,presence),replayed=M.command(saved,'t0',cmd,presence);assert.deepEqual(applied,replayed);
assert.equal(applied.offseason.stage,'awards');assert.equal(M.command(applied,'t0',cmd,presence),applied);
const restored=decode(JSON.stringify({format:'SlimballManager',version:1,state:applied}));assert.equal(M.command(restored,'t0',cmd,presence),restored);
assert.deepEqual(M.project(applied,'t0').players,M.project(applied,'t1').players);
s=day(M.tick(approve(applied),presence));assert.equal(s.season,2);assert.equal(s.draft.order.length,12);assert.equal(s.online.members.length,2);s=draft(s);E.validateStructure(s);assert.deepEqual(E.auditStats(s),[]);});
test('delegation does not bypass unanimous time consent or presence',()=>{let s=draft(setup());s=act(s,'t1','delegate',{value:true});assert.throws(()=>act(s,'t0','next',{},['t0']),/connectés/);assert.throws(()=>act(s,'t0','vote-propose',{},['t0']),/connectés/);s=act(s,'t0','next');assert.equal(M.tick(s,['t0','t1']),s);s=M.tick(approve(s),['t0','t1']);assert.equal(s.day,1);});

test('annual draft permits every human to skip both rounds, with resumable history and unchanged rosters',()=>{
 let s=draft(setup(6));s.season=2;E.makeRookies(s);E.schedule(s);
 const order=s.teams.map(t=>t.id);s.draft={kind:'annual',order:[...order,...order],index:0,picks:[]};
 const rosters=E.clone(s.teams),rookies=[...s.rookies];
 assert.throws(()=>act(s,'t1','draft',{skip:true}),/tour/);
 for(let i=0;i<12;i++){
  s=act(s,s.draft.order[s.draft.index],'draft',{skip:true});
  s=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
 }
 assert.equal(s.draft,null);assert.deepEqual(s.teams,rosters);
 assert.equal(s.lastDraft.filter(p=>p.skipped).length,12);
 assert.ok(rookies.every(id=>s.free.includes(id)));
});
test('a multiplayer skip command cannot bypass the initial draft',()=>{
 const s=setup(6),actor=s.draft.order[s.draft.index];
 assert.throws(()=>act(s,actor,'draft',{skip:true}),/invalid_draft_skip/);
 assert.equal(s.draft.index,0);assert.equal(s.draft.picks.length,0);
});

test('rotation commands edit only own roster, clear readiness, and reject changes during a live match',()=>{
 let s=draft(setup(6));const ids=E.team(s,'t1').roster.slice(0,2),other=E.clone(E.team(s,'t0'));
 s=act(s,'t1','rotation',{players:ids,teamId:'t0'});assert.deepEqual(E.team(s,'t1').rotation.players,ids);assert.deepEqual(E.team(s,'t0'),other);assert.equal(s.online.ready.t1,false);
 assert.throws(()=>act(s,'t1','rotation',{players:E.team(s,'t0').roster.slice(0,2)}),/invalid_rotation/);
 s=day(day(day(s)));const m=E.todayMatches(s).find(m=>[m.away,m.home].includes('t1'));s=act(s,'t1','match-ready',{match:m.id});s=act(s,'t1','rotation',{players:[...ids].reverse()});assert(!s.online.matchReady[m.id].t1);
 s=act(s,m.away,'match-ready',{match:m.id});s=act(s,m.home,'match-ready',{match:m.id});assert.throws(()=>act(s,'t1','rotation',{players:ids}),/match_running/);
});

test('no ready command or automatic day remains; approved request stops on disconnection',()=>{
 let s=draft(setup());assert.throws(()=>act(s,'t1','ready'),/hôte/);s.online.ready={t0:true,t1:true};assert.equal(M.tick(s,['t0','t1']),s);
 s=approve(act(s,'t0','next'));s=M.tick(s,['t0']);assert.equal(s.day,0);assert.equal(s.online.vote,null);assert.match(s.online.timeNotice.message,/déconnecté/);
});
test('a day request simulates unplayed games exactly once and rejects live-match conflicts',()=>{
 let s=day(day(day(draft(setup(6)))));assert.equal(s.day,3);const games=E.todayMatches(s).map(m=>m.id);
 s=day(s);assert.equal(s.day,4);assert(games.every(id=>s.schedule.find(m=>m.id===id).result));
 const m=E.todayMatches(s)[0];s=act(s,m.away,'match-ready',{match:m.id});s=act(s,m.home,'match-ready',{match:m.id});assert.throws(()=>act(s,'t0','next'),/matchs/);
});
test('period voting still stops at decisions and refuses without advancing',()=>{
 let s=draft(setup());s=act(s,'t0','vote-propose');const before=s;assert.equal(M.tick(s,['t0','t1']),before);
 s=act(s,'t1','vote',{vote:s.online.vote.id,accept:false});assert.equal(s.day,0);assert.match(s.online.timeNotice.message,/Friend 1/);
 s=approve(act(s,'t0','vote-propose'));s=M.tick(s,['t0','t1']);assert.equal(s.day,1);assert(s.online.vote.running);
});
