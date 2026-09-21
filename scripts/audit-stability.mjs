import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import * as E from '../dist/engine.js';
import {decode} from '../dist/storage.js';
let s=E.newGame('Audit stabilité','Audit','free',191926),checks=0;
const samples=[],checkpoints=[];
function resume(label){const text=JSON.stringify({format:'SlimballManager',version:1,state:s});const start=performance.now(),loaded=decode(text);assert.deepEqual(loaded,s);s=loaded;checks++;checkpoints.push({season:s.season,label,bytes:Buffer.byteLength(text),decodeMs:Math.round(performance.now()-start)});}
resume('initial draft');
for(let year=1;year<=10;year++){
 const started=performance.now();E.autoDraft(s,true);resume('draft completed');
 while(!s.offseason){
  if(s.day===3){const m=E.userMatch(s);E.startMatch(s,m.id);E.stepMatch(s);resume('live match');const comparison=E.clone(s);E.simulateMatch(s,m.id);E.simulateMatch(comparison,m.id);assert.deepEqual(s,comparison);}
  E.simulateDay(s);assert.deepEqual(E.auditStats(s),[]);
  if(s.day===35||s.day===37)resume(s.day===35?'regular season completed':'playoffs');
  E.nextDay(s);
 }
 resume('awards');E.advanceOffseason(s);resume('development');E.advanceOffseason(s);resume('annual draft');
 const json=JSON.stringify(s),gz=gzipSync(json);
 samples.push({completedSeasons:year,players:Object.keys(s.players).length,archives:s.archives.length,saveBytes:Buffer.byteLength(json),gzipBase64Bytes:Math.ceil(gz.length/3)*4,simulationAndChecksMs:Math.round(performance.now()-started)});
 assert.equal(s.archives.length,year);assert.equal(s.season,year+1);assert(Buffer.byteLength(json)<30000000);assert(Math.ceil(gz.length/3)*4<1800000);
}
await writeFile('reports/stability-1.22.1.json',JSON.stringify({seed:191926,completedSeasons:10,exactReloads:checks,environment:'Node test container; timings include validation and assertions, not browser performance',samples,checkpoints},null,2)+'\n');
console.log(JSON.stringify({completedSeasons:10,exactReloads:checks,final:samples.at(-1)}));
