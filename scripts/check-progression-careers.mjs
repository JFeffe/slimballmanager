import * as E from '../dist/engine.js';
import fs from 'node:fs';import assert from 'node:assert/strict';
const expected=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')).rows.filter(r=>r.seed===91500):null;
const s=E.newGame('Audit','Coach','free',91500),careers=new Map(),rows=[];
const record=()=>{for(const p of Object.values(s.players)){if(!careers.has(p.id))careers.set(p.id,{id:p.id,form:p.form,birthAge:p.age,birth:E.total(p),peak:E.total(p),peakAge:p.age,everPlayed:false});const c=careers.get(p.id);if(E.total(p)>c.peak){c.peak=E.total(p);c.peakAge=p.age;}c.everPlayed ||=p.stats.ab>0||p.history.some(h=>h.stats.ab>0);c.age=p.age;c.retired=p.retired;c.final=E.total(p);c.years=p.history.length;}};
for(let season=1;season<=20;season++){
 record();E.autoDraft(s,true);E.team(s).auto=true;while(!s.offseason){E.simulateDay(s);E.nextDay(s);}record();E.validateStructure(s);assert.deepEqual(E.auditStats(s),[]);
 const ps=s.teams.flatMap(t=>E.roster(s,t)),ids=new Set(ps.map(p=>p.id)),all=Object.values(s.players);const row={season,talent:ps.reduce((n,p)=>n+E.total(p),0)/ps.length,throw10:ps.filter(p=>p.base.throw===10).length,hits:all.reduce((n,p)=>n+p.stats.hits,0),ab:all.reduce((n,p)=>n+p.stats.ab,0)};
 E.advanceOffseason(s);record();const changes=s.summary.changes.filter(c=>ids.has(c.id));row.gains=changes.reduce((n,c)=>n+Object.values(c.delta).reduce((a,v)=>a+Math.max(0,v),0),0);row.losses=changes.reduce((n,c)=>n+Object.values(c.delta).reduce((a,v)=>a+Math.max(0,-v),0),0);
 if(expected){const ref=expected.find(r=>r.season===season);for(const k of Object.keys(row))assert.equal(row[k],ref[k],`${season}/${k}`);}
 rows.push(row);while(s.offseason)E.advanceOffseason(s);E.validateStructure(s);console.log('Verified season',season);
}
const young=[...careers.values()].filter(c=>c.birthAge<=23&&c.years>=5&&c.everPlayed),mean=a=>a.reduce((n,x)=>n+x,0)/(a.length||1);
const profiles=Object.fromEntries(E.FORMS.map(f=>{const list=young.filter(c=>c.form===f);return [f,{players:list.length,meanPeakGain:mean(list.map(c=>c.peak-c.birth)),everImproved:list.filter(c=>c.peak>c.birth).length,retired:list.filter(c=>c.retired).length}];}));
fs.writeFileSync('reports/progression-careers-1.19.json',JSON.stringify({seed:91500,years:20,experimentalReplayMatched:!!expected,profiles,rows,careers:[...careers.values()]},null,2)+'\n');console.log(profiles);
