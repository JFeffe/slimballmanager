import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as E from '../dist/engine.js';
const elements=new Map(), listeners={};
function element(){return {innerHTML:'',textContent:'',className:'',classList:{add(){},remove(){},toggle(){}},querySelector(k){this.children??=new Map();if(!this.children.has(k))this.children.set(k,element());return this.children.get(k);},showModal(){},close(){}};}
const localValues=new Map();globalThis.localStorage={getItem:k=>localValues.get(k)||null,setItem(k,v){localValues.set(k,v);}};
globalThis.document={querySelectorAll:()=>[],querySelector:k=>{if(!elements.has(k))elements.set(k,element());return elements.get(k);},documentElement:{},body:element(),addEventListener(type,fn){(listeners[type]??=[]).push(fn);}};
globalThis.window={addEventListener(){},scrollTo(){}};
const file=new URL('../dist/app.js',import.meta.url);
let code=await readFile(file,'utf8');
for(const module of ['multiplayer','online-client','view-state'])code=code.replaceAll("'./"+module+".js'",JSON.stringify(new URL('../dist/'+module+'.js',import.meta.url).href));
code=code.replaceAll("'./stat-clips.js'",JSON.stringify(new URL('../dist/stat-clips.js',import.meta.url).href));
code=code.replaceAll("'./dynasty.js'",JSON.stringify(new URL('../dist/dynasty.js',import.meta.url).href));
code=code.replaceAll("'./engine.js'",JSON.stringify(new URL('../dist/engine.js',import.meta.url).href)).replaceAll("'./storage.js'",JSON.stringify(new URL('../dist/storage.js',import.meta.url).href)).replaceAll("'./i18n.js'",JSON.stringify(new URL('../dist/i18n.js',import.meta.url).href));
code=code.replaceAll("'./presentation.js'",JSON.stringify(new URL('../dist/presentation.js',import.meta.url).href));
code+='\nexport function screen(state,name,args={},archive=null,language="fr"){S=state;route=name;params=args;archiveId=archive;setLang(language);render();return app.innerHTML;}';
code+='\nexport function mockOnline(state,actor){ON.state=state;ON.actor=actor;ON.running=!!state;ON.presence=state?.online.members.map(m=>m.teamId)||[];}';
code+='\nexport function inspectState(){return S;} export function playback(){return {replayIndex,holdUntil,moment,pendingSummary};} export function seek(i){replayIndex=i;} export function finishNotices(){clearTimeout(draftNoticeTimer);draftNoticeTimer=null;draftNotices=[];draftLockUntil=0;}';
const {screen,inspectState,playback,seek,mockOnline,finishNotices}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('all menu and game screens render populated controls in three languages',()=>{let s=E.newGame('Loups <script>','Test','free',71);E.autoDraft(s,true);for(let l of ['fr','en','es']){for(let route of ['menu','new','rules','saves'])assert(screen(null,route,{},null,l).includes('<main'));for(let route of ['dashboard','team','calendar','standings','leaders','free','draft','archives','trades','trade-new','profile']){let html=screen(s,route,route==='profile'?{id:E.team(s).roster[0]}:{},null,l);assert(html.includes('<main'));assert(!html.includes('undefined'),route);assert(!html.includes('Loups <script>'),route);}}});
test('live match, finished summary, replay, season report and archive render',()=>{let s=E.newGame('Loups','Test','free',81);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);let id=E.userMatch(s).id;E.startMatch(s,id);E.stepMatch(s);assert(screen(s,'watch').includes('field-wrap'));E.simulateMatch(s,id);assert(screen(s,'match',{id}).includes('scoreboard'));assert(screen(s,'watch',{id}).includes('play-toggle'));while(s.day<47){E.simulateDay(s);E.nextDay(s);}for(let r of ['season','archives','calendar','standings','leaders','team','profile']){let html=screen(s,r,r==='profile'?{id:s.archives[0].teams[0].roster[0]}:{},r==='season'?null:1);assert(!html.includes('undefined'),r);}let match=s.archives[0].schedule[0];assert(screen(s,'match',{id:match.id},1).includes('scoreboard'));});
test('every static action identifier has an event handler',()=>{let actions=[...code.matchAll(/(?:btn|toolbarTabs)\([^\n]*?/g)];let literalActions=[...code.matchAll(/data-action="([a-z-]+)"/g)].map(m=>m[1]);let handlers=[...code.matchAll(/case '([a-z-]+)'/g)].map(m=>m[1]);for(let action of new Set(literalActions)){if(action==='modal-confirm')continue;assert(handlers.includes(action),action);}assert(actions.length>0);});

test('replacement form dispatches despite named id input shadowing form.id',()=>{
 let s=E.newGame('Loups','Test','free',81);E.autoDraft(s,true);E.makeRookies(s);let order=E.standings(s).reverse().map(t=>t.id);s.draft={order:[...order,...order],index:0,picks:[]};E.autoDraft(s);assert.equal(s.draft.order[s.draft.index],s.user);
 let tm=E.team(s),cut=tm.roster[0],rookie=s.rookies[0];screen(s,'draft');
 const NativeFormData=globalThis.FormData;
 globalThis.FormData=class{constructor(f){this.fields=f.fields;}get(k){return this.fields[k];}};
 try{const form={id:{value:rookie},getAttribute:k=>k==='id'?'replace-form':null,fields:{id:rookie,cut,draft:'true'}};for(let fn of listeners.submit)fn({preventDefault(){},target:form});
 assert(E.team(inspectState()).roster.includes(rookie));assert(!E.team(inspectState()).roster.includes(cut));assert(inspectState().free.includes(cut));assert.equal(E.team(inspectState()).roster.length,8);
 }finally{globalThis.FormData=NativeFormData;}
});
test('lineup controls are editable only for own unlocked team and summary has dashboard and game statistics',()=>{
 let s=E.newGame('Loups','Test','free',82);E.autoDraft(s,true);let html=screen(s,'team');assert(!html.includes('swap-form'));assert(html.includes('data-move-kind="bench"'));assert(html.includes('data-move-kind="offense"'));
 assert(!screen(s,'team',{id:'t1'}).includes('data-move-id'));
 E.autoDraft(s,true);while(s.day<3)E.nextDay(s);let id=E.userMatch(s).id;E.startMatch(s,id);assert(!screen(s,'team').includes('data-move-id'));assert(screen(s,'watch').includes('team-identity'));E.simulateMatch(s,id);
 html=screen(s,'match',{id});assert(html.indexOf('data-to="dashboard"',html.indexOf('<main'))<html.indexOf('data-action="replay-start"'));assert(html.includes('<th>RBI'));assert(html.includes('<th>IP</th>'));
});
test('drag and drop swaps defensive positions and replaces an active player with a bench player',()=>{
 const s=E.newGame('Loups','Test','free',94);E.autoDraft(s,true);screen(s,'team');const tm=E.team(s);tm.auto=true;
 const card=(id,kind)=>({dataset:{moveId:id,moveKind:kind},classList:{add(){},remove(){}},querySelector:()=>({setAttribute(){}}),closest(){return this;}});
 const drag=(a,b)=>{for(const fn of listeners.dragstart)fn({target:a,dataTransfer:{setData(){}}});for(const fn of listeners.drop)fn({target:b,preventDefault(){}});};
 const p=tm.positions.P,c=tm.positions.C;drag(card(p,'defense'),card(c,'defense'));assert.equal(tm.positions.P,c);assert.equal(tm.positions.C,p);assert.equal(tm.auto,false);
 const bench=tm.roster.find(id=>!tm.order.includes(id));drag(card(bench,'bench'),card(c,'defense'));assert.equal(tm.positions.P,bench);assert(tm.order.includes(bench));assert(!tm.order.includes(c));E.validate(s);
 const a=tm.order[0],b=tm.order[1],positions={...tm.positions};drag(card(a,'offense'),card(b,'offense'));assert.equal(tm.order[0],b);assert.equal(tm.order[1],a);assert.deepEqual(tm.positions,positions);
});
test('new game offers ten mascots and submits the selected identity',()=>{
 const html=screen(null,'new');assert.equal((html.match(/name="logo"/g)||[]).length,10);for(const l of E.LOGOS)assert(html.includes(`value="${l.id}"`));
 const NativeFormData=globalThis.FormData;globalThis.FormData=class{get(k){return {team:'Sharks',manager:'Coach',mode:'free',logo:'shark'}[k];}};
 try{for(const fn of listeners.submit)fn({preventDefault(){},target:{getAttribute:()=> 'new-form'}});assert.equal(E.team(inspectState()).logo,'shark');assert.equal(new Set(inspectState().teams.map(t=>t.logo)).size,6);assert(screen(inspectState(),'team').includes('data-logo="shark"'));}finally{globalThis.FormData=NativeFormData;}
});

const click=async(action,extra={})=>{finishNotices();const el={dataset:{action,...extra},closest(){return null;}};for(const fn of listeners.click)await fn({target:{closest:selector=>selector==='[data-action]'?el:null},preventDefault(){}});};
test('initial draft renders 60 candidates and guards incomplete team screens in three languages',()=>{
 const s=E.newGame('Loups <script>','Test','free',71);for(const l of ['fr','en','es']){
  const html=screen(s,'draft',{},null,l);assert(html.includes('1/8'));assert(html.includes('1/48'));assert(html.includes('draft-order'));assert(!html.includes('undefined'));assert(!html.includes('Loups <script>'));
  assert.equal((html.match(/<tr class=""/g)||[]).length,60);assert(screen(s,'team',{},null,l).includes('page-team'));assert(!screen(s,'team',{},null,l).includes('data-action="cut"'));
  assert(!screen(s,'profile',{id:s.rookies[0]},null,l).includes('undefined'));
 }
});
test('NPC step takes one pick, skip stops at user, manual choice and final simulation open team management',async()=>{
 const s=E.newGame('Loups','Test','free',71);screen(s,'draft');
 if(s.draft.order[0]===s.user)await click('draft-auto-one');
 const index=s.draft.index;await click('draft-next');assert.equal(inspectState().draft.index,index+1);
 await click('draft-until-user');assert.equal(inspectState().draft.order[inspectState().draft.index],s.user);
 const id=s.rookies.at(-1);await click('choose',{id});assert(E.team(inspectState()).roster.includes(id));
 const modal=elements.get('#modal'),oldQuery=modal.querySelector,confirmation={};modal.querySelector=()=>confirmation;
 try{await click('draft-auto');assert(inspectState().draft);confirmation.onclick();assert.equal(inspectState().draft,null);assert(elements.get('#app').innerHTML.includes('data-move-kind="bench"'));}finally{modal.querySelector=oldQuery;}
 const another=E.newGame('Loups','Test','free',81);while(another.draft.index<47)E.draftPick(another,null,null,true);screen(another,'draft');
 await click('draft-auto-one');assert.equal(inspectState().draft,null);assert(elements.get('#app').innerHTML.includes('data-move-kind="defense"'));assert(elements.get('#app').innerHTML.includes('data-move-kind="bench"'));
});
test('portrait pointer dragging swaps once with mouse, touch and pen; clicks still swap',async()=>{
 const s=E.newGame('Loups','Coach','free',122);E.autoDraft(s,true);screen(s,'team');
 const tm=E.team(s),card=id=>({dataset:{moveId:id,moveKind:'defense'},classList:{add(){},remove(){}},querySelector:()=>({setAttribute(){}})});
 const fire=(type,event)=>listeners[type].forEach(fn=>fn(event));
 for(const pointerType of ['mouse','touch','pen']){
  const a=tm.positions.P,b=tm.positions.C,source=card(a),target=card(b);
  const handle={closest:()=>source,setPointerCapture(){}};
  const event={pointerType,pointerId:1,button:0,clientX:10,clientY:10,preventDefault(){},target:{closest:sel=>sel==='.move-handle'?handle:sel==='[data-move-id]'?source:null}};
  document.elementFromPoint=()=>({closest:()=>target});
  fire('pointerdown',event);fire('pointermove',{...event,clientX:40});fire('pointerup',{...event,clientX:40});
  assert.equal(tm.positions.P,b);assert.equal(tm.positions.C,a);
  fire('click',event);assert.equal(tm.positions.P,b); // Browser click following pointerup must not undo the swap.
 }
 const a=tm.positions.P,b=tm.positions.C;
 for(const id of [a,b]){const source=card(id),handle={closest:()=>source,setPointerCapture(){}};const event={pointerType:'mouse',pointerId:2,button:0,clientX:10,clientY:10,preventDefault(){},target:{closest:sel=>sel==='.move-handle'?handle:sel==='[data-move-id]'?source:null}};fire('pointerdown',event);fire('pointerup',event);fire('click',event);}
 assert.equal(tm.positions.P,b);assert.equal(tm.positions.C,a);E.validate(s);
});
test('portrait drag outside the lineup or pointer cancellation does not change players',()=>{
 const s=E.newGame('Loups','Coach','free',123);E.autoDraft(s,true);screen(s,'team');const before=E.clone(E.team(s));
 const source={dataset:{moveId:before.positions.P,moveKind:'defense'},classList:{add(){},remove(){}},querySelector:()=>({setAttribute(){}})},handle={closest:()=>source,setPointerCapture(){}};
 const ev={pointerType:'mouse',pointerId:3,button:0,clientX:10,clientY:10,preventDefault(){},target:{closest:sel=>sel==='.move-handle'?handle:source}};
 for(const end of ['pointerup','pointercancel']){document.elementFromPoint=()=>null;for(const fn of listeners.pointerdown)fn(ev);for(const fn of listeners.pointermove)fn({...ev,clientX:60});for(const fn of listeners[end])fn(ev);assert.deepEqual(E.team(s),before);}
});


test('logo selection resets the default team name and the field remains editable',async()=>{
 screen(null,'new');
 for(const logo of E.LOGOS){
  for(const fn of listeners.change)await fn({target:{name:'logo',value:logo.id,dataset:{}}});
  const input=elements.get('#new-form input[name="team"]');assert.equal(input.value,logo.teamName);
  input.value='Mon club personnalisé';assert.equal(input.value,'Mon club personnalisé');
  assert(screen(null,'new').includes(`value="${logo.teamName}"`));
 }
});
test('profiles, free agents and archived/replayed players display their correct kit',()=>{
 const s=E.newGame('Test','Test','free',42);E.autoDraft(s,true);
 const t=E.team(s),id=t.roster[0],p=s.players[id];
 let html=screen(s,'profile',{id});assert(html.includes(`data-face="${p.portraitId}" data-kit="${t.logo}"`));
 E.cut(s,id);html=screen(s,'profile',{id});assert(html.includes(`data-face="${p.portraitId}" data-kit="none"`));
 assert(screen(s,'free').includes(`data-face="${p.portraitId}" data-kit="none"`));
 E.sign(s,id);while(s.day<3)E.nextDay(s);const match=E.userMatch(s);E.simulateMatch(s,match.id);
 const batter=s.players[match.result.events[0].batterId];
 const before=screen(s,'watch',{id:match.id});
 const oldTeam=s.teams.find(x=>x.roster.includes(batter.id)),other=s.teams.find(x=>x.id!==oldTeam.id),replacement=other.roster[0];
 oldTeam.roster=oldTeam.roster.map(x=>x===batter.id?replacement:x);other.roster[0]=batter.id;E.autoAlign(s,oldTeam);E.autoAlign(s,other);
 const after=screen(s,'watch',{id:match.id});
 const kits=html=>[...html.matchAll(/data-face="[^"]+" data-kit="[^"]+"/g)].map(x=>x[0]);
 assert.deepEqual(kits(after),kits(before));
});

test('profile navigation follows the displayed age and value sort and stops at both ends',async()=>{
 const s=E.newGame('Test','Test','free',417);E.autoDraft(s,true);
 const html=()=>elements.get('#app').innerHTML;
 const ids=()=>[...html().split('<tbody>')[1].split('</tbody>')[0].matchAll(/data-action="profile" data-id="([^"]+)"/g)].map(m=>m[1]);
 for(const key of ['age','value']){
  screen(s,'team');await click('sort',{key});const order=ids();
  assert.equal(order.length,8);
  assert.deepEqual(order.map(id=>key==='age'?s.players[id].age:E.tradeValue(s.players[id])),order.map(id=>key==='age'?s.players[id].age:E.tradeValue(s.players[id])).sort((a,b)=>key==='age'?a-b:b-a));
  await click('profile',{id:order[0]});assert(html().includes('1 / 8'));assert(html().includes('Forme de carrière'));
  await click('profile-step',{step:'-1'});assert(html().includes('1 / 8'));
  for(let i=1;i<8;i++){await click('profile-step',{step:'1'});assert(html().includes(`${i+1} / 8`));assert(html().includes(`<h2>${s.players[order[i]].name}</h2>`));}
  await click('profile-step',{step:'1'});assert(html().includes('8 / 8'));
  await click('profile-step',{step:'-1'});assert(html().includes('7 / 8'));
  await click('profile-back');assert.deepEqual(ids(),order);
 }
 screen(s,'free');await click('profile',{id:s.free[0]});assert(!html().includes('data-action="profile-step"'));
});
test('received, sent and counteroffer cards show sender players and points under offered',async()=>{
 const s=E.newGame('Test','Test','free',419);E.autoDraft(s,true);const ai=s.teams.find(tm=>tm.id!==s.user);
 for(const incoming of [true,false]){
  const from=incoming?ai:E.team(s),to=incoming?E.team(s):ai;
  const x={id:'tr999',from:from.id,to:to.id,offered:[from.roster[0]],asked:[to.roster[0]],pay:7,receive:3,status:'pending',counter:incoming};
  s.trades=[x];s.tradeHistory=[x];
  screen(s,'trades');await click('trade-tab',{tab:incoming?'received':'sent'});
  const h=elements.get('#app').innerHTML,pair=h.split('<div class="trade-pair">')[1];
  assert(pair.indexOf(s.players[x.offered[0]].name)<pair.indexOf(s.players[x.asked[0]].name));assert(pair.includes('Points : 7'));assert(pair.includes(`data-kit="${from.logo}"`));
  await click('trade-tab',{tab:'trade_history'});assert(elements.get('#app').innerHTML.includes(s.players[x.offered[0]].name));
 }
});
test('NPC field renders six portraits and all player table views include value',async()=>{
 const s=E.newGame('Test','Test','free',421);E.autoDraft(s,true);const ai=s.teams.find(tm=>tm.id!==s.user);
 const h=screen(s,'team',{id:ai.id}),defense=h.split('<figure class="park-view lineup-park"')[1].split('</figure>')[0];
 assert.equal((defense.match(/data-face=/g)||[]).length,6);assert.equal((defense.match(new RegExp(`data-kit="${ai.logo}"`,'g'))||[]).length,6);
 for(const route of ['team','free','draft'])for(const tab of ['talent','offense','defense','pitching']){screen(s,route);await click('view-tab',{tab});if(route!=='draft')assert(elements.get('#app').innerHTML.includes('data-key="value"'));}
});


test('team theme follows NPC consultation and returns to the user team in other menus',async()=>{
 const s=E.newGame('Test','Test','free',777);E.autoDraft(s,true);const ai=s.teams.find(t=>t.id!==s.user),own=E.team(s),tokens=html=>html.split('<style id="team-theme">')[1].split('</style>')[0];
 assert(tokens(screen(s,'team',{id:ai.id})).includes(`--team-main:${E.logoById(ai.logo).colors[0]}`));
 await click('profile',{id:ai.roster[0]});assert(tokens(elements.get('#app').innerHTML).includes(`--team-main:${E.logoById(ai.logo).colors[0]}`));
 await click('nav',{to:'dashboard'});assert(tokens(elements.get('#app').innerHTML).includes(`--team-main:${E.logoById(own.logo).colors[0]}`));
 assert(screen(s,'team').includes('Valeur d’échange'));assert(!tokens(screen(null,'menu')));
});
test('a real home run pauses playback, can be skipped, and leaving clears the pending interlude',async()=>{
 const s=E.newGame('Test','Test','free',778);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);const match=E.userMatch(s);E.simulateMatch(s,match.id);
 const i=match.result.events.findIndex(e=>e.type==='HR');assert(i>=0);screen(s,'watch',{id:match.id});seek(i);
 const before=E.clone(s);await click('play-step');assert(playback().moment);assert(elements.get('#app').innerHTML.includes('moment-home-run')||elements.get('#app').innerHTML.includes('moment-grand-slam'));const index=playback().replayIndex;
 await click('play-step');assert.equal(playback().replayIndex,index);assert.deepEqual(s,before);
 await click('moment-skip');assert.equal(playback().moment,null);await click('play-step');assert.equal(playback().replayIndex,index+1);
 await click('nav',{to:'dashboard'});assert.equal(playback().moment,null);assert.equal(playback().holdUntil,0);assert.equal(playback().pendingSummary,null);
});


