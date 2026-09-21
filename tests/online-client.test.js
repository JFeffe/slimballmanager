import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OnlineClient} from '../dist/online-client.js';
import * as M from '../dist/multiplayer.js';
const client=()=>new OnlineClient({save:async()=>{},onState(){},onStatus(){},onError(){}});
test('a delayed response from a closed room cannot replace the new session',async()=>{
 const c=client();c.actor='t1';c.running=true;c.presence=['t0','t1'];
 let respond;c.request=()=>new Promise(r=>respond=r);let emitted=0;c.onState=()=>emitted++;
 const pending=c.pull();c.stop();c.actor='t2';c.running=true;c.state={id:'another-room'};c.presence=['t0','t2'];
 respond({actor:'t1',presence:['t0','t1'],revision:4});await pending;
 assert.equal(c.state.id,'another-room');assert.deepEqual(c.presence,['t0','t2']);assert.equal(emitted,0);c.stop();
});
test('session stop clears persistence and playback markers',()=>{
 const c=client();c.feedback={t1:'old'};c.lastTicks={match:123};c.lastSuccess=123;c.savedRevision=8;c.stop();
 assert.deepEqual(c.feedback,{});assert.deepEqual(c.lastTicks,{});assert.equal(c.lastSuccess,0);assert.equal(c.savedRevision,-1);
});
test('failed host save is retried before publication; duplicate command does not replay',async()=>{
 const c=client();c.state=M.createLeague('Audit','Host','wolf',550);c.actor='t0';c.running=true;c.presence=['t0'];
 let saves=0,publishes=0;c.save=async()=>{if(++saves===1)throw Error('disk full');};c.request=async()=>{publishes++;return {};};
 const cmd={id:'launch-once',type:'launch'};await assert.rejects(c.apply('t0',cmd),/disk full/);const revision=c.state.online.revision;
 await c.apply('t0',cmd);assert.equal(c.state.online.revision,revision);await c.publish();assert.equal(saves,2);assert.equal(publishes,1);assert.equal(c.savedRevision,revision);c.stop();
});
