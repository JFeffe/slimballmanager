import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OnlineClient} from '../dist/online-client.js';
import * as M from '../dist/multiplayer.js';
import {relayOrigin} from '../dist/online-config.js';
const client=()=>new OnlineClient({save:async()=>{},onState(){},onStatus(){},onError(){}});
test('host creation routes static distributions to the relay and preserves Site/local APIs',async()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'location');
 try{
  for(const [href,base] of [
   ['https://jfeffe.github.io/slimballmanager/',relayOrigin],
   ['https://html-classic.itch.zone/html/12345/index.html',relayOrigin],
   ['https://html-classic.itch.zone/html/67890/index.html',relayOrigin],
   ['https://jjeff01.itch.io/slimball-manager',relayOrigin],
   [relayOrigin+'/',relayOrigin],
   ['http://localhost:5173/','http://localhost:5173'],
   ['http://127.0.0.1:8787/','http://127.0.0.1:8787'],
   ['https://notgithub.io/game/','https://notgithub.io'],
   ['https://itch.zone.example.test/game/','https://itch.zone.example.test']
  ]){
   Object.defineProperty(globalThis,'location',{configurable:true,value:{href}});
   const c=client(),state=M.createLeague('Audit','Host','wolf',551);let requested=false;
   c.request=async(path,method,data)=>{requested=true;assert.equal(c.base,base,href);assert.equal(path,'');assert.equal(method,'POST');assert.equal(data.keys.t0,state.online.keys.t0);throw Error('audit transport intercepted');};
   await assert.rejects(c.openHost(state),/audit transport intercepted/);assert.equal(requested,true);c.stop();
  }
 }finally{if(previous)Object.defineProperty(globalThis,'location',previous);else delete globalThis.location;}
});
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