test('winter playoffs, archived brackets and each offseason step render in all languages',async()=>{
 const s=E.newGame('Test','Coach','free',912);E.autoDraft(s,true);while(s.day<36){E.simulateDay(s);E.nextDay(s);}
 for(const language of ['fr','en','es']){const h=screen(s,'playoffs',{},null,language);assert(h.includes('playoff-bracket'));assert(!h.includes('undefined'));}
 while(s.day<47){E.simulateDay(s);E.nextDay(s);}
 assert(screen(s,'playoffs',{},1).includes('series-winner'));
 for(let i=0;i<2;i++){for(const language of ['fr','en','es']){const h=screen(s,'offseason',{},null,language);assert(h.includes('offseason-steps'));assert(!h.includes('undefined'));if(i===1){assert(!h.includes('award-grid'));assert(!h.includes('champion-banner'));}}screen(s,'offseason');await click('offseason-next');if(i===1)elements.get('#modal').querySelector('[data-action="modal-confirm"]').onclick();}
 assert(s.draft);assert(elements.get('#app').innerHTML.includes('draft-banner'));
});
test('biography, actual career clubs, NPC strategy and completed-season records render',()=>{
 const s=E.newGame('Club','Coach','free',230);E.autoDraft(s,true);const p=s.players[E.team(s).roster[0]];
 assert(screen(s,'profile',{id:p.id}).includes('Première arrivée dans la ligue'));assert(screen(s,'profile',{id:p.id}).includes('Clubs de carrière'));assert(screen(s,'team',{id:'t1'}).includes('Recrutement'));assert(screen(s,'archives').includes('Records de saison'));
});
test('playing opens an automatic report, returning from lineup refreshes it, and confirmation starts the match',async()=>{
 const s=E.newGame('Club','Coach','free',951);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);const id=E.userMatch(s).id;screen(s,'dashboard');const before=E.clone(s);await click('watch-start',{id});assert.equal(s.live,null);assert.deepEqual(s,before);assert(elements.get('#app').innerHTML.includes('Rapport d’avant-match'));
 for(const l of ['fr','en','es']){const html=screen(s,'prematch',{id},null,l);assert(html.includes('pregame-watch'));assert(!html.includes('undefined'));}
 await click('pregame-watch',{id});assert.equal(s.live.id,id);
});
test('awards ceremony and league journal render in every language and archives',()=>{
 const s=E.newGame('Club','Coach','free',952);E.autoDraft(s,true);while(!s.offseason){E.simulateDay(s);E.nextDay(s);}for(const l of ['fr','en','es'])for(const route of ['offseason','league','archives']){const html=screen(s,route,{},route==='archives'?1:null,l);assert(!html.includes('undefined'));assert(!html.includes('award_mvp'));assert(!html.includes('prize_won'));if(route!=='league')assert(html.includes(route==='offseason'?'award-presentation':'award-card'));}
});

