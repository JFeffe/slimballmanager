import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as E from '../dist/engine.js';
import {PORTRAITS,portraitById,appearance} from '../dist/portraits.js';
import {decode} from '../dist/storage.js';
import {ATLASES} from '../dist/portrait-atlases.js';
const encoded=s=>JSON.stringify({format:'SlimballManager',version:1,state:s});
test('sixty faces match gender, persist at every draft selection and do not depend on logo',()=>{
 const s=E.newGame(null,'Test','free',42),original=Object.fromEntries(Object.values(s.players).map(p=>[p.id,[p.name,p.portraitId]]));
 // Gender counts can change with sports RNG; each face pool must remain balanced.
 for(const gender of [0,1]){const ps=Object.values(s.players).filter(p=>p.gender===gender),pool=PORTRAITS.filter(p=>p.gender===gender);assert.equal(new Set(ps.map(p=>p.portraitId)).size,Math.min(ps.length,pool.length));const uses=pool.map(face=>ps.filter(p=>p.portraitId===face.id).length);assert(Math.max(...uses)-Math.min(...uses)<=1);}
 for(const p of Object.values(s.players)){assert.equal(portraitById(p.portraitId).gender,p.gender);assert.equal(appearance(s,p).logo,null);}
 while(s.draft){E.draftPick(s,null,null,true);const restored=decode(encoded(s));for(const p of Object.values(restored.players))assert.deepEqual([p.name,p.portraitId],original[p.id]);}
 for(const t of s.teams)for(const id of t.roster)assert.equal(appearance(s,s.players[id]).logo,t.logo);
 for(const id of s.free)assert.equal(appearance(s,s.players[id]).logo,null);
 assert.deepEqual(Object.values(E.newGame(null,'Test','free',42,'wasp').players).map(p=>p.portraitId),Object.values(s.players).map(p=>p.portraitId));
});
test('signing, release and accepted trade change clothing and preserve names and faces',()=>{
 const s=E.newGame('Mon club','Test','free',42);E.autoDraft(s,true);
 const t=E.team(s),other=E.team(s,'t1'),id=t.roster[0],p=s.players[id],identity=[p.name,p.portraitId];
 E.cut(s,id);assert.equal(appearance(s,p).logo,null);
 E.sign(s,id);assert.equal(appearance(s,p).logo,t.logo);
 const historical=E.clone({teams:s.teams,players:s.players});
 p.base=E.clone(s.players[other.roster[0]].base);p.age=s.players[other.roster[0]].age;const tr=E.propose(s,other.id,[id],[other.roster[0]],300,0);E.nextDay(s);E.nextDay(s);E.acceptTrade(s,tr.id);
 assert.equal(appearance(s,p).logo,other.logo);assert.deepEqual([p.name,p.portraitId],identity);
 assert.equal(appearance(historical,historical.players[id]).logo,t.logo);
 assert.equal(appearance(s,p,t).logo,t.logo); // replay explicitly binds the match's team
 assert.equal(appearance(s,p,null).logo,null);
 assert.deepEqual(decode(encoded(s)),s);
});
test('legacy migration is stable, preserves user name and gameplay RNG, rejects invalid face IDs',()=>{
 const s=E.newGame('Nom personnalisé','Test','free',17);E.autoDraft(s,true);
 for(const p of Object.values(s.players))delete p.portraitId;
 delete s.brandVersion;s.teams[1].name='Ancien NPC';
 const rng=s.rng,a=decode(encoded(s)),b=decode(encoded(s));assert.deepEqual(a,b);assert.equal(a.rng,rng);
 assert.equal(E.team(a).name,'Nom personnalisé');assert.equal(a.teams[1].name,E.logoById(a.teams[1].logo).teamName);
 for(const value of ['../bad','p61',7,PORTRAITS.find(x=>x.gender!==a.players.p1.gender).id]){
  const corrupt=E.clone(a);corrupt.players.p1.portraitId=value;assert.throws(()=>decode(encoded(corrupt)),/invalid_save/);
 }
});
test('all ten default identities are complete and all artwork files exist',async()=>{
 for(const logo of E.LOGOS){const s=E.newGame(undefined,'Test','free',15,logo.id);assert.equal(E.team(s).name,logo.teamName);for(const t of s.teams)assert.equal(t.name,E.logoById(t.logo).teamName);}
 for(const p of PORTRAITS){const atlas=ATLASES[p.atlas],path=atlas?`portraits/${atlas.file}`:`pilots/${p.id}.png`;const png=await readFile(new URL(`../dist/assets/${path}`,import.meta.url));assert.equal(png.readUInt32BE(16),atlas?.width||1448);assert.equal(png.readUInt32BE(20),atlas?.height||1086);}
});

