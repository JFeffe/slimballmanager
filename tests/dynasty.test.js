import {test} from 'node:test';import assert from 'node:assert/strict';import {dynastyReport} from '../dist/dynasty.js';
test('dynasty counts only club match sheets, includes departures, and does not duplicate current archive',()=>{
 const match=(id,home,stats)=>({id,home,away:'other',result:{winner:home,gameStats:[{id:home,players:[{id:'p1',name:'Former player',stats}]}]}});
 const a={season:1,teams:[{id:'club'}],schedule:[match('a','club',{ab:20,hits:10,hr:2}),match('b','other',{ab:30,hits:30,hr:30})],awards:[{teamId:'club',id:'p1',type:'hr'}],winner:'club'};
 const s={season:2,user:'club',teams:[{id:'club',roster:[]}],archives:[a,{season:2,teams:[{id:'club'}],schedule:[match('c','club',{ab:20,hits:10,hr:3})]}],schedule:[match('c','club',{ab:20,hits:10,hr:3})]};
 const d=dynastyReport(s);assert.equal(d.wins,2);assert.equal(d.records.hr.stats.hr,5);assert.equal(d.records.avg.stats.ab,40);assert.equal(d.stars.loyal.games,2);assert.equal(d.titles,1);assert.equal(d.awards.length,1);assert.equal(d.stars.pitcher,null);
});
test('missing old sheets are explicitly reported and average requires 30 at bats',()=>{const s={season:1,user:'club',teams:[{id:'club'}],archives:[],schedule:[{home:'club',away:'x',result:{winner:'club'}}]};const d=dynastyReport(s);assert.equal(d.missing,1);assert.equal(d.records.avg,null);});