test('development participation and free-agent history are visible in all languages',()=>{
 const s=E.newGame('Club','Coach','free',401);E.autoDraft(s,true);const p=s.players[s.free[0]];p.freeSeasons=2;
 p.journal.push({key:'free_decline',args:{stat:'contact',seasons:2},season:1},{key:'development_activity',args:{factor:25},season:1});
 for(const language of ['fr','en','es']){
  const html=screen(s,'profile',{id:p.id},null,language);assert(html.includes('development-note'));assert(!html.includes('free_decline'));assert(!html.includes('development_activity'));assert(html.includes('25'));assert(html.includes('−1'));
  assert(screen(null,'rules',{},null,language).includes('90 %')||screen(null,'rules',{},null,language).includes('90%'));
 }
});

test('diorama parks follow team identities and the host in live games and replay without using RNG',()=>{
 const s=E.newGame('Club','Coach','free',421,'wolf');E.autoDraft(s,true);const seed=s.rng;
 const gallery=screen(s,'league');for(const tm of s.teams)assert(gallery.includes(`assets/parks/${tm.logo}.webp`));
 assert(screen(s,'team',{id:s.teams[1].id}).includes(`assets/parks/${s.teams[1].logo}.webp`));
 assert.equal(s.rng,seed);
 while(s.day<3)E.nextDay(s);const game=E.userMatch(s),home=E.team(s,game.home);E.startMatch(s,game.id);
 assert.match(screen(s,'watch'),new RegExp(`--park-image:url\\('\\./assets/parks/${home.logo}\\.webp'\\).*class="field `));
 E.simulateMatch(s,game.id);assert.match(screen(s,'watch',{id:game.id}),new RegExp(`--park-image:url\\('\\./assets/parks/${home.logo}\\.webp'\\).*class="field `));
});
test('visual formation keeps six playable positions, bench, batting order and all roster statistics',()=>{
 const s=E.newGame('Club','Coach','free',425);E.autoDraft(s,true);const html=screen(s,'team');
 assert.equal((html.match(/class="field-slot"/g)||[]).length,6);
 for(const pos of E.POS)assert(html.includes(`<b>${pos}</b>`));
 for(const id of E.team(s).roster)assert(html.includes(s.players[id].name));
 assert(html.includes('player-search'));assert(html.includes('data-action="cut"'));assert(html.includes('data-move-kind="bench"'));assert(html.includes('data-move-kind="offense"'));
});

