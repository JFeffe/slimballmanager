import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {seasonAwards,progressAward} from '../dist/league.js';
import {decode} from '../dist/storage.js';
const fresh=()=>{const s=E.newGame('Club','Coach','free',941);E.autoDraft(s,true);return s;};
const restore=s=>decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
test('awards separate postseason, suppress season-one rookie, require volume, allow multiple wins and exclude retired players',()=>{
 const s=fresh();for(const p of Object.values(s.players)){p.stats=E.blankStats();p.playoffStats=E.blankStats();}const [a,b,c,d]=E.team(s).roster.map(id=>s.players[id]);
 Object.assign(a.stats,{ab:100,hits:70,singles:40,hr:30,rbi:70,runs:50,balls:50,catchOuts:40,pitchOuts:60,pitchSO:20});
 Object.assign(b.playoffStats,{ab:40,hits:30,singles:10,hr:20,rbi:40});Object.assign(c.stats,{ab:1,hits:1,singles:1});Object.assign(d.stats,{ab:300,hits:300,hr:300});d.retired=true;
 const before=E.clone(s),awards=seasonAwards(s);assert(!awards.some(a=>a.type==='award_rookie'));assert.equal(awards.find(x=>x.type==='award_playoffs').id,b.id);assert.equal(awards.find(x=>x.type==='avg').id,a.id);assert(awards.filter(x=>x.id===a.id).length>=5);assert.equal(new Set(awards.map(x=>x.type)).size,awards.length);assert.deepEqual(s,before);
 s.season=2;a.history.push({season:1,stats:E.clone(a.stats)});Object.assign(c.stats,{ab:40,hits:20,singles:20});assert.equal(seasonAwards(s).find(x=>x.type==='award_rookie').id,c.id);assert(!E.rookieEligible(s,a));
});
test('progress trophy uses positive net gain and actual season participation',()=>{
 const s=fresh(),[a,b]=E.team(s).roster.map(id=>s.players[id]);a.stats.ab=10;s.summary={changes:[{id:a.id,name:a.name,delta:{contact:2,power:-1}},{id:b.id,name:b.name,delta:{contact:4}}]};assert.equal(progressAward(s).id,a.id);s.summary.changes[0].delta.contact=0;assert.equal(progressAward(s),null);
});
test('pregame report is read-only and predicts actual automatic lineup while respecting manual lineup',()=>{
 const s=fresh();while(s.day<3)E.nextDay(s);const m=E.userMatch(s),own=E.team(s);own.auto=false;own.roster.forEach((id,i)=>s.players[id].energy=i<6?20:100);const frozen=E.clone(s),r=E.preMatchReport(s,m.id);assert.deepEqual(s,frozen);assert.deepEqual(r.teams.find(t=>t.team.id===own.id).team.order,own.order);assert(r.tips.some(t=>t.key==='tip_rest'));const changes=r.tips.filter(t=>t.key==='tip_rest').map(t=>t.args.replacement);assert.equal(new Set(changes).size,changes.length);
 E.startMatch(s,m.id);for(const x of r.teams)assert.deepEqual(E.team(s,x.team.id).positions,x.team.positions);assert.equal(E.preMatchReport(s,m.id),null);
});
test('narrative news and trophies survive save/import, archive after playoffs, and do not duplicate on ceremony revisit',()=>{
 const s=fresh();while(!s.offseason){E.simulateDay(s);E.nextDay(s);}assert(s.leagueNews.length>0);assert(s.leagueNews.filter(e=>e.day>=36).every(e=>!['news_record','news_rookie'].includes(e.key)));assert(s.leagueNews.some(e=>e.key==='prize_won'));assert(s.archives[0].awards.some(a=>a.type==='award_mvp'));assert(s.archives[0].leagueNews.length);const initial=E.clone(s.archives[0].awards);E.endSeason(s);assert.deepEqual(s.archives[0].awards,initial);E.advanceOffseason(s);const awards=s.archives[0].awards;assert.equal(new Set(awards.map(a=>a.type)).size,awards.length);for(const a of awards){assert(s.players[a.id].awards.some(x=>x.type===a.type&&x.season===1));assert(s.archives[0].players[a.id].awards.some(x=>x.type===a.type&&x.season===1));assert(s.players[a.id].journal.some(x=>x.args.prize===a.type));}assert.deepEqual(restore(s),s);
 const after=E.clone(awards);E.advanceOffseason(s);assert.deepEqual(s.archives[0].awards,after);
});
test('ties are reproducible and postseason outliers cannot win annual awards',()=>{
 const s=fresh(),ids=E.team(s).roster.slice(0,2);for(const p of Object.values(s.players))p.stats=E.blankStats();for(const id of ids)Object.assign(s.players[id].stats,{ab:50,hits:25,singles:25});s.players[ids[1]].playoffStats={...E.blankStats(),ab:500,hits:500,hr:500};const before=s.rng;const expected=[...ids].sort((a,b)=>a.localeCompare(b))[0];for(let i=0;i<3;i++)assert.equal(seasonAwards(s).find(a=>a.type==='award_bat').id,expected);assert.equal(s.rng,before);
});
