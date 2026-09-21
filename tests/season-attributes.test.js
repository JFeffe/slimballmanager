import {test} from 'node:test';import assert from 'node:assert/strict';import * as E from '../dist/engine.js';import {decode} from '../dist/storage.js';
test('opening skills exist at creation and next season reflects offseason changes without replacing season one',()=>{
 const s=E.newGame('Test','Coach','free',407);const id=s.rookies[0],p=s.players[id],first=E.clone(p.base);assert.deepEqual(p.attributeHistory[0].base,first);assert.equal(p.attributeHistory[0].season,1);E.autoDraft(s,true);
 while(s.day<47){E.simulateDay(s);E.nextDay(s);}E.advanceOffseason(s);const before=E.clone(p.base);E.advanceOffseason(s);
 assert.deepEqual(p.attributeHistory.find(h=>h.season===1).base,first);if(!p.retired)assert.deepEqual(p.attributeHistory.find(h=>h.season===2).base,before);
 for(const id of s.rookies)assert(s.players[id].attributeHistory.some(h=>h.season===2));decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
});
test('legacy opening skill migration is idempotent and respects pre-development year-end values',()=>{const p={base:{contact:8},history:[{season:1,base:{contact:6},value:20}],retired:false};const s={season:1,offseason:{stage:'development'},rookies:[],players:{p}};E.ensureAttributeHistory(s);assert.equal(p.attributeHistory[0].base.contact,6);E.ensureAttributeHistory(s);assert.equal(p.attributeHistory.length,1);});
test('ERA leaderboard excludes insufficient innings and sorts lowest earned run average first',()=>{const s=E.newGame('Test','Coach','free',408);E.autoDraft(s,true);const ps=E.team(s).roster.map(id=>s.players[id]);for(const p of ps){p.stats.pitchOuts=30;p.stats.earned=10;}ps[0].stats.earned=0;ps[1].stats.earned=1;ps[2].stats.pitchOuts=3;ps[2].stats.earned=0;const list=E.leaderboard(s,'era');assert.equal(list[0].id,ps[0].id);assert.equal(list[1].id,ps[1].id);assert(!list.some(p=>p.id===ps[2].id));});

test('fielding leaders break equal exact percentages by fielding chances then name',()=>{
 const s=E.newGame('Test','Coach','free',409);E.autoDraft(s,true);const ps=E.team(s).roster.map(id=>s.players[id]);
 for(const p of Object.values(s.players))p.stats=E.blankStats();
 const [a,b,c,d,e]=ps;
 a.name='Zoe';a.stats.catchOuts=80;a.stats.errors=0;
 b.name='Alice';b.stats.catchOuts=40;b.stats.errors=0;
 c.name='Bob';c.stats.catchOuts=80;c.stats.errors=0;
 d.stats.catchOuts=9;d.stats.errors=0;
 e.stats.catchOuts=150;e.stats.errors=1;
 assert.deepEqual(E.leaderboard(s,'def').map(p=>p.id),[c.id,a.id,b.id,e.id]);
 a.stats.errors=2;c.stats.errors=2;b.stats.errors=1;
 assert.deepEqual(E.leaderboard(s,'def').map(p=>p.id),[e.id,c.id,a.id,b.id]);
});