test('dashboard features reserve pitcher first and rank all eight players without duplicates',()=>{
 const s=E.newGame('Test','Test','free',961);E.autoDraft(s,true);const tm=E.team(s),ps=tm.roster.map(id=>s.players[id]);for(const p of ps)for(const k of E.ATTR)p.base[k]=1;
 const [pitch,bat,field]=ps.slice(-3);pitch.base.throw=10;pitch.base.contact=pitch.base.power=10;bat.base.contact=bat.base.power=9;field.base.catch=field.base.speed=10;
 const html=screen(s,'dashboard'),cards=[...html.matchAll(/<article class="action-card"[\s\S]*?<\/article>/g)].map(m=>m[0]);assert.equal(cards.length,3);
 for(const [i,p] of [bat,pitch,field].entries())assert(cards[i].includes(`data-id="${p.id}"`));
 const right=html.slice(html.indexOf('<div class="hero-game">'),html.indexOf('<div class="featured-players">'));assert(right.includes('data-action="next"'));assert(right.includes('data-action="month"'));
});
test('simulate asks for lineup confirmation then stays on dashboard with score',async()=>{
 const s=E.newGame('Test','Test','free',962);E.autoDraft(s,true);while(s.day<3)E.nextDay(s);const m=E.userMatch(s);screen(s,'dashboard');
 const modal=elements.get('#modal'),old=modal.querySelector,confirmation={};modal.querySelector=()=>confirmation;
 try{await click('simulate',{id:m.id});assert(!m.result);assert(modal.innerHTML.includes('Manuel'));confirmation.onclick();await new Promise(r=>setTimeout(r,60));assert(m.result);const html=elements.get('#app').innerHTML;assert(html.includes('page-dashboard'));assert(html.includes(m.result.score.join(' : ')));}finally{modal.querySelector=old;}
});
test('rejected sent trade remains visible with its decision and profile back is first',()=>{
 const s=E.newGame('Test','Test','free',963);E.autoDraft(s,true);const a=E.team(s),b=s.teams[1];
 s.tradeHistory.push({id:'tr999',from:s.user,to:b.id,offered:[a.roster[0]],asked:[b.roster[0]],pay:0,receive:0,created:0,status:'rejected',decision:{day:2,offer:10,ask:90,gain:-5,reason:'lineup'}});
 assert(screen(s,'dashboard').includes('affaiblirait'));const html=screen(s,'profile',{id:a.roster[0]});assert(html.indexOf('page-back')<html.indexOf('page-title'));assert.equal((html.match(/data-action="profile-back"/g)||[]).length,1);
});

