import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {relay} from '../server/relay.js';
const setup=()=>{const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));const DB={prepare(q){let v=[];return {bind(...values){v=values;return this;},run(){return sql.prepare(q).run(...v);},first(){return sql.prepare(q).get(...v)||null;},all(){return {results:sql.prepare(q).all(...v)};}};},batch(items){sql.exec('BEGIN');try{const r=items.map(s=>s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};return {DB,sql};};
const keys={t0:'a'.repeat(72),t1:'b'.repeat(72),t2:'c'.repeat(72)};
async function request(env,path,method='GET',data,key){const req=new Request('https://game.test/api/rooms'+path,{method,headers:{'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},...(data?{body:JSON.stringify(data)}:{})});const res=await relay(req,env);return {status:res.status,body:await res.json()};}
test('authenticated relay, per-player command attribution, duplicate suppression and guest read-only snapshots',async()=>{const env=setup();const create=await request(env,'','POST',{keys});assert.equal(create.status,200);const room=create.body.room;assert.equal((await request(env,'/'+room)).status,403);assert.equal((await request(env,'/'+room+'/snapshot','POST',{snapshot:'data',revision:1,allowed:['t0','t1']},keys.t1)).status,403);assert.equal((await request(env,'/'+room+'/snapshot','POST',{snapshot:'data',revision:1,allowed:['t0','t1']},keys.t0)).status,200);assert.equal((await request(env,'/'+room,'GET',null,keys.t2)).status,403);const cmd={id:'same',type:'ready',actor:'t0'};await request(env,'/'+room+'/commands','POST',cmd,keys.t1);await request(env,'/'+room+'/commands','POST',cmd,keys.t1);const poll=await request(env,'/'+room,'GET',null,keys.t0);assert.equal(poll.body.commands.length,1);assert.equal(poll.body.commands[0].actor,'t1');const guest=await request(env,'/'+room+'?since=-1','GET',null,keys.t1);assert.equal(guest.body.snapshot,'data');assert.ok(!guest.body.commands);await request(env,'/'+room+'/snapshot','POST',{snapshot:'new',revision:2,allowed:['t0','t1'],ack:poll.body.commands[0].seq},keys.t0);assert.equal((await request(env,'/'+room,'GET',null,keys.t0)).body.commands.length,0);});
test('closed/expired session cannot be restored from the relay',async()=>{const env=setup();const {body:{room}}=await request(env,'','POST',{keys});await request(env,'/'+room,'GET',null,keys.t0);await request(env,'/'+room+'/leave','POST',{},keys.t0);const p=await request(env,'/'+room,'GET',null,keys.t1);assert.ok(!p.body.presence.includes('t0'));env.sql.prepare('UPDATE relay_rooms SET expires=0 WHERE id=?').run(room);assert.equal((await request(env,'/'+room,'GET',null,keys.t1)).status,410);assert.equal(env.sql.prepare('SELECT COUNT(*) AS n FROM relay_rooms').get().n,0);assert.equal(env.sql.prepare('SELECT COUNT(*) AS n FROM relay_presence').get().n,0);});
test('out-of-order snapshot writes never roll back state or discard unapplied commands',async()=>{
 const env=setup(),{body:{room}}=await request(env,'','POST',{keys});
 await request(env,'/'+room+'/snapshot','POST',{snapshot:'first',revision:1,allowed:['t0','t1']},keys.t0);
 await request(env,'/'+room+'/commands','POST',{id:'pending',type:'ready'},keys.t1);
 let release,entered;const waiting=new Promise(r=>entered=r);
 const req=new Request('https://game.test/api/rooms/'+room+'/snapshot',{method:'POST',headers:{Authorization:'Bearer '+keys.t0}});
 req.text=()=>{entered();return new Promise(r=>release=r);};
 const delayed=relay(req,env);await waiting;
 await request(env,'/'+room+'/snapshot','POST',{snapshot:'newest',revision:3,allowed:['t0','t1']},keys.t0);
 release(JSON.stringify({snapshot:'late',revision:2,allowed:['t0','t1'],ack:999}));
 assert.equal((await delayed).status,409);
 const p=await request(env,'/'+room+'?since=0','GET',null,keys.t1);assert.equal(p.body.snapshot,'newest');assert.equal(p.body.revision,3);
 assert.equal((await request(env,'/'+room,'GET',null,keys.t0)).body.commands.length,1);
 assert.equal((await request(env,'/'+room+'/snapshot','POST',{snapshot:'conflict',revision:3,allowed:['t0','t1'],ack:999},keys.t0)).status,409);
 assert.equal((await request(env,'/'+room+'/snapshot','POST',{snapshot:'newest',revision:3,allowed:['t0','t1'],ack:999},keys.t0)).status,200);
 assert.equal((await request(env,'/'+room,'GET',null,keys.t0)).body.commands.length,0);
});
