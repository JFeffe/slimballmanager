import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
const fresh=()=>{const s=E.newGame('Club','Coach','free',37);E.autoDraft(s,true);return s;};
const envelope=s=>JSON.stringify({format:'SlimballManager',version:1,state:s});

test('regular-season appearances follow the player across clubs and exclude playoffs and unfinished games',()=>{
 const game=(id,playoff=null,result=true)=>({playoff,result:result?{gameStats:[{players:[{id}]}]}:null});
 const s={schedule:[game('p1'),game('p1'),game('p1','final'),game('p1',null,false),game('p2')],players:{}};
 assert.equal(E.seasonParticipation(s).counts.get('p1'),2);assert.equal(E.seasonParticipation(s).counts.get('p2'),1);
 assert.equal(E.developmentFactor(0),.6);assert.equal(E.developmentFactor(10),.8);assert.equal(E.developmentFactor(20),1);assert.equal(E.developmentFactor(33),1);
 const old={schedule:[{result:{}}],players:{p1:{id:'p1',stats:{ab:36,bb:0}}}};assert.equal(E.seasonParticipation(old).counts.get('p1'),12);assert.equal(E.seasonParticipation(old).estimated,true);
});

test('inactivity reduces positive development, never age decline',()=>{
 let active=0,inactive=0;const p={age:22,form:'Normal'};
 for(let seed=1;seed<=20000;seed++){
  const state={rng:seed};active+=E.developmentChange({...state},p,1);inactive+=E.developmentChange({...state},p,.6);
  const old={age:34,form:'Éclair'};assert.equal(E.developmentChange({...state},old,.6),E.developmentChange({...state},old,1));
 }
 assert(active>0);assert(inactive/active>.57&&inactive/active<.63);
});

test('free-agent retirement matches the historical age, talent, duration thresholds and cap',()=>{
 const p={age:24,base:Object.fromEntries(E.ATTR.map(k=>[k,5]))};
 assert.equal(E.freeRetirementChance(p,1),.4);assert.equal(E.freeRetirementChance(p,2),.55);
 p.age=27;assert.equal(E.freeRetirementChance(p,2),.7);p.age=30;assert.equal(E.freeRetirementChance(p,8),.9);
 p.base={contact:7,power:7,catch:6,throw:6,speed:6};p.age=24;assert.equal(E.freeRetirementChance(p,1),.15);
 p.base.contact=6;assert.equal(E.freeRetirementChance(p,1),.3);
});

test('offseason applies free decline to net changes and retires once, preserving histories and old saves',()=>{
 const s=fresh();while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
 // Simulate a prior save with no new counters; no retroactive accumulation.
 for(const p of Object.values(s.players))delete p.freeSeasons;
 const restored=decode(envelope(s)),ids=[...restored.free];
 for(const id of ids){const p=restored.players[id];p.freeSeasons=1;p.age=18;p.form='Tardif';p.base=Object.fromEntries(E.ATTR.map(k=>[k,5]));}
 const archives=JSON.stringify(restored.archives);const copy=decode(envelope(restored));
 E.advanceOffseason(restored);E.advanceOffseason(copy);assert.deepEqual(restored,copy);
 for(const id of ids){const p=restored.players[id];assert.equal(p.freeSeasons,2);assert.equal(E.total(p)-25,Object.values(p.change).reduce((n,v)=>n+v,0));assert.equal(p.history.at(-1).development.rules,2);assert.equal(p.history.at(-1).development.factor,.6);assert.deepEqual(restored.summary.changes.find(c=>c.id===id).delta,p.change);assert(Object.values(p.change).every(v=>v>=-1&&v<=1));assert.equal(p.history.at(-1).base.contact,5);}
 assert.equal(new Set(restored.retired).size,restored.retired.length);
 const retired=restored.retired.length;E.advanceOffseason(restored);assert.equal(restored.retired.length,retired);
 E.validateStructure(restored);assert.equal(decode(envelope(restored)).season,2);
 const before=JSON.parse(archives)[0];for(const [id,p] of Object.entries(before.players))assert.deepEqual(restored.archives[0].players[id].base,p.base);
});

test('signing and release reset free-agent counters; malformed counters are rejected',()=>{
 const s=fresh(),id=s.free[0],cut=E.team(s).roster[0];s.players[id].freeSeasons=3;E.sign(s,id,cut);assert.equal(s.players[id].freeSeasons,0);
 s.players[id].freeSeasons=2;E.cut(s,id);assert.equal(s.players[id].freeSeasons,0);
 s.players[id].freeSeasons=-1;assert.throws(()=>decode(envelope(s)),/invalid_save/);
});