test('championship announcement persists as dismissed and dynasty report renders in all languages',async()=>{
 const s=E.newGame('Club','Coach','free',975);E.autoDraft(s,true);while(s.day<47){E.simulateDay(s);E.nextDay(s);}assert(s.playoffs.winner);
 let h=screen(s,'dashboard');assert(h.includes('championship-overlay'));assert(h.includes('data-action="champion-dismiss"'));await click('champion-dismiss');assert.equal(s.presentation.championSeen,s.season);assert(!screen(s,'dashboard').includes('championship-overlay'));
 for(const language of ['fr','en','es']){h=screen(s,'dynasty',{},null,language);assert(h.includes('dynasty-stars'));assert(!h.includes('NaN'));assert(!h.includes('undefined'));}
});

 test('online lobby and multiplayer game views render without missing identities',async()=>{const M=await import('../dist/multiplayer.js');let state=M.createLeague('Loups','Host','wolf',121);mockOnline(state,'t0');assert(screen(M.project(state,'t0'),'online').includes('Lancer le repêchage'));mockOnline(state,'t1');assert(screen(M.project(state,'t1'),'online').includes('Confirmer mon équipe'));state=M.command(state,'t0',{id:'launch-ui',type:'launch'},['t0']);while(state.draft)state=M.command(state,'t0',{id:'draft-ui-'+state.draft.index,type:'draft',args:{auto:true}},['t0']);mockOnline(state,'t0');for(const page of ['dashboard','team','calendar','trades','saves','online']){const html=screen(M.project(state,'t0'),page);assert(!html.includes('undefined'),page);assert(html.includes('Multijoueur'),page);}mockOnline(null,null);});

