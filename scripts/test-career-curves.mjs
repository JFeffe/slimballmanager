// Experimental only: production engine is read, never modified.
// Run: node scripts/test-career-curves.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=execFileSync('git',['show','d83dd63e067a679b6568644ebd38bc8a711fa368:dist/engine.js'],{cwd:root,encoding:'utf8'});
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'slimball-career-'));
const tuned=process.argv.includes('--tuned');
const outputName=tuned?'career-curves-tuned.json':'career-curves-experiment.json';
let phaseCode=`
export function careerPhase(p){
 const a=p.age;
 switch(p.form){
 case 'Régulier':return a<=27?'growth':a<=31?'peak':'decline';
 case 'Jeune Étoile':return a<23?'growth':a<=28?'peak':'decline';
 case 'Tardif':return a<25?'early':a<=29?'growth':a<=32?'peak':'decline';
 case 'Vétéran':return a<=25?'growth':a<=33?'peak':'decline';
 case 'Éclair':return a<=22?'growth':a<=25?'peak':'decline';
 case 'Faible':return a<=25?'growth':a<=28?'peak':'decline';
 default:return a<=25?'growth':a<=29?'peak':'decline';
 }
}
function progressProb(p){
 const phase=careerPhase(p);
 if(phase==='early')return [[0,.92],[1,.08]];
 const table={
 'Normal':{growth:[[0,.68],[1,.28],[2,.04]],peak:[[-1,.08],[0,.84],[1,.08]],decline:[[-2,.04],[-1,.22],[0,.74]]},
 'Régulier':{growth:[[0,.70],[1,.30]],peak:[[-1,.03],[0,.91],[1,.06]],decline:[[-1,.18],[0,.82]]},
 'Jeune Étoile':{growth:[[0,.50],[1,.42],[2,.08]],peak:[[-1,.06],[0,.88],[1,.06]],decline:[[-2,.04],[-1,.22],[0,.74]]},
 'Tardif':{growth:[[0,.52],[1,.40],[2,.08]],peak:[[-1,.05],[0,.90],[1,.05]],decline:[[-2,.04],[-1,.22],[0,.74]]},
 'Vétéran':{growth:[[0,.76],[1,.22],[2,.02]],peak:[[-1,.04],[0,.92],[1,.04]],decline:[[-1,.14],[0,.86]]},
 'Éclair':{growth:[[0,.45],[1,.40],[2,.13],[3,.02]],peak:[[-1,.08],[0,.84],[1,.08]],decline:[[-3,.05],[-2,.13],[-1,.32],[0,.50]]},
 'Faible':{growth:[[0,.90],[1,.10]],peak:[[-1,.04],[0,.92],[1,.04]],decline:[[-2,.04],[-1,.22],[0,.74]]}
 };
 return table[p.form][phase];
}
`;
if(tuned)phaseCode=phaseCode.replace("growth:[[0,.70],[1,.30]],peak:[[-1,.03],[0,.91],[1,.06]]","growth:[[0,.75],[1,.25]],peak:[[-1,.03],[0,.94],[1,.03]]").replace("decline:[[-3,.05],[-2,.13],[-1,.32],[0,.50]]","decline:[[-3,.02],[-2,.08],[-1,.28],[0,.62]]");
function replaceOnce(text,from,to){assert(text.includes(from),`Missing patch: ${from.slice(0,90)}`);assert.equal(text.split(from).length,2);return text.replace(from,to);}
let candidate=replaceOnce(source,source.slice(source.indexOf('function progressProb(p)'),source.indexOf('export function endSeason')),phaseCode);
candidate=replaceOnce(candidate,'export const developmentFactor=games=>.25+.75*clamp(games/24,0,1);','export const developmentFactor=games=>.6+.4*clamp(games/20,0,1);');
candidate=replaceOnce(candidate,'if(rng(s)>=.7)return 0;const delta=weighted(s,progressProb(p));','const delta=weighted(s,progressProb(p));');
candidate=replaceOnce(candidate,'const before=p.base[k],delta=developmentChange(s,p,factor);','const before=p.base[k];let delta=developmentChange(s,p,factor);if(delta<0&&s.free.includes(id)&&p.age<25&&rng(s)<.5)delta=0;');
candidate=replaceOnce(candidate,'p.base[k]=applyHighRatingDecline(s,clamp(before+limitDevelopmentGain(s,before,delta),1,10));','p.base[k]=clamp(before+limitDevelopmentGain(s,before,delta),1,10);if(careerPhase(p)===\'decline\')p.base[k]=applyHighRatingDecline(s,p.base[k]);');
candidate=replaceOnce(candidate,'if(p.freeSeasons>=2){','if(p.freeSeasons>=2&&(p.age>=25||rng(s)<.5)){');
async function loadEngine(code,name){const resolved=code.replace(/from '(\.\/[^']+)'/g,(_,rel)=>`from '${pathToFileURL(path.resolve(root,'dist',rel)).href}'`);const file=path.join(temp,name+'.mjs');await fs.writeFile(file,resolved);return import(pathToFileURL(file));}
const Current=await loadEngine(source,'baseline');
const New=await loadEngine(candidate,'candidate');
const unprotected=await loadEngine(candidate.replace('if(delta<0&&s.free.includes(id)&&p.age<25&&rng(s)<.5)delta=0;','').replace('if(p.freeSeasons>=2&&(p.age>=25||rng(s)<.5)){','if(p.freeSeasons>=2){'),'unprotected');
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const round=x=>Math.round(x*1000)/1000;
const quantile=(a,q)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*q)];
const result={protocol:{sourceRevision:'d83dd63e067a679b6568644ebd38bc8a711fa368',playersPerGroup:5000,ageStart:18,ageEnd:38,activities:[0,10,20,33],cohortRetirement:false,leagueSeeds:[92600,92601,92602],leagueYears:20,youngFreeProtection:'half probability of negative ordinary changes and half chance of annual free-agent -1 before age 25; retirement unchanged'},rules:phaseCode,tuned,cohorts:[],freeTrials:[],league:[]};
const gen=Current.newGame('Test','Coach','free',819197);
const initial=[];
for(let i=0;i<5000;i++){const id=Current.makePlayer(gen,18,18);initial.push({...gen.players[id].base});delete gen.players[id];}
for(const [label,E] of (tuned?[['candidate',New]]:[['current',Current],['candidate',New]]))for(const form of E.FORMS)for(const games of (tuned?[20]:[0,10,20,33])){
 const sums=Array(21).fill(0),top=Array(21).fill(0),tens=Array(21).fill(0),gains=[],peakAges=[],peaks=[];
 for(let i=0;i<initial.length;i++){
  const s={rng:789100+i},p={form,age:18,base:{...initial[i]}};let peak=E.total(p),peakAge=18;
  for(let age=18;age<=38;age++){
   p.age=age;const idx=age-18,val=E.total(p);sums[idx]+=val;top[idx]+=val>=35; tens[idx]+=Object.values(p.base).filter(x=>x===10).length;
   if(val>peak){peak=val;peakAge=age;}
   if(age===38)break;
   for(const k of E.ATTR){const before=p.base[k],delta=E.developmentChange(s,p,E.developmentFactor(games));let after=Math.min(10,Math.max(1,before+E.limitDevelopmentGain(s,before,delta)));if(label==='current'||E.careerPhase(p)==='decline')after=E.applyHighRatingDecline(s,after);p.base[k]=after;assert(after>=1&&after<=10);}
  }
  gains.push(peak-Current.total({base:initial[i]}));peaks.push(peak);peakAges.push(peakAge);
 }
 result.cohorts.push({variant:label,form,games,curve:sums.map((v,i)=>({age:18+i,total:round(v/initial.length),share35:round(top[i]/initial.length),share10:round(tens[i]/initial.length/5)})),peakGain:round(mean(gains)),peakTotal:round(mean(peaks)),meanPeakAge:round(mean(peakAges)),peakGainP10:quantile(gains,.1),peakGainP90:quantile(gains,.9)});
}
console.log('Controlled cohorts completed:',result.cohorts.length);
await fs.writeFile(path.join(root,'reports',outputName),JSON.stringify(result,null,2));
// Real offseason path: actual retirement, free-agent loss, history and summary updates.
for(const [label,E] of (tuned?[]:[['current',Current],['candidate',New],['candidateNoProtection',unprotected]]))for(const age of [22,24,25]){
 const s=E.newGame('Free trial','Coach','free',892177);E.autoDraft(s,true);s.offseason={stage:'awards'};s.summary={season:1,changes:[],retirements:[]};s.free=[];
 for(let i=0;i<2000;i++){const id=E.makePlayer(s,age,age);const p=s.players[id];p.age=age;p.base=Object.fromEntries(E.ATTR.map(k=>[k,6]));p.form='Normal';p.freeSeasons=1;s.free.push(id);}
 const ids=[...s.free];E.advanceOffseason(s);const ps=ids.map(id=>s.players[id]);result.freeTrials.push({variant:label,age,n:ps.length,regressed:round(ps.filter(p=>E.total(p)<30).length/ps.length),meanChange:round(mean(ps.map(p=>E.total(p)-30))),retired:round(ps.filter(p=>p.retired).length/ps.length),freeLoss:round(ps.filter(p=>p.journal.some(e=>e.key==='free_decline')).length/ps.length)});console.log('Free group',label,age);
}
console.log('Free-agent trials completed');
// Verify participation breakpoints exactly and phase boundaries before expensive league runs.
for(const [games,factor] of [[0,.6],[10,.8],[20,1],[33,1]])assert.equal(New.developmentFactor(games),factor);
for(const [form,age,phase] of [['Tardif',24,'early'],['Tardif',25,'growth'],['Tardif',30,'peak'],['Tardif',33,'decline'],['Vétéran',33,'peak'],['Vétéran',34,'decline'],['Éclair',26,'decline']])assert.equal(New.careerPhase({form,age}),phase);
await fs.writeFile(path.join(root,'reports',outputName),JSON.stringify(result,null,2));
for(const [label,E] of (tuned?[['candidate',New]]:[['current',Current],['candidate',New]]))for(const seed of result.protocol.leagueSeeds){
 const s=E.newGame('Control','Coach','free',seed);
 for(let year=1;year<=20;year++){
  E.autoDraft(s,true);E.team(s).auto=true;
  while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
  E.validateStructure(s);assert.deepEqual(E.auditStats(s),[]);
  const ps=s.teams.flatMap(t=>E.roster(s,t)),all=Object.values(s.players),pa=all.reduce((a,p)=>a+p.stats.ab,0),hits=all.reduce((a,p)=>a+p.stats.hits,0);
  const row={variant:label,seed,season:year,total:round(mean(ps.map(E.total))),age:round(mean(ps.map(p=>p.age))),share10:round(ps.flatMap(p=>Object.values(p.base)).filter(v=>v===10).length/(ps.length*5)),avg:round(hits/pa),free:s.free.length,profiles:Object.fromEntries(E.FORMS.map(f=>{const pp=ps.filter(p=>p.form===f);return [f,{n:pp.length,total:pp.length?round(mean(pp.map(E.total))):null}]}))};
  E.advanceOffseason(s);row.retirements=s.summary.retirements.map(id=>{const p=s.players[id];return {form:p.form,age:p.age,free:p.journal.some(j=>j.key==='retired_free'&&j.season===s.season)}});row.netChange=round(mean(s.summary.changes.filter(c=>ps.some(p=>p.id===c.id)).map(c=>Object.values(c.delta).reduce((a,v)=>a+v,0))));
  while(s.offseason)E.advanceOffseason(s);E.validateStructure(s);result.league.push(row);
 }
 console.log('League completed',label,seed);
 await fs.writeFile(path.join(root,'reports',outputName),JSON.stringify(result,null,2));
}
await fs.rm(temp,{recursive:true,force:true});
console.log(JSON.stringify({cohorts:result.cohorts.filter(r=>r.games===20).map(({variant,form,peakGain,meanPeakAge,curve})=>({variant,form,peakGain,meanPeakAge,age24:curve[6].total,age30:curve[12].total,age34:curve[16].total})),free:result.freeTrials,league:['current','candidate'].map(variant=>{const rows=result.league.filter(r=>r.variant===variant&&r.season>=11);return {variant,total:mean(rows.map(r=>r.total)),age:mean(rows.map(r=>r.age)),share10:mean(rows.map(r=>r.share10)),avg:mean(rows.map(r=>r.avg)),netChange:mean(rows.map(r=>r.netChange))}})},null,2));
