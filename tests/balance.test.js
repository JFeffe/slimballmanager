import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
const fresh=()=>{const s=E.newGame('Test','Coach','free',91230);E.autoDraft(s,true);E.team(s).auto=true;return s;};
test('all 48 birthday dates age exactly once across a complete year, including day zero',()=>{
 const s=fresh(),ids=s.teams.flatMap(t=>t.roster);ids.forEach((id,i)=>{s.players[id].birthday=i;s.players[id].age=21;});
 while(!s.offseason){E.simulateDay(s);E.nextDay(s);}while(s.offseason)E.advanceOffseason(s);
 for(const id of ids)assert.equal(s.players[id].age,22,`birthday ${s.players[id].birthday}`);
 const restored=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));E.autoDraft(s,true);E.autoDraft(restored,true);E.nextDay(s);E.nextDay(restored);assert.deepEqual(s,restored);assert.equal(s.players[ids[0]].age,22);assert.equal(s.players[ids[1]].age,23);
});
test('annual draft offers two prospects per pick and enough players for every club',()=>{
 const s=fresh();E.makeRookies(s);assert.equal(s.rookies.length,24);assert(s.rookies.every(id=>s.players[id].age>=18&&s.players[id].age<=23));const order=s.teams.map(t=>t.id);s.draft={kind:'annual',order:[...order,...order],index:0,picks:[]};E.autoDraft(s,true);assert.equal(s.lastDraft.length,12);assert(s.teams.every(t=>t.roster.length===8));E.validateStructure(s);
});
test('each NPC receives first market access once per five windows, independent of array order',()=>{
 const s=fresh(),first=[];for(let day of [6,12,18,24,30]){s.day=day;const a=E.npcMarketOrder(s).map(t=>t.id);first.push(a[0]);s.teams.reverse();assert.deepEqual(E.npcMarketOrder(s).map(t=>t.id),a);assert(!a.includes(s.user));}assert.equal(new Set(first).size,5);
});
test('legacy calendar rollover handles day-zero birthday once, not twice',()=>{
 const s=fresh(),p=s.players[E.team(s).roster[0]];delete s.calendarVersion;s.day=47;p.birthday=0;p.age=22;E.nextDay(s);assert.equal(s.day,0);assert.equal(s.season,2);assert.equal(p.age,23);
});