test('skip button appears only on own annual draft turn and skipped picks render in history',()=>{
 const s=E.newGame('Loups','Test','free',913);
 assert(!screen(s,'draft').includes('data-action="draft-skip"'));
 E.autoDraft(s,true);E.makeRookies(s);const order=s.teams.map(t=>t.id);
 s.draft={kind:'annual',order:[...order,...order],index:0,picks:[]};
 assert(screen(s,'draft').includes('data-action="draft-skip"'));
 E.skipDraftTurn(s);const html=screen(s,'draft');
 assert(!html.includes('data-action="draft-skip"'));assert(html.includes('Tour passé'));
 E.autoDraft(s);E.skipDraftTurn(s);E.autoDraft(s);
 assert(screen(s,'draft').includes('Tour passé'));
});

test('draft hides result tabs, exposes next pick and preserves personal favorites across screens',async()=>{
 const s=E.newGame('Favorites','Coach','free',334);let html=screen(s,'draft');
 assert(!html.includes('data-action="view-tab"'));assert(html.includes('draft-next-turn'));assert(html.includes('data-key="contact"'));const id=s.rookies[0];
 await click('favorite',{id});html=screen(s,'favorites');assert(html.includes(s.players[id].name));assert.equal((html.match(/<tr class=""/g)||[]).length,1);
 s.user='t1';assert(!screen(s,'favorites').includes('data-action="profile"'));s.user='t0';assert(screen(s,'favorites').includes(s.players[id].name));
 await click('favorite',{id});assert(!screen(s,'favorites').includes('data-action="profile"'));
});
test('draft delay rejects a second immediate click without taking another pick',async()=>{
 const s=E.newGame('Draft','Coach','free',335);screen(s,'draft');finishNotices();
 const el={dataset:{action:'draft-auto-one'},closest(){return null;}},ev={target:{closest:q=>q==='[data-action]'?el:null},preventDefault(){}};
 for(const fn of listeners.click)await fn(ev);const index=inspectState().draft.index;
 for(const fn of listeners.click)await fn(ev);assert.equal(inspectState().draft.index,index);finishNotices();
});
test('ceremony advances one trophy at a time, has a podium, and separates retiring players',async()=>{
 const s=E.newGame('Awards','Coach','free',336);E.autoDraft(s,true);while(!s.offseason){E.simulateDay(s);E.nextDay(s);}
 let html=screen(s,'offseason');assert.equal((html.match(/class="award-presentation"/g)||[]).length,1);assert(html.includes('award-runner'));assert(html.includes('data-key="contact"'));assert(html.includes('data-key="era"'));
 const a=s.archives[0].awards[0];assert(html.includes(s.players[a.id].name));await click('award-next');assert(elements.get('#app').innerHTML.includes(s.players[s.archives[0].awards[1].id].name));
 E.advanceOffseason(s);const p=s.players[E.team(s).roster[0]];s.summary.retirements.push(p.id);html=screen(s,'offseason');const split=html.split('class="table-scroll"')[1];assert(!split.split('</table>')[0].includes(p.name));assert(html.includes(p.name));
});

