import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';

test('walk risk decreases at every throwing skill for every batting matchup',()=>{
 for(let attack=2;attack<=20;attack++){
  const threshold=Math.floor(attack*(1+(attack-2)*5/18));let previous=1;
  for(let skill=1;skill<=10;skill++){
   const [a,b]=E.walkCheck(skill),risk=(1-skill/(skill+threshold))*a/(a+b);
   assert(risk>0&&risk<previous,`attack ${attack}, throw ${skill}`);previous=risk;
  }
 }
 assert.deepEqual(E.walkCheck(1),[11,29]);assert.deepEqual(E.walkCheck(10),[2,38]);
 const p={base:{throw:2},energy:100};let chance=()=>{const [a,b]=E.walkCheck(E.eff(p,'throw'));return a/(a+b);};
 const rested=chance();p.energy=29;assert(Math.abs(chance()-rested-0.025)<1e-12);
});

test('actual match events use the documented single walk check',()=>{
 const s=E.newGame('Control','Coach','free',501);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);E.startMatch(s,E.userMatch(s).id);
 const snapshot=E.clone(s);
 for(let skill=1;skill<=10;skill++){
  let checked=false;
  for(let seed=1;seed<=100&&!checked;seed++){
   const game=E.clone(snapshot);game.rng=seed;
   const pitcher=game.players[E.team(game,game.live.home).positions.P];pitcher.base.throw=skill;pitcher.energy=100;
   E.stepMatch(game);const event=game.live.events.at(-1),check=event.checks.find(c=>c[0]==='BB');
   if(check){assert.deepEqual(check,['BB',...E.walkCheck(skill)]);checked=true;}
  }
  assert(checked,`skill ${skill} reached walk decision`);
 }
});
