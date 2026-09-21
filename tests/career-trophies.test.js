import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
import fs from 'node:fs';
const envelope=s=>JSON.stringify({format:'SlimballManager',version:1,state:s});
const fresh=()=>{const s=E.newGame('Test','Coach','free',119);E.autoDraft(s,true);return s;};
const awarded=(type='award_mvp',season=2)=>({age:21,base:Object.fromEntries(E.ATTR.map(k=>[k,6])),awards:[{type,season,rank:1}]});

test('each approved trophy decays over three completed seasons; fractions survive',()=>{
 for(const [type,points] of Object.entries({award_mvp:3,award_bat:2,award_pitcher:2,award_glove:2,award_rookie:1.5})){
  const p=awarded(type);
  for(const [reference,bonus] of [[1,0],[2,points],[3,points/2],[4,points/4],[5,0]]){
   assert.equal(E.trophyBonus(p,reference),bonus);assert.equal(E.tradeValue(p,reference),45+bonus);
  }
 }
 assert.equal(E.tradeValue(awarded('award_rookie'),4),45.375);
});
test('trophies combine up to six; duplicates, runners-up and other awards do not inflate value',()=>{
 const p=awarded();p.awards.push({type:'award_bat',season:2,rank:1});assert.equal(E.trophyBonus(p,2),5);
 p.awards.push({type:'award_mvp',season:2,rank:1},{type:'award_pitcher',season:2,rank:2},{type:'champion',season:2,rank:1},{type:'award_playoffs',season:2,rank:1});assert.equal(E.trophyBonus(p,2),5);
 p.awards.push({type:'award_glove',season:2,rank:1});assert.equal(E.trophyBonus(p,2),6);assert.equal(E.trophyBonus(p,3),3.5);
});
test('ceremony and following spring share the same trophy value; archives keep their own reference',()=>{
 const p=awarded('award_mvp',2);p.awards.push({type:'award_bat',season:1,rank:1});
 assert.equal(E.trophyBonus(p,{season:2}),2);
 const archive={season:2,winner:'t0'};
 assert.equal(E.trophyBonus(p,{season:2,offseason:{stage:'awards'}}),4);
 assert.equal(E.trophyBonus(p,{season:3}),4);
 assert.equal(E.trophyBonus(p,{season:4}),2);
 assert.equal(E.trophyBonus(p,{season:5}),.75);
 assert.equal(E.trophyBonus(p,{season:6}),0);
 assert.equal(E.trophyBonus(p,archive),4);
});
test('integrated career curves match the approved tuned prototype exactly',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../reports/career-curves-tuned.json',import.meta.url),'utf8'));
 const engine=fs.readFileSync(new URL('../dist/engine.js',import.meta.url),'utf8');
 assert(engine.includes(report.rules.trim()));
 for(const [form,age,phase] of [['Normal',26,'peak'],['Régulier',32,'decline'],['Jeune Étoile',23,'peak'],['Tardif',24,'early'],['Tardif',25,'growth'],['Tardif',30,'peak'],['Tardif',33,'decline'],['Vétéran',33,'peak'],['Vétéran',34,'decline'],['Éclair',26,'decline'],['Faible',29,'decline']])assert.equal(E.careerPhase({form,age}),phase);
});
test('old development records load unchanged alongside new rules and reject invalid factors',()=>{
 const s=fresh(),p=s.players[E.team(s).roster[0]];
 p.history=[{season:1,team:'Test',stats:E.blankStats(),base:{...p.base},value:30,development:{games:12,factor:.625,estimated:false}},{season:2,team:'Test',stats:E.blankStats(),base:{...p.base},value:30,development:{games:10,factor:.8,estimated:false,rules:2}}];
 assert.deepEqual(decode(envelope(s)).players[p.id].history,p.history);
 p.history[0].development.factor=.8;assert.throws(()=>decode(envelope(s)),/invalid_save/);
 p.history[0].development.factor=.625;p.history[1].development.rules=3;assert.throws(()=>decode(envelope(s)),/invalid_save/);
});
test('young unsigned players halve free-agent loss while players aged 25 retain it',()=>{
 for(const age of [24,25]){
  const s=fresh();s.offseason={stage:'awards'};s.summary={season:1,changes:[],retirements:[]};s.free=[];
  for(let i=0;i<1000;i++){const id=E.makePlayer(s,age,age),p=s.players[id];p.age=age;p.form='Normal';p.base=Object.fromEntries(E.ATTR.map(k=>[k,6]));p.freeSeasons=1;s.free.push(id);}
  const ids=[...s.free];E.advanceOffseason(s);
  const loss=ids.filter(id=>s.players[id].journal.some(e=>e.key==='free_decline')).length;
  if(age===24)assert(loss>440&&loss<560,`${loss}/1000`);else assert.equal(loss,1000);
 }
});
test('high skills are protected outside decline, and decline is active afterward',()=>{
 for(const age of [33,34]){
  const s=fresh();s.offseason={stage:'awards'};s.summary={season:1,changes:[],retirements:[]};s.free=[];
  // Use roster members only: no special free-agent loss can affect this comparison.
  let losses=0;
  for(let seed=1;seed<=80;seed++){
   const copy=structuredClone(s);copy.rng=seed;
   for(const t of copy.teams)for(const id of t.roster){const p=copy.players[id];p.age=age;p.form='Vétéran';p.base=Object.fromEntries(E.ATTR.map(k=>[k,10]));}
   const ids=copy.teams.flatMap(t=>t.roster);E.advanceOffseason(copy);
   losses+=ids.reduce((n,id)=>n+50-E.total(copy.players[id]),0);
  }
  const rate=losses/(80*48*5);
  if(age===33)assert(rate>.025&&rate<.055,`peak ordinary loss only: ${rate}`);else assert(rate>.32&&rate<.42,`decline plus high-rating loss: ${rate}`);
 }
});
test('AI valuation includes fractional awards and generated offers keep integer manager points',()=>{
 const s=fresh();s.season=4;const t=E.team(s,'t1'),p=s.players[t.roster[0]],before=E.recruitmentValue(s,t);
 p.awards=[{type:'award_rookie',season:1,rank:1}];assert(E.recruitmentValue(s,t)>before);
 let offers=0;
 for(let i=0;i<15;i++){
  const state=fresh();state.season=3;
  for(const p of Object.values(state.players))p.awards=[{type:'award_rookie',season:1,rank:1}];
  // Give one target a materially better lineup so an offer exists.
  const target=state.players[E.team(state).roster[i%8]];target.base=Object.fromEntries(E.ATTR.map(k=>[k,10]));target.awards=[];
  E.generateOffer(state);
  for(const offer of state.trades){offers++;assert(Number.isSafeInteger(offer.pay));assert(Number.isSafeInteger(offer.receive));}
  E.validateStructure(state);
 }
 assert(offers>0);
});