test('rotation panel shows order, energy and projected starter with own-team editing only',async()=>{
 const s=E.newGame('Rotation','Coach','free',1882);E.autoDraft(s,true);const tm=E.team(s),ids=tm.roster.slice(0,2);E.setPitchingRotation(s,ids);tm.rotation.next=ids[0];s.players[ids[0]].energy=59;
 screen(s,'team');await click('rotation-tab');const html=elements.get('#app').innerHTML;assert(html.includes('Rotation des lanceurs'));assert(html.indexOf('team-visual-layout')<html.indexOf('id="rotation-form"'));assert(html.includes('id="rotation-form"'));assert.equal((html.match(/name="pitcher"/g)||[]).length,4);assert(html.includes('Prochain dans l’ordre'));assert(html.includes('Lanceur prévu · auto'));assert(html.includes('59/100'));
 assert(!screen(s,'team',{id:'t1'}).includes('id="rotation-form"'));while(s.day<3)E.nextDay(s);E.startMatch(s,E.userMatch(s).id);assert(!screen(s,'team').includes('id="rotation-form"'));
});
test('progression highlights changes and history adds defense, ERA and strikeout percentage',async()=>{
 const s=E.newGame('Club','Coach','free',19);E.autoDraft(s,true);const p=s.players[E.team(s).roster[0]];p.attributeHistory=[{season:1,value:30,base:{...p.base}},{season:2,value:29,base:{...p.base,contact:p.base.contact+1,power:p.base.power-1}}];
 screen(s,'profile',{id:p.id});await click('profile-tab',{tab:'progress'});let html=elements.get('#app').innerHTML;assert.match(html,/stat-rise/);assert.match(html,/stat-fall/);
 await click('profile-tab',{tab:'stats'});html=elements.get('#app').innerHTML;assert.match(html,/<th>ERA<\/th>/);assert(html.includes('<th>Retraits au bâton (%)</th>'));
});
test('skip ceremony opens trophy overview and the offseason action precedes content',async()=>{
 const s=E.newGame('Club','Coach','free',21);E.autoDraft(s,true);while(s.day<47){E.simulateDay(s);E.nextDay(s);}screen(s,'offseason');await click('award-skip');let html=elements.get('#app').innerHTML;assert.match(html,/award-grid/);assert(html.indexOf('offseason-continue')<html.indexOf('award-grid'));
});
test('ERA and WHIP start ascending, toggle descending, and keep non-pitchers last',async()=>{
 const s=E.newGame('Tri','Coach','free',1919);E.autoDraft(s,true);const ids=E.team(s).roster;
 ids.forEach((id,i)=>{const p=s.players[id];p.name='SortPlayer'+i;p.stats=E.blankStats();if(i<3){p.stats.pitchOuts=27;p.stats.earned=i*2;p.stats.pitchBB=i*3;}});
 screen(s,'team');await click('view-tab',{tab:'pitching'});await click('sort',{key:'name'});
 const order=()=>{const html=elements.get('#app').innerHTML.split('<table class="players">')[1].split('<tbody>')[1];return [...html.matchAll(/data-action="profile" data-id="([^"]+)"/g)].map(m=>m[1]);};
 for(const key of ['era','whip']){
  await click('sort',{key});let list=order();assert.deepEqual(list.slice(0,3),ids.slice(0,3));assert(list.slice(3).every(id=>ids.slice(3).includes(id)));
  await click('sort',{key});list=order();assert.deepEqual(list.slice(0,3),ids.slice(0,3).reverse());assert(list.slice(3).every(id=>ids.slice(3).includes(id)));
 }
});

test('career labels, trophy bonus and rules render in three languages with historical context',()=>{
 const s=E.newGame('Club','Coach','free',619);E.autoDraft(s,true);s.season=4;
 const p=s.players[E.team(s).roster[0]];p.form='Vétéran';p.age=21;p.base=Object.fromEntries(E.ATTR.map(k=>[k,6]));p.awards=[{type:'award_rookie',season:1,rank:1}];
 for(const [language,label,bonus] of [['fr','Longévité','+0,375'],['en','Longevity','+0.375'],['es','Longevidad','+0,375']]){
  const html=screen(s,'profile',{id:p.id},null,language);assert(html.includes(`<dd>${label}</dd>`));assert(html.includes(bonus));assert(!html.includes('26–33'));assert(html.includes('data-key="form"'));assert(html.includes('<dd>45<small'));
  const rules=screen(s,'rules',{},null,language);assert(!rules.includes('undefined'));assert(rules.includes('60'));assert(rules.includes('80'));assert(rules.includes('+6'));assert(rules.includes('34'));
 }
 s.archives=[{season:1,winner:'t0',teams:structuredClone(s.teams),players:structuredClone(s.players),schedule:[],awards:[]}];
 const old=screen(s,'profile',{id:p.id},1,'fr');assert(old.includes('+1,5'));assert(old.includes('<dd>47<small'));
});

test('fielding leaderboard explains ties and displays workload and errors',()=>{
 const s=E.newGame('Club','Coach','free',820);E.autoDraft(s,true);const p=s.players[E.team(s).roster[0]];p.stats.balls=100;p.stats.catchOuts=73;p.stats.errors=0;
 for(const [language,balls,errors,ties] of [['fr','Occasions défensives','Erreurs','plus d’occasions'],['en','Fielding chances','Errors','more fielding chances'],['es','Oportunidades defensivas','Errores','más oportunidades']]){
  const html=screen(s,'leaders',{key:'def'},null,language);assert(html.includes(`<th>${balls}</th>`));assert(html.includes(`<th>${errors}</th>`));assert(html.includes(ties));assert(html.includes('<td>73</td><td>0</td>'));
  const other=screen(s,'leaders',{key:'avg'},null,language);assert(!other.includes(`<th>${errors}</th>`));
 }
});

test('offseason progression browses every club and all clubs without changing the managed team',async()=>{
 const s=E.newGame('Club','Coach','free',821);E.autoDraft(s,true);s.offseason={stage:'development'};
 s.summary={season:1,winner:'Club',retirements:[],changes:s.teams.flatMap(tm=>tm.roster.map(id=>({id,delta:{contact:1,power:-1,catch:0,throw:0,speed:0}})))};
 const before=JSON.stringify(s),html=()=>elements.get('#app').innerHTML,ids=()=>[...html().split('<tbody>')[1].split('</tbody>')[0].matchAll(/data-action="profile" data-id="([^"]+)"/g)].map(m=>m[1]);
 screen(s,'offseason');assert.deepEqual(ids(),E.team(s).roster);
 for(const tm of s.teams){
  for(const fn of listeners.change)await fn({target:{id:'development-team',value:tm.id,dataset:{}}});
  assert.deepEqual(ids(),tm.roster);assert(html().includes('class="positive">+1'));assert(html().includes('class="warning">-1'));
 }
 for(const fn of listeners.change)await fn({target:{id:'development-team',value:'all',dataset:{}}});
 assert.equal(ids().length,48);assert.equal(JSON.stringify(s),before);
 await click('profile',{id:s.teams[1].roster[0]});await click('profile-back');assert.equal(ids().length,48);
 for(const language of ['fr','en','es']){const out=screen(s,'offseason',{developmentTeam:'t1'},null,language);assert(!out.includes('undefined'));assert(out.includes('id="development-team"'));}
});

test('solo tutorial is opt-in, contextual, saved and resumable without touching multiplayer',async()=>{
 const {decode}=await import('../dist/storage.js');
 const s=E.newGame('Tutoriel','Coach','free',71);
 assert(screen(null,'new').includes('name="tutorial"'));
 assert(!screen(s,'draft').includes('data-tutorial='));
 s.tutorial={version:1,enabled:true,minimized:false,done:[]};
 assert(screen(s,'draft').includes('data-tutorial="draft"'));
 await click('tutorial-done',{id:'draft'});
 assert(screen(s,'draft').includes('data-tutorial="inspect"'));
 screen(s,'profile',{id:s.rookies[0]});assert(s.tutorial.done.includes('inspect'));
 assert(screen(s,'draft').includes('data-tutorial="balance"'));
 await click('tutorial-minimize');assert(!screen(s,'draft').includes('data-tutorial='));
 assert(screen(s,'draft').includes('data-action="tutorial-expand"'));
 const loaded=decode(JSON.stringify({format:'SlimballManager',version:1,state:s}));
 assert.deepEqual(loaded.tutorial,s.tutorial);
 screen(loaded,'draft');await click('tutorial-expand');assert(screen(loaded,'draft').includes('data-tutorial="balance"'));
 await click('tutorial-stop');assert(!screen(loaded,'draft').includes('data-tutorial='));
 assert(screen(loaded,'saves').includes('data-action="tutorial-resume"'));
 await click('tutorial-resume');assert(screen(loaded,'draft').includes('data-tutorial="balance"'));
 const M=await import('../dist/multiplayer.js');const league=M.createLeague('Tutoriel','Coach','wolf',71);loaded.online=league.online;const before=JSON.stringify(loaded.tutorial);
 assert(!screen(loaded,'draft').includes('data-tutorial='));
 assert(!screen(loaded,'saves').includes('tutorial-settings'));
 await click('tutorial-resume');await click('tutorial-stop');assert.equal(JSON.stringify(loaded.tutorial),before);
});
test('solo tutorial follows actual lineup, rotation and first simulated match in every language',async()=>{
 const s=E.newGame('Tutoriel','Coach','free',71);E.autoDraft(s,true);
 s.tutorial={version:1,enabled:true,minimized:false,done:[]};
 screen(s,'team');await click('view-tab',{tab:'talent'});
 for(const language of ['fr','en','es']){const html=screen(s,'team',{},null,language);assert(html.includes('data-tutorial="lineup"'));assert(!html.includes('undefined'));}
 screen(s,'team');await click('auto-align');assert(s.tutorial.done.includes('lineup'));
 assert(screen(s,'team').includes('data-tutorial="order"'));await click('tutorial-done',{id:'order'});
 assert(screen(s,'team').includes('data-tutorial="rotation-open"'));await click('rotation-tab');
 assert(s.tutorial.done.includes('rotation-open'));assert(screen(s,'team').includes('data-tutorial="rotation"'));
 assert(screen(s,'dashboard').includes('data-tutorial="before"'));
 while(!E.userMatch(s))E.nextDay(s);E.simulateMatch(s,E.userMatch(s).id);
 assert(screen(s,'dashboard').includes('data-tutorial="after"'));assert(s.tutorial.done.includes('before'));
 await click('tutorial-done',{id:'after'});assert(!screen(s,'dashboard').includes('data-tutorial='));
 assert(screen(s,'free').includes('data-tutorial="free"'));
});