test('sixty unique IDs, equal gender counts, fourteen fantasy hairstyles and no early duplicate faces',()=>{
 assert.equal(PORTRAITS.length,60);assert.equal(new Set(PORTRAITS.map(p=>p.id)).size,60);
 for(const gender of [0,1]){assert.equal(PORTRAITS.filter(p=>p.gender===gender).length,30);assert.equal(PORTRAITS.filter(p=>p.gender===gender&&p.fantasy).length,7);}
 for(const seed of [1,42,2026]){const s=E.newGame('Test','Test','free',seed);for(const gender of [0,1]){
  const players=Object.values(s.players).filter(p=>p.gender===gender);
  assert.equal(new Set(players.slice(0,30).map(p=>p.portraitId)).size,Math.min(players.length,30));
  const counts=PORTRAITS.filter(p=>p.gender===gender).map(p=>players.filter(x=>x.portraitId===p.id).length);
  assert(Math.max(...counts)-Math.min(...counts)<=1);
 }}
});
test('saved pilot identities are preserved after expansion and future rookie generation',()=>{
 const s=E.newGame('Club existant','Test','free',42);E.autoDraft(s,true);
 for(const p of Object.values(s.players))p.portraitId=p.gender?'p05':'p02';
 const original=Object.fromEntries(Object.values(s.players).map(p=>[p.id,[p.name,p.portraitId]]));
 const restored=decode(encoded(s));E.makeRookies(restored);E.ensurePortraits(restored);
 for(const [id,identity] of Object.entries(original))assert.deepEqual([restored.players[id].name,restored.players[id].portraitId],identity);
 assert(Object.values(restored.players).some(p=>Number(p.portraitId.slice(1))>6));
 const reload=decode(encoded(restored));assert.deepEqual(reload,restored);
});

test('cap patterns keep their drawn proportions and fit skull landmarks for all sixty faces',async()=>{
 const {capPlacement}=await import('../dist/cap-renderer.js');
 const {PORTRAIT_FIT}=await import('../dist/portrait-fit.js');
 const {portraitSvg}=await import('../dist/portraits.js');
 const patterns=new Set();
 for(const p of PORTRAITS){
  const c=capPlacement(p.id),[left,right,brim]=PORTRAIT_FIT[p.id];patterns.add(c.pattern);
  assert(c.scale>0);assert(Math.abs(c.x+c.form.left*c.scale-left)<1e-8);
  assert(Math.abs(c.x+c.form.right*c.scale-right)<1e-8);
  assert(Math.abs(c.y+c.form.centerBottom*c.scale-brim)<1e-8);
  assert(c.top>=-16,'cap must stay inside the portrait frame');
  for(const brand of E.LOGOS){
   const svg=portraitSvg(p.id,brand.id);
   const transform=svg.match(/data-cap-pattern="[^"]+" transform="[^"]*scale\(([^)]+)\)/);
   assert(transform,'missing fitted cap');
   assert.equal(transform[1],String(c.scale),'cap must use one uniform scale, never separate x/y stretching');
   assert(svg.includes('team-logos-transparent.png'),'original team mascot must be used');
  }
  assert(!portraitSvg(p.id).includes('data-cap-pattern'),'free agent must not wear a cap');
 }
 assert.equal(patterns.size,3);
 // These hairstyles must not cause a wider cap than the regular head example.
 for(const id of ['p08','p39'])assert(capPlacement(id).right-capPlacement(id).left<=capPlacement('p01').right-capPlacement('p01').left);
});
