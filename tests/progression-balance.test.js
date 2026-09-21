import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';

test('generation preserves grade budgets and initial history while keeping 10 exceptional',()=>{
 const s=E.newGame('Test','Coach','free',91800);s.players={};let tens=0;
 for(let i=0;i<20000;i++){const id=E.makePlayer(s,18,23),p=s.players[id];assert.equal(E.total(p),[40,35,30,25,20,15][E.GRADES.indexOf(p.grade)]);assert.deepEqual(p.attributeHistory[0].base,p.base);assert(E.ATTR.every(k=>p.base[k]>=1&&p.base[k]<=10));tens+=p.base.throw===10;delete s.players[id];}
 assert(tens>40&&tens<160,`THROW 10 frequency: ${tens}/20000`);
});
test('growth brake respects each crossed threshold and cannot remove points',()=>{
 for(const [before,expected] of [[5,.352],[6,.2736],[7,.1815],[8,.0808],[9,.0256]]){const s={rng:987654};let gain=0;for(let i=0;i<100000;i++)gain+=E.limitDevelopmentGain(s,before,E.developmentChange(s,{form:'Normal',age:24},1));assert(Math.abs(gain/100000-expected)<.005);}
 for(let seed=1;seed<=1000;seed++){const s={rng:seed};assert.equal(E.limitDevelopmentGain(s,9,-2),-2);assert.equal(E.limitDevelopmentGain(s,10,3),0);const before=s.rng;assert.equal(E.limitDevelopmentGain(s,5,1),1);assert.equal(s.rng,before);assert(E.limitDevelopmentGain(s,8,3)<=2);}
 const s={rng:1920};let twos=0;for(let i=0;i<100000;i++)twos+=E.limitDevelopmentGain(s,8,2)===2;assert(Math.abs(twos/100000-.25*.08)<.003);
});
test('extra decline is exactly minus one, absent below six, and retains tested probabilities',()=>{
 for(let v=1;v<=10;v++){const s={rng:91900};let losses=0;for(let i=0;i<50000;i++){const before=s.rng,out=E.applyHighRatingDecline(s,v);assert(out===v||out===v-1);if(v<=5){assert.equal(out,v);assert.equal(s.rng,before);}losses+=out<v;}assert(Math.abs(losses/50000-Math.max(0,(v-5)*.05))<.006);}
 for(const [form,age,expected] of [['Tardif',27,.56],['Jeune Étoile',21,.58]]){const s={rng:6124};let sum=0;for(let i=0;i<100000;i++){const delta=E.developmentChange(s,{form,age},1);assert(delta>=0&&delta<=2);sum+=delta;}assert(Math.abs(sum/100000-expected)<.006);}
});
test('a saved annual review restores exactly, records net changes and cannot run twice',()=>{
 const s=E.newGame('Test','Coach','free',91901);E.autoDraft(s,true);E.team(s).auto=true;while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
 const restore=x=>decode(JSON.stringify({format:'SlimballManager',version:1,state:x}));const copy=restore(s);E.advanceOffseason(s);E.advanceOffseason(copy);assert.deepEqual(s,copy);
 for(const c of s.summary.changes){const p=s.players[c.id];for(const k of E.ATTR)assert.equal(c.delta[k],p.base[k]-p.history.at(-1).base[k]);}
 const resumed=restore(s),before=Object.fromEntries(Object.values(s.players).map(p=>[p.id,{base:{...p.base},history:p.history.length}]));E.advanceOffseason(resumed);
 for(const [id,x] of Object.entries(before)){assert.deepEqual(resumed.players[id].base,x.base);assert.equal(resumed.players[id].history.length,x.history);}
 E.validateStructure(resumed);
});
