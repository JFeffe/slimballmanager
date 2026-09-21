import {actionSvg} from './action-sprites.js';
export {actionSvg};
import {seasonAwards,progressAward,buildPreMatch,rookieEligible,awardTypes} from './league.js';
export {rookieEligible,awardTypes};
import {assignPortrait,ensurePortraits,portraitById,appearance,portraitSvg} from './portraits.js';
export {ensurePortraits,appearance,portraitSvg};
import {LOGOS,logoById,assignLogos,ensureLogos} from './logos.js';
export {LOGOS,logoById,ensureLogos};
import {DATA} from './data.js';
export const VERSION=1, POS=['P','C','GO','GE','FO','FE'], ATTR=['contact','power','catch','throw','speed'];
export const FORMS=['Normal','Faible','Vétéran','Éclair','Jeune Étoile','Régulier','Tardif'];
export const GRADES=['A+','A','B+','B','C','D'];
export const clone=x=>JSON.parse(JSON.stringify(x));
export function rng(s){let t=s.rng+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);s.rng>>>=0;return ((t^t>>>14)>>>0)/4294967296;}
const int=(s,a,b)=>a+Math.floor(rng(s)*(b-a+1));
const pick=(s,a)=>a[int(s,0,a.length-1)];
export function weighted(s,items){let r=rng(s)*items.reduce((a,x)=>a+x[1],0);for(const [v,w] of items){r-=w;if(r<0)return v;}return items.at(-1)[0];}
function shuffle(s,a){a=[...a];for(let i=a.length-1;i>0;i--){let j=int(s,0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const player=(s,id)=>s.players[id];
export const team=(s,id=s.user)=>s.teams.find(t=>t.id===id);
export const human=(s,id)=>!!s.online?.members.some(m=>m.teamId===id);
export const managed=(s,id)=>human(s,id)&&!s.online.members.find(m=>m.teamId===id).delegated;
export const roster=(s,t)=>t.roster.map(id=>player(s,id));
export const total=p=>ATTR.reduce((v,k)=>v+p.base[k],0);
export const penalty=p=>(p.energy<30?1:0)+(p.energy<10?1:0);
export const eff=(p,k)=>Math.max(1,p.base[k]-penalty(p));
export const level=s=>1+[100,300,600,1000].filter(v=>s.manager.xp>=v).length;
export const position=(t,id)=>POS.find(p=>t.positions[p]===id)||'Banc';
export const date=s=>({season:s.season,period:Math.floor(s.day/12),week:Math.floor(s.day%12/3)+1,day:s.day%3});
export const absolute=s=>(s.season-1)*48+s.day;
export function log(s,key,args={}){s.log.unshift({key,args,season:s.season,day:s.day});s.log=s.log.slice(0,150);}
export const blankStats=()=>Object.fromEntries(['ab','hits','singles','doubles','triples','hr','runs','rbi','bb','so','balls','catchOuts','throwOuts','errors','bf','pitchSO','pitchBB','allowed','earned','hitsAllowed','pitchOuts'].map(k=>[k,0]));
export const fieldingChances=p=>p.stats.catchOuts+p.stats.throwOuts+p.stats.errors;
export const fieldingErrorCheck=skillSum=>{const denominator=Math.min(500,2*(1+skillSum)**2);return [3,denominator-3];};
export function stats(p){const a=p.stats,chances=fieldingChances(p);return {...a,avg:a.ab?a.hits/a.ab:0,fieldingChances:chances,def:chances?(a.catchOuts+a.throwOuts)/chances:null,soPct:a.bf?a.pitchSO/a.bf:0,bbPct:a.bf?a.pitchBB/a.bf:0,era:a.pitchOuts?a.earned*27/a.pitchOuts:null,whip:a.pitchOuts?(a.pitchBB+a.hitsAllowed)*3/a.pitchOuts:null};}
// Keep 20% of generated 10s; redistribute the point without changing the grade budget.
function temperInitialRatings(s,base){
 for(const k of ATTR)if(base[k]===10&&rng(s)>=.2){
  base[k]=9;
  const receivers=ATTR.filter(other=>base[other]<9);
  base[pick(s,receivers)]++;
 }
}
export function makePlayer(s,lo=21,hi=30){const grade=weighted(s,GRADES.map((v,i)=>[v,[2,5,13,50,20,10][i]])),gender=int(s,0,1),id='p'+s.nextId++;const name=pick(s,gender?DATA.PRENOMS_FEMININS:DATA.PRENOMS_MASCULINS)+' '+pick(s,DATA.NOMS_DE_FAMILLE);let base=Object.fromEntries(ATTR.map(k=>[k,1]));let n=[40,35,30,25,20,15][GRADES.indexOf(grade)]-5;while(n){let k=pick(s,ATTR);if(base[k]<10){base[k]++;n--;}}temperInitialRatings(s,base);const p={id,name,gender,portrait:(gender?1:0)+2*int(s,0,1),grade,form:weighted(s,FORMS.map((v,i)=>[v,[35,12,13,6,7,17,10][i]])),age:int(s,lo,hi),birthday:int(s,0,47),side:pick(s,['Odd','Even','Switch']),base,energy:100,stats:blankStats(),history:[],awards:[],journal:[],change:{},retired:false,freeSeasons:0};p.attributeHistory=[{season:s.offseason||s.day>=24?s.season+1:s.season,base:clone(base),value:tradeValue(p,s)}];assignPortrait(s,p);s.players[id]=p;return id;}
// Read-only projection also supports saves made before pitching rotations existed.
export function pitchingRotation(s,t){
 const previous=t.rotation?.players||[],target=Math.min(t.roster.length,Math.max(2,Math.min(4,previous.length||3)));
 const players=[...new Set(previous.filter(id=>t.roster.includes(id)))];
 const candidates=roster(s,t).filter(p=>!players.includes(p.id)).sort((a,b)=>b.base.throw-a.base.throw||total(b)-total(a)||a.id.localeCompare(b.id));
 while(players.length<target)players.push(candidates.shift().id);
 const offset=Math.max(0,previous.indexOf(t.rotation?.next)),cycle=[...previous.slice(offset),...previous.slice(0,offset)];
 const next=cycle.find(id=>players.includes(id))||players[0]||null;
 return {players,next};
}
export function projectedPitcher(s,t){
 const r=pitchingRotation(s,t),i=r.players.indexOf(r.next),cycle=[...r.players.slice(i),...r.players.slice(0,i)];
 return cycle.find(id=>player(s,id).energy>=60)||cycle.reduce((best,id)=>!best||player(s,id).energy>player(s,best).energy?id:best,null);
}
export function setPitchingRotation(s,players){
 assertEditable(s);const t=team(s);
 if(!Array.isArray(players)||players.length<2||players.length>4||new Set(players).size!==players.length||players.some(id=>!t.roster.includes(id)))throw Error('invalid_rotation');
 const old=pitchingRotation(s,t);t.rotation={players:[...players],next:players.includes(old.next)?old.next:players[0]};
}
export function setNextPitcher(s,id){
 assertEditable(s);const t=team(s),r=pitchingRotation(s,t);
 if(!r.players.includes(id))throw Error('invalid_rotation');
 t.rotation={...r,next:id};
 // Update the defensive pitcher immediately, preserving the rest of a manual lineup.
 const actual=projectedPitcher(s,t),old=t.positions.P,pos=position(t,actual);
 if(actual!==old){t.positions.P=actual;if(pos!=='Banc')t.positions[pos]=old;else t.order=t.order.map(x=>x===old?actual:x);}
}
export function setPositionPreferences(s,id,preferences){
 assertEditable(s);const t=team(s);
 if(!t.roster.includes(id)||!Array.isArray(preferences)||preferences.length!==2||preferences.some((v,i)=>v!==''&&!POS.includes(v)&&!(i===0&&v==='Bench'))||preferences[0]&&preferences[0]===preferences[1])throw Error('invalid_preferences');
 (t.positionPreferences??={})[id]=[...preferences];
 if(t.auto)autoAlign(s,t);
}
export function autoAlign(s,t){
 if(t.roster.length<6)throw Error('roster_short');t.rotation=pitchingRotation(s,t);
 const pitcher=projectedPitcher(s,t),all=roster(s,t).filter(p=>p.id!==pitcher).sort((a,b)=>b.energy-a.energy||a.id.localeCompare(b.id));
 const threshold=all[4].energy,pool=all.filter(p=>p.energy>=threshold),mandatory=pool.filter(p=>p.energy>threshold).map(p=>p.id);
 const positions=['GO','FO','GE','FE','C'],scores={GO:p=>eff(p,'catch')+eff(p,'throw'),GE:p=>eff(p,'catch')+eff(p,'throw'),FO:p=>eff(p,'catch')+eff(p,'speed'),FE:p=>eff(p,'catch')+eff(p,'speed'),C:p=>eff(p,'power')+eff(p,'contact')};
 // At most 7P5 assignments. Solve jointly so an early choice cannot steal a later preferred position.
 let best=null,bestScore=-Infinity;
 function assign(ids,score){
  if(ids.length===5){if(mandatory.every(id=>ids.includes(id))&&score>bestScore){bestScore=score;best=[...ids];}return;}
  const pos=positions[ids.length];
  for(const p of pool){if(ids.includes(p.id))continue;const pref=t.positionPreferences?.[p.id]||[];
   const bonus=pref[0]===pos?50:pref[1]===pos?30:0;
   assign([...ids,p.id],score+scores[pos](p)+bonus-(pref[0]==='Bench'?100:0)+total(p)*.001);
  }
 }
 assign([],0);t.positions={P:pitcher,...Object.fromEntries(positions.map((pos,i)=>[pos,best[i]]))};
 t.order=[pitcher,...best].sort((a,b)=>eff(player(s,b),'contact')+eff(player(s,b),'power')-eff(player(s,a),'contact')-eff(player(s,a),'power'));
}
export function repair(s,t){t.rotation=pitchingRotation(s,t);const active=new Set(Object.values(t.positions));if(t.order.length!==6||new Set(t.order).size!==6||active.size!==6||t.order.some(id=>!t.roster.includes(id)||!active.has(id)))autoAlign(s,t);}
export function swap(s,a,b,kind='defense'){assertEditable(s);const t=team(s);if(a===b||!t.roster.includes(a)||!t.roster.includes(b))throw Error('invalid_player');const pa=position(t,a),pb=position(t,b);if(pa==='Banc'&&pb==='Banc')return;if(pa==='Banc'||pb==='Banc'){let active=pa==='Banc'?b:a,bench=pa==='Banc'?a:b;t.positions[position(t,active)]=bench;t.order=t.order.map(id=>id===active?bench:id);}else if(kind==='defense'){t.positions[pa]=b;t.positions[pb]=a;}else{t.order=t.order.map(id=>id===a?b:id===b?a:id);}t.auto=false;log(s,'lineup_changed');}
export function schedule(s){s.schedule=[];let ids=shuffle(s,s.teams.map(t=>t.id)),rounds=[];for(let r=0;r<5;r++){rounds.push([0,1,2].map(i=>[ids[i],ids[5-i]]));ids.splice(1,0,ids.pop());}for(let w=0;w<11;w++)for(let d=0;d<3;d++)for(let [a,b] of rounds[w%5]){if((Math.floor(w/5)+d)%2)[a,b]=[b,a];let day=3+w*3+d;s.schedule.push({id:`s${s.season}d${day}m${a}`,day,away:a,home:b,result:null});}}
export function standings(s){return [...s.teams].sort((a,b)=>b.w-a.w||b.runs-a.runs||a.name.localeCompare(b.name));}
export function makeRookies(s){s.rookies=Array.from({length:24},()=>{let id=makePlayer(s,18,23);player(s,id).age=weighted(s,[[18,10],[19,15],[20,35],[21,20],[22,15],[23,5]]);return id;});}
export function newGame(name=null,manager='Manager',mode='career',seed=Date.now(),logo='wolf'){name=name??logoById(logo)?.teamName;let s={calendarVersion:2,playoffs:null,offseason:null,version:VERSION,id:'save-'+seed,created:Date.now(),rng:seed>>>0,nextId:1,season:1,day:0,user:'t0',mode,players:{},teams:[],free:[],rookies:[],retired:[],archives:[],log:[],trades:[],tradeHistory:[],draft:null,live:null,careerResult:null,manager:{name:manager,xp:0,reputation:50,points:1000,objectives:[],completed:[]},lastMatch:null,summary:null};s.teams=[name,...shuffle(s,DATA.NOMS_EQUIPES_IA.filter(n=>n!==name)).slice(0,5)].map((name,i)=>({id:'t'+i,name,roster:[],positions:{},order:[],auto:i!==0,w:0,l:0,runs:0}));s.rookies=Array.from({length:60},()=>makePlayer(s));
const order=shuffle(s,s.teams.map(t=>t.id));
s.draft={kind:'initial',order:Array.from({length:8},(_,round)=>round%2?[...order].reverse():order).flat(),index:0,picks:[]};
schedule(s);objectives(s);log(s,'welcome');assignLogos(s,logo);return s;}
export function objectives(s){s.manager.objectives=[{type:'champion',goal:1,points:500,xp:100,done:false},{type:'wins',goal:17,points:200,xp:50,done:false},{type:'top3',goal:1,points:150,xp:30,done:false}];}
export function leaderboard(s,key){return s.teams.flatMap(t=>roster(s,t).map(p=>({...p,team:t.name,tid:t.id,metric:stats(p)[key]}))).filter(p=>key==='avg'?p.stats.ab>=10:key==='def'?fieldingChances(p)>=10:key==='soPct'?p.stats.bf>=10:key==='era'?p.stats.pitchOuts>=30:p.stats.ab>0).sort((a,b)=>(key==='era'?a.metric-b.metric:b.metric-a.metric)||(key==='def'?fieldingChances(b)-fieldingChances(a)||a.name.localeCompare(b.name):0)||a.id.localeCompare(b.id)).slice(0,10);}
function checkObjectives(s,final=false){if(s.mode!=='career')return;for(let o of s.manager.objectives){if(o.done)continue;let ok=o.type==='wins'?team(s).w>=o.goal:o.type==='champion'?final&&(s.playoffs?.winner||standings(s)[0].id)===s.user:final&&['avg','hr','rbi','def','soPct'].some(k=>leaderboard(s,k).slice(0,3).some(p=>p.tid===s.user));if(ok){o.done=true;s.manager.xp+=o.xp;s.manager.points+=o.points;s.manager.completed.push({...o,season:s.season});log(s,'objective_done',{type:o.type});}}}
export function assertEditable(s,allowInitialDraft=false){if(s.draft?.kind==='initial'&&!allowInitialDraft)throw Error('draft_required');if(s.live)throw Error('match_running');if(s.careerResult)throw Error('career_ended');}
export function sign(s,id,cutId=null){assertEditable(s);if(!s.free.includes(id))throw Error('invalid_player');const t=team(s);if(t.roster.length>=8&&!t.roster.includes(cutId))throw Error('choose_cut');if(cutId){if(!t.roster.includes(cutId))throw Error('invalid_player');removePlayer(s,t,cutId);}t.roster.push(id);player(s,id).freeSeasons=0;s.free=s.free.filter(x=>x!==id);player(s,id).journal.push({key:'joined',args:{team:t.name},season:s.season});repair(s,t);log(s,'signed',{name:player(s,id).name});}
function removePlayer(s,t,id){player(s,id).freeSeasons=0;t.roster=t.roster.filter(x=>x!==id);s.free.push(id);player(s,id).journal.push({key:'released',args:{team:t.name},season:s.season});}
export function cut(s,id){assertEditable(s);let t=team(s);if(t.roster.length<=6)throw Error('minimum_six');if(!t.roster.includes(id))throw Error('invalid_player');removePlayer(s,t,id);repair(s,t);log(s,'released',{name:player(s,id).name,team:t.name});}
// Compare complete role coverage, assigning a different player to each position.
// This rewards the missing pitcher/defender/hitter rather than only total talent.
function lineupValue(players){
 let values=Array(64).fill(-Infinity);values[0]=0;
 for(const p of players){const b=p.base,scores=[2*b.throw,b.contact+b.power,b.catch+b.throw,b.catch+b.throw,b.catch+b.speed,b.catch+b.speed];
  const next=[...values];for(let mask=0;mask<64;mask++)if(Number.isFinite(values[mask]))for(let pos=0;pos<6;pos++)if(!(mask&(1<<pos)))next[mask|(1<<pos)]=Math.max(next[mask|(1<<pos)],values[mask]+scores[pos]);values=next;
 }return Math.max(...values);
}
export function chooseDraftPlayer(s,t){
 const current=roster(s,t);let best=null,bestScore=-Infinity;
 for(const id of s.rookies){const p=player(s,id),score=s.draft?.kind==='annual'?Math.max(...(t.roster.length>=8?t.roster.map(cut=>recruitmentValue(s,t,t.roster.filter(x=>x!==cut).concat(id))):[recruitmentValue(s,t,t.roster.concat(id))])):lineupValue([...current,p])+.15*total(p);
  if(score>bestScore){best=id;bestScore=score;}
 }return best;
}
export function draftPick(s,id=null,cutId=null,auto=false){
 assertEditable(s,true);if(!s.draft)return;
 const d=s.draft,t=team(s,d.order[d.index]),initial=d.kind==='initial';
 if(!s.rookies.length){if(initial)throw Error('invalid_player');finishDraft(s);return;}
 if(initial&&cutId)throw Error('invalid_player');
 if(t.id!==s.user||auto){
  id=chooseDraftPlayer(s,t);
  if(!initial&&t.roster.length>=8)cutId=[...t.roster].sort((a,b)=>recruitmentValue(s,t,t.roster.filter(x=>x!==b).concat(id))-recruitmentValue(s,t,t.roster.filter(x=>x!==a).concat(id)))[0];
 }
 if(!s.rookies.includes(id))throw Error('invalid_player');
 if(t.roster.length>=8&&!t.roster.includes(cutId))throw Error('choose_cut');
 if(cutId){if(!t.roster.includes(cutId))throw Error('invalid_player');removePlayer(s,t,cutId);}
 t.roster.push(id);player(s,id).freeSeasons=0;s.rookies=s.rookies.filter(x=>x!==id);
 const round=Math.floor(d.index/s.teams.length)+1;
 player(s,id).journal.push({key:'drafted',args:{team:t.name},season:s.season,round,pick:d.index+1,kind:initial?'initial':'annual'});
 d.picks.push({team:t.name,teamId:t.id,id,round,pick:d.index+1});
 if(!initial)repair(s,t);
 log(s,'drafted',{name:player(s,id).name,team:t.name});
 d.index++;if(d.index===d.order.length)finishDraft(s);
}
export function skipDraftTurn(s){
 assertEditable(s,true);
 const d=s.draft;
 if(!d||d.kind==='initial'||d.order.length!==12)throw Error('invalid_draft_skip');
 if(d.order[d.index]!==s.user)throw Error('not_your_draft_turn');
 const tm=team(s),round=Math.floor(d.index/s.teams.length)+1;
 d.picks.push({team:tm.name,teamId:tm.id,id:null,skipped:true,round,pick:d.index+1});
 d.index++;if(d.index===d.order.length)finishDraft(s);
}
function finishDraft(s){
 const initial=s.draft?.kind==='initial';
 s.lastDraft=clone(s.draft?.picks||[]);s.lastDraftKind=initial?'initial':'annual';
 s.free.push(...s.rookies);s.rookies=[];s.draft=null;
 if(initial)s.teams.forEach(t=>autoAlign(s,t));
 log(s,'draft_done');
}
export function autoDraft(s,all=false){
 const remaining=s.draft?s.draft.order.length-s.draft.index:0;
 for(let count=0;s.draft&&count<remaining;count++){
  if(s.online?managed(s,s.draft.order[s.draft.index]):!all&&s.draft.order[s.draft.index]===s.user)break;
  draftPick(s,null,null,true);
 }
}
// Empty lineups are valid only while a structurally consistent initial draft runs.
function validateInitialDraft(s){
 if(s.draft?.kind!=='initial')return false;
 const fail=()=>{throw Error('invalid_save');},d=s.draft;
 if(s.season!==1||s.day!==0||s.live||s.free.length||s.retired.length||s.archives.length||s.trades.length||s.tradeHistory.length||s.schedule.some(m=>m.result))fail();
 if(!Array.isArray(d.order)||d.order.length!==48||!Number.isInteger(d.index)||d.index<0||d.index>=48||!Array.isArray(d.picks)||d.picks.length!==d.index)fail();
 const first=d.order.slice(0,6);if(new Set(first).size!==6||first.some(id=>!team(s,id)))fail();
 for(let i=0;i<48;i++)if(d.order[i]!==first[Math.floor(i/6)%2?5-i%6:i%6])fail();
 if(s.rookies.length!==60-d.index||Object.keys(s.players).length!==60||new Set(d.picks.map(p=>p.id)).size!==d.index)fail();
 for(let i=0;i<d.index;i++){const p=d.picks[i],tm=team(s,d.order[i]);if(p.teamId!==tm.id||p.team!==tm.name||p.round!==Math.floor(i/6)+1||p.pick!==i+1||!tm.roster.includes(p.id))fail();}
 for(const tm of s.teams){const ids=d.picks.filter(p=>p.teamId===tm.id).map(p=>p.id);if(tm.roster.length!==ids.length||tm.roster.some((id,i)=>id!==ids[i])||Object.keys(tm.positions).length||tm.order.length)fail();}
 return true;
}
export const todayMatches=s=>s.schedule.filter(m=>m.day===s.day);
export const userMatch=s=>todayMatches(s).find(m=>m.away===s.user||m.home===s.user);
export function startMatch(s,id){return withPlayoffStats(s,s.schedule.find(m=>m.id===id)?.playoff,()=>startMatchCore(s,id));}
function startMatchCore(s,id){if(s.live)throw Error('match_running');if(s.careerResult)throw Error('career_ended');if(s.draft)throw Error('draft_required');let m=s.schedule.find(m=>m.id===id);if(!m||m.day!==s.day||m.result)throw Error('match_unavailable');for(let tid of [m.away,m.home]){let t=team(s,tid);repair(s,t);if(t.auto)autoAlign(s,t);}s.live={id,away:m.away,home:m.home,inning:1,half:0,outs:0,bases:[null,null,null],score:[0,0],box:[[],[]],indices:[0,0],events:[],virtualOuts:0,done:false,statStart:Object.fromEntries([m.away,m.home].flatMap(tid=>team(s,tid).roster).map(id=>[id,clone(player(s,id).stats)])),lineups:[m.away,m.home].map(tid=>{const t=team(s,tid);return {id:tid,order:[...t.order],positions:{...t.positions}};})};}
// Conditional on no strikeout: 27.5% at throw 1, declining by 2.5 points per skill to 5% at 10.
export function walkCheck(throwSkill){const skill=clamp(Math.floor(throwSkill),1,10);return [12-skill,28+skill];}
function slim(s,a,b){a=Math.floor(a);b=Math.floor(b);return int(s,1,Math.max(1,a+b))<=a;}
const BRT={P:[[10,4,0],[4,22,0]],C:[[12,6,0],[6,22,0]],GO:[[9,6,0],[4,20,0]],GE:[[9,4,0],[4,22,0]],FO:[[12,20,4],[7,22,10]],FE:[[12,20,4],[7,22,10]]};
export function advanceBases(l,type,batter){let scored=[];if(type==='BB'){if(l.bases[0]){if(l.bases[1]){if(l.bases[2])scored.push(l.bases[2]);l.bases[2]=l.bases[1];}l.bases[1]=l.bases[0];}l.bases[0]={id:batter,unearned:false};}else{let n={E:1,'1B':1,'2B':2,'3B':3,HR:4}[type];for(let i=2;i>=0;i--){if(l.bases[i]){if(i+n>=3)scored.push(l.bases[i]);else l.bases[i+n]=l.bases[i];l.bases[i]=null;}}if(n===4)scored.push({id:batter,unearned:false});else l.bases[n-1]={id:batter,unearned:type==='E'};}return scored;}
export function stepMatch(s){const m=s.schedule.find(m=>m.id===s.live?.id);const e=withPlayoffStats(s,m?.playoff,()=>stepMatchCore(s));if(m?.result&&!s.live)recordLeagueNews(s,m);return e;}
function stepMatchCore(s){let l=s.live;if(!l||l.done)throw Error('match_unavailable');const off=team(s,l.half?l.home:l.away),def=team(s,l.half?l.away:l.home);let f=player(s,off.order[l.indices[l.half]]),p=player(s,def.positions.P);f.energy=clamp(f.energy-1,0,100);p.energy=clamp(p.energy-1,0,100);p.stats.bf++;let checks=[],type,where=null,defender=p.name;const stat=(p,k)=>eff(p,k);const ft=stat(f,'contact')+stat(f,'power'),threshold=ft*(1+(ft-2)*5/18);checks.push(['K',stat(p,'throw'),Math.floor(threshold)]);if(slim(s,stat(p,'throw'),threshold)){type='K';f.stats.so++;f.stats.ab++;p.stats.pitchSO++;}else{let [walk,control]=walkCheck(stat(p,'throw'));checks.push(['BB',walk,control]);if(slim(s,walk,control)){type='BB';f.stats.bb++;p.stats.pitchBB++;}else{f.stats.ab++;let power=!slim(s,stat(f,'contact'),stat(f,'power'));let zones=[...POS,...(f.side==='Odd'?['GO','FO']:f.side==='Even'?['GE','FE']:[])];if(stat(f,'power')>stat(f,'contact'))zones.push('FO','FO','FO','FE','FE','FE','GE','GE','GO','GO','P','C');else if(stat(f,'contact')>stat(f,'power'))zones.push('FO','FO','FE','FE','GE','GE','GE','GO','GO','GO','P','C');where=pick(s,zones);let d=player(s,def.positions[where]),diff=BRT[where][power?1:0];defender=d.name;d.energy=clamp(d.energy-1,0,100);d.stats.balls++;let ed=stat(d,'catch')+stat(d,'speed');const [error,control]=fieldingErrorCheck(ed);checks.push(['E',error,control]);if(rng(s)<error/(error+control)){type='E';d.stats.errors++;}else{checks.push(['C',stat(d,'catch'),diff[0]]);if(slim(s,stat(d,'catch'),diff[0])){type='C';d.stats.catchOuts++;}else{checks.push(['T',stat(d,'throw'),diff[1]]);if(slim(s,stat(d,'throw'),diff[1])&&!slim(s,stat(f,'speed'),stat(d,'throw')+13)){type='T';d.stats.throwOuts++;}else{type=power?weighted(s,[['1B',stat(d,'speed')+1],['2B',stat(f,'contact')+1],['3B',stat(f,'power')+1],['HR',diff[2]+stat(f,'power')+1]]):weighted(s,[['1B',stat(f,'contact')*2+5],['2B',stat(f,'contact')+1]]);if(type==='1B'&&slim(s,stat(f,'speed'),23))type='2B';f.stats.hits++;f.stats[{ '1B':'singles','2B':'doubles','3B':'triples',HR:'hr'}[type]]++;p.stats.hitsAllowed++;}}}}}
let runs=0;const out=['K','C','T'].includes(type);if(out){l.outs++;l.virtualOuts++;p.stats.pitchOuts++;}else{if(type==='E')l.virtualOuts++;let scored=advanceBases(l,type,f.id);runs=scored.length;for(let runner of scored){player(s,runner.id).stats.runs++;if(!runner.unearned&&type!=='E'&&l.virtualOuts<3)p.stats.earned++;}p.stats.allowed+=runs;if(type!=='E')f.stats.rbi+=runs;l.score[l.half]+=runs;}l.box[l.half][l.inning-1]=(l.box[l.half][l.inning-1]||0)+runs;
const e={inning:l.inning,half:l.half,outs:l.outs,batter:f.name,batterId:f.id,pitcher:p.name,pitcherId:p.id,defender,type,where,runs,score:[...l.score],bases:clone(l.bases),checks};l.events.push(e);l.indices[l.half]=(l.indices[l.half]+1)%6;
if(l.half===1&&l.inning>=6&&l.score[1]>l.score[0])l.done=true;
else if(l.outs===3){if(l.half===0&&l.inning>=6&&l.score[1]>l.score[0])l.done=true;else if(l.half===1&&l.inning>=6&&l.score[0]!==l.score[1])l.done=true;else{if(l.half){l.half=0;l.inning++;}else l.half=1;l.outs=0;l.virtualOuts=0;l.bases=[null,null,null];}}
if(l.done)finishMatch(s);return e;}
export function compactResult(r){if(!r)return r;let out={id:r.id,away:r.away,home:r.home,score:r.score,box:r.box,winner:r.winner,done:true,gameStats:r.gameStats,highlights:(r.events||r.highlights||[]).filter(e=>e.runs).slice(-5).map(({inning,half,batter,batterId,type,where,runs,score,outs})=>({inning,half,batter,batterId,type,where,runs,score,outs}))};return out;}
function finishMatch(s){let l=s.live,m=s.schedule.find(m=>m.id===l.id),win=l.score[0]>l.score[1]?l.away:l.home;if(!m.playoff){team(s,win).w++;team(s,win===l.away?l.home:l.away).l++;team(s,l.away).runs+=l.score[0];team(s,l.home).runs+=l.score[1];}let gameStats=l.statStart?l.lineups.map(tm=>({id:tm.id,players:tm.order.map(id=>({id,name:player(s,id).name,pos:POS.find(pos=>tm.positions[pos]===id),value:tradeValue(player(s,id),s),stats:Object.fromEntries(Object.keys(blankStats()).map(k=>[k,player(s,id).stats[k]-l.statStart[id][k]]))}))})):null;
// Advance once, from the actual starter, including manual lineups and resumed games.
for(const lineup of l.lineups){const t=team(s,lineup.id);t.rotation=pitchingRotation(s,t);const i=t.rotation.players.indexOf(lineup.positions.P);if(i>=0)t.rotation.next=t.rotation.players[(i+1)%t.rotation.players.length];}
m.result={...clone(l),winner:win,gameStats};delete m.result.statStart;for(let tid of [l.away,l.home]){let t=team(s,tid);for(let id of t.roster)if(!t.order.includes(id))player(s,id).energy=100;}if([l.away,l.home].includes(s.user)){if(s.lastMatch&&!s.online){let previous=s.schedule.find(x=>x.id===s.lastMatch);if(previous)previous.result=compactResult(previous.result);}s.lastMatch=m.id;if(s.mode==='career'){s.manager.xp+=win===s.user?10:3;s.manager.reputation=clamp(s.manager.reputation+(win===s.user?2:-1),0,100);}}if(s.online){for(const tid of [l.away,l.home])if(human(s,tid))s.online.lastMatches[tid]=m.id;}else if(![l.away,l.home].includes(s.user))m.result=compactResult(m.result);log(s,'match_result',{away:team(s,l.away).name,home:team(s,l.home).name,a:l.score[0],h:l.score[1]});s.live=null;if(m.playoff)recordPlayoff(s,m);else checkObjectives(s);}
export function simulateMatch(s,id){if(!s.live)startMatch(s,id);let n=0;while(s.live){stepMatch(s);if(n++>20000)throw Error('simulation_limit');}}
export function simulateDay(s){assertEditable(s);if(s.draft)throw Error('draft_required');for(let m of todayMatches(s))if(!m.result)simulateMatch(s,m.id);}
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
 'Régulier':{growth:[[0,.75],[1,.25]],peak:[[-1,.03],[0,.94],[1,.03]],decline:[[-1,.18],[0,.82]]},
 'Jeune Étoile':{growth:[[0,.50],[1,.42],[2,.08]],peak:[[-1,.06],[0,.88],[1,.06]],decline:[[-2,.04],[-1,.22],[0,.74]]},
 'Tardif':{growth:[[0,.52],[1,.40],[2,.08]],peak:[[-1,.05],[0,.90],[1,.05]],decline:[[-2,.04],[-1,.22],[0,.74]]},
 'Vétéran':{growth:[[0,.76],[1,.22],[2,.02]],peak:[[-1,.04],[0,.92],[1,.04]],decline:[[-1,.14],[0,.86]]},
 'Éclair':{growth:[[0,.45],[1,.40],[2,.13],[3,.02]],peak:[[-1,.08],[0,.84],[1,.08]],decline:[[-3,.02],[-2,.08],[-1,.28],[0,.62]]},
 'Faible':{growth:[[0,.90],[1,.10]],peak:[[-1,.04],[0,.92],[1,.04]],decline:[[-2,.04],[-1,.22],[0,.74]]}
 };
 return table[p.form][phase];
}
export function endSeason(s){if(s.archives.some(a=>a.season===s.season))return;if(s.calendarVersion===2&&!s.playoffs?.winner)throw Error('playoffs_required');const winner=s.playoffs?.winner?team(s,s.playoffs.winner):standings(s)[0];for(let id of winner.roster)player(s,id).awards.push({season:s.season,type:'champion',rank:1});const prizes=seasonAwards(s);for(const a of prizes)grantAward(s,a); checkObjectives(s,true);const archive={awards:clone(prizes),leagueNews:clone((s.leagueNews||[]).filter(e=>e.season===s.season)),playoffs:clone(s.playoffs||null),season:s.season,teams:clone(s.teams),players:clone(Object.fromEntries(s.teams.flatMap(t=>t.roster).map(id=>[id,player(s,id)]))),schedule:s.schedule.map(m=>({...clone(m),result:compactResult(m.result)})),winner:winner.id};for(const a of prizes)for(const id of [a.id,...(a.podium||[]).map(p=>p.id)])if(!archive.players[id])archive.players[id]=clone(player(s,id));s.archives.push(archive);s.summary={season:s.season,winner:winner.name,changes:[],retirements:[]};if(s.mode==='career'){if(winner.id===s.user)s.careerResult='won';else if(s.season>=10)s.careerResult='lost';else if(s.manager.reputation<20)s.careerResult='dismissed';}s.offseason={stage:'awards'};log(s,'season_done',{name:winner.name});}
// Actual completed regular-season appearances, including games for a previous club.
export function seasonParticipation(s){
 const counts=new Map();let missing=false;
 for(const m of s.schedule){if(m.playoff||!m.result)continue;
  if(!m.result.gameStats){missing=true;continue;}
  const ids=new Set(m.result.gameStats.flatMap(t=>t.players.map(p=>p.id)));
  for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
 }
 // Old saves may predate individual box scores. Conservative estimate from season PA.
 if(missing)for(const p of Object.values(s.players))counts.set(p.id,Math.max(counts.get(p.id)||0,Math.min(33,Math.floor((p.stats.ab+p.stats.bb)/3))));
 return {counts,estimated:missing};
}
export const developmentFactor=games=>.6+.4*clamp(games/20,0,1);
export function freeRetirementChance(p,seasons=p.freeSeasons||0){return Math.min(.9,.15*seasons+(p.age>=30?.25:p.age>=27?.15:0)+(total(p)<28?.25:total(p)<32?.15:0));}
function retirePlayer(s,p,key='retired'){
 p.retired=true;s.retired.push(p.id);s.free=s.free.filter(id=>id!==p.id);
 s.teams.forEach(t=>t.roster=t.roster.filter(id=>id!==p.id));s.summary.retirements.push(p.id);
 const args={age:p.age,seasons:p.freeSeasons||0};p.journal.push({key,args,season:s.season});
 if(key==='retired_free')log(s,key,{...args,name:p.name});
}
export function developmentChange(s,p,factor){const delta=weighted(s,progressProb(p));return delta>0&&rng(s)>=factor?0:delta;}
// Each positive point must clear its own threshold; stop on the first failure.
export function limitDevelopmentGain(s,before,delta){
 if(delta<=0)return delta;
 let kept=0;
 for(let i=0;i<delta&&before+kept<10;i++){
  const value=before+kept,prob=value<6?1:value===6?.80:value===7?.55:value===8?.25:.08;
  if(prob<1&&rng(s)>=prob)break;
  kept++;
 }
 return kept;
}
// Applied after ordinary development only in the career decline phase, before retirement.
export const highRatingDeclineChance=value=>Math.max(0,(value-5)*.05);
export function applyHighRatingDecline(s,value){
 const chance=highRatingDeclineChance(value);
 if(chance>0&&rng(s)<chance)return value-1;
 return value;
}
function developPlayers(s){
 const ids=[...new Set([...s.teams.flatMap(t=>t.roster),...s.free])],participation=seasonParticipation(s);
 for(const id of ids){
  const p=player(s,id),games=participation.counts.get(id)||0,factor=developmentFactor(games);
  if(!s.free.includes(id))p.freeSeasons=0;
  p.history.push({season:s.season,playoffStats:clone(p.playoffStats||blankStats()),value:tradeValue(p,s),stats:clone(p.stats),base:clone(p.base),team:s.teams.find(t=>t.roster.includes(id))?.name||null,development:{games,factor,estimated:participation.estimated,rules:2}});
  p.change={};
  for(const k of ATTR){const before=p.base[k];let delta=developmentChange(s,p,factor);if(delta<0&&s.free.includes(id)&&p.age<25&&rng(s)<.5)delta=0;
   p.base[k]=clamp(before+limitDevelopmentGain(s,before,delta),1,10);if(careerPhase(p)==='decline')p.base[k]=applyHighRatingDecline(s,p.base[k]);p.change[k]=p.base[k]-before;
  }
  s.summary.changes.push({id,name:p.name,delta:clone(p.change),games,factor});
  p.journal.push({key:'development_activity',args:{factor:Math.round(factor*100)},season:s.season});
  let chance=p.age>=33?.15:p.age===32?.10:p.age===31?.05:p.age===30?.02:0;
  if(p.age>=28&&total(p)<28)chance+=.2;
  if(rng(s)<chance)retirePlayer(s,p);
 }
 // Historical second pass, only for free agents surviving ordinary retirement.
 for(const id of [...s.free]){
  const p=player(s,id);p.freeSeasons=(p.freeSeasons??0)+1;
  if(p.freeSeasons>=2&&(p.age>=25||rng(s)<.5)){const k=pick(s,ATTR),before=p.base[k];p.base[k]=Math.max(1,before-1);
   p.change[k]+=p.base[k]-before;s.summary.changes.find(c=>c.id===id).delta=clone(p.change);
   if(p.base[k]<before)p.journal.push({key:'free_decline',args:{stat:k,seasons:p.freeSeasons},season:s.season});
  }
  if(rng(s)<freeRetirementChance(p))retirePlayer(s,p,'retired_free');
 }
}
export function advanceOffseason(s){if(s.live)throw Error('match_running');if(!s.offseason)throw Error('offseason_required');if(s.offseason.stage==='awards'){developPlayers(s);
const improved=progressAward(s);if(improved)grantAward(s,improved);for(let t of s.teams){while(t.roster.length<6){let available=s.free.sort((a,b)=>total(player(s,b))-total(player(s,a)));let id=available.shift()||makePlayer(s,18,23);t.roster.push(id);player(s,id).freeSeasons=0;player(s,id).journal.push({key:'joined',args:{team:t.name},season:s.season});}repair(s,t);}s.offseason.stage='development';}else if(['development','recruitment','ready'].includes(s.offseason.stage)){assertEditable(s);if(!s.rookies.length)makeRookies(s);npcRecruitment(s,true);s.offseason.stage='ready';startNewSeason(s);}else throw Error('invalid_save');}

export function startNewSeason(s){assertEditable(s);ensureAttributeHistory(s);if(s.live||s.draft)throw Error('match_running');if(s.calendarVersion===2&&s.offseason?.stage!=='ready')throw Error('offseason_required');s.day=0;s.season++;s.calendarVersion=2;s.playoffs=null;s.offseason=null;s.summary=null;for(let p of Object.values(s.players))if(!p.retired){p.stats=blankStats();p.playoffStats=blankStats();p.energy=100;if(p.birthday===0){p.age++;log(s,'birthday',{name:p.name,age:p.age});}}for(const p of Object.values(s.players))if(!p.retired){const entry={season:s.season,base:clone(p.base),value:tradeValue(p,s)};p.attributeHistory=p.attributeHistory.filter(h=>h.season!==s.season);p.attributeHistory.push(entry);}let lastOrder=standings(s).reverse().map(t=>t.id);s.teams.forEach(t=>{t.w=0;t.l=0;t.runs=0;});schedule(s);s.draft={kind:'annual',order:[...lastOrder,...lastOrder],index:0,picks:[]};objectives(s);s.lastMatch=null;}
export function ensureSeason(s){if(s.calendarVersion==null&&s.day<36&&!s.archives.some(a=>a.season===s.season))s.calendarVersion=2;return s;}
export function nextDay(s){assertEditable(s);ensureSeason(s);if(s.draft)throw Error('draft_required');if(s.offseason)throw Error('offseason_required');let m=userMatch(s);if(m&&!m.result)throw Error('play_first');simulateDay(s);s.day++;if(s.day>=24&&s.day<=47&&!s.rookies.length)makeRookies(s);
 if(s.calendarVersion===2){if(s.day===36)beginPlayoffs(s);if(s.day===47)endSeason(s);}else if(s.day===48){if(!s.rookies.length)makeRookies(s);startNewSeason(s);}
 for(let p of Object.values(s.players)){if(!p.retired&&!s.rookies.includes(p.id)&&s.day!==0&&p.birthday===s.day){p.age++;log(s,'birthday',{name:p.name,age:p.age});}}if(todayMatches(s).length===0)for(let p of Object.values(s.players))if(!p.retired)p.energy=100;processTrades(s);npcRecruitment(s);if(!s.careerResult&&rng(s)<.08)generateOffer(s);}

export function simulatePeriod(s){assertEditable(s);let period=Math.floor(s.day/12),season=s.season;for(let i=0;i<12&&!s.careerResult;i++){if(s.draft||s.offseason)break;simulateDay(s);nextDay(s);if(s.season!==season||Math.floor(s.day/12)!==period)break;}}
// Latest completed season: award presentation advances the reference immediately;
// the following spring keeps it unchanged. Archives evaluate their own season.
export const awardReferenceSeason=s=>s.offseason||s.winner||s.archives?.some(a=>a.season===s.season)?s.season:s.season-1;
export const TROPHY_VALUES=Object.freeze({award_mvp:3,award_bat:2,award_pitcher:2,award_glove:2,award_rookie:1.5});
export function trophyBonus(p,context){
 const reference=typeof context==='number'?context:context?awardReferenceSeason(context):null;
 if(reference==null)return 0;
 let bonus=0;const seen=new Set();
 for(const a of p.awards||[]){const age=reference-a.season,key=a.season+':'+a.type;
  if(a.rank!==1||!Object.hasOwn(TROPHY_VALUES,a.type)||age<0||age>2||seen.has(key))continue;
  seen.add(key);bonus+=TROPHY_VALUES[a.type]/2**age;
 }
 return Math.min(6,bonus);
}
// Preserve the existing base value; retain fractional trophy bonuses for decisions.
export const tradeValue=(p,context)=>Math.floor(total(p)*Math.max(.5,1.5-(p.age-21)*.05))+trophyBonus(p,context);
export function propose(s,to,offered,asked,pay=0,receive=0){assertEditable(s);if(!team(s,to)||to===s.user)throw Error('invalid_trade');let t={id:'tr'+s.nextId++,from:s.user,to,offered:[...new Set(offered)],asked:[...new Set(asked)],pay:Number(pay),receive:Number(receive),created:absolute(s),status:'pending'};validateTrade(s,t);s.trades.unshift(t);log(s,'trade_sent',{team:team(s,to).name});return t;}
function validateTrade(s,t){let a=team(s,t.from),b=team(s,t.to);if(!a||!b||a===b||!t.offered.length&&!t.asked.length)throw Error('invalid_trade');if(t.offered.some(id=>!a.roster.includes(id))||t.asked.some(id=>!b.roster.includes(id)))throw Error('trade_stale');if([t.pay,t.receive].some(v=>!Number.isSafeInteger(v)||v<0))throw Error('invalid_points');let cost=t.from===s.user?t.pay:t.receive;if(cost>s.manager.points)throw Error('not_enough_points');if(s.online){for(const [tid,cost] of [[t.from,t.pay],[t.to,t.receive]])if(human(s,tid)&&cost>s.online.managers[tid].points)throw Error('not_enough_points');if([t.from,t.to].some(tid=>Object.values(s.online.lives).some(l=>[l.away,l.home].includes(tid))))throw Error('match_running');}let na=a.roster.length-t.offered.length+t.asked.length,nb=b.roster.length-t.asked.length+t.offered.length;if(na<6||na>8||nb<6||nb>8)throw Error('trade_roster');}
export function acceptTrade(s,id){assertEditable(s);let t=s.trades.find(t=>t.id===id);if(!t||!(t.to===s.user&&t.status==='pending'||t.from===s.user&&t.status==='accepted'))throw Error('invalid_trade');validateTrade(s,t);let a=team(s,t.from),b=team(s,t.to);a.roster=a.roster.filter(id=>!t.offered.includes(id)).concat(t.asked);b.roster=b.roster.filter(id=>!t.asked.includes(id)).concat(t.offered);if(s.online){for(const [tid,delta] of [[t.from,t.receive-t.pay],[t.to,t.pay-t.receive]])if(human(s,tid))s.online.managers[tid].points+=delta;}else s.manager.points+=t.from===s.user?t.receive-t.pay:t.pay-t.receive;for(let [ids,target] of [[t.offered,b],[t.asked,a]])for(let id of ids)player(s,id).journal.push({key:'traded',args:{team:target.name},season:s.season});repair(s,a);repair(s,b);closeTrade(s,t,'completed');log(s,'trade_completed',{team:t.from===s.user?b.name:a.name});}
function closeTrade(s,t,status){t.status=status;s.tradeHistory.unshift(clone(t));s.trades=s.trades.filter(x=>x.id!==t.id);}
export function refuseTrade(s,id){assertEditable(s);let t=s.trades.find(t=>t.id===id);if(t)closeTrade(s,t,'refused');}
export function processTrades(s){for(let t of [...s.trades]){if(absolute(s)-t.created>7){closeTrade(s,t,'expired');continue;}try{validateTrade(s,t);}catch{closeTrade(s,t,'stale');continue;}if(managed(s,t.to)||t.from!==s.user||t.status!=='pending'||absolute(s)-t.created<2)continue;let offer=t.offered.reduce((n,id)=>n+tradeValue(player(s,id),s),t.pay),ask=t.asked.reduce((n,id)=>n+tradeValue(player(s,id),s),t.receive);let ratio=ask?offer/ask:2;const quality=t.offered.length?t.offered.reduce((n,id)=>n+tradeValue(player(s,id),s)/30,0)/t.offered.length:0;let score=(ratio>=.85&&ratio<=1.15?40:ratio>1.2?50:ratio<.8?-20:0)+Math.min(1,quality)*20+rng(s)*20-10;let ai=team(s,t.to);for(let id of t.offered){let p=player(s,id);if(p.base.throw>player(s,ai.positions.P).base.throw)score+=10;if(total(p)>=25)score+=6;}const gain=recruitmentValue(s,ai,ai.roster.filter(id=>!t.asked.includes(id)).concat(t.offered))-recruitmentValue(s,ai);score+=Math.max(-40,Math.min(30,gain*8));t.decision={day:absolute(s),offer,ask,gain,score,reason:gain<-.5?'lineup':'value'};if(gain>=-.5&&(score>=70||ratio>=1.2)){t.decision.reason='accepted';t.status='accepted';log(s,'trade_answer',{team:ai.name});}else if(gain>=-.5&&(score>=40||ratio>=.75)){t.decision.reason='countered';let counter={...clone(t),id:'tr'+s.nextId++,from:t.to,to:t.from,offered:t.asked,asked:t.offered,pay:t.receive,receive:t.pay,created:absolute(s),status:'pending',counter:true};counter.receive+=Math.max(0,Math.ceil(ask-offer));closeTrade(s,t,'countered');s.trades.unshift(counter);log(s,'trade_counter',{team:ai.name});}else{closeTrade(s,t,'rejected');log(s,'trade_rejected',{team:ai.name});}}}
export function generateOffer(s){if(s.trades.filter(t=>t.to===s.user).length>=3||s.day>=36)return;const reserved=reservedPlayers(s);let best=null;for(const ai of s.teams.filter(t=>t.id!==s.user&&!managed(s,t.id))){const base=recruitmentValue(s,ai);for(const a of ai.roster)for(const b of team(s).roster){if(reserved.has(a)||reserved.has(b))continue;const gain=recruitmentValue(s,ai,ai.roster.map(id=>id===a?b:id))-base,diff=tradeValue(player(s,a),s)-tradeValue(player(s,b),s);if(diff>s.manager.points)continue;if(gain>(best?.gain??.5))best={ai,a,b,diff,gain};}}if(!best)return;const {ai,a,b,diff}=best;let t={id:'tr'+s.nextId++,from:ai.id,to:s.user,offered:[a],asked:[b],pay:Math.max(0,Math.ceil(-diff)),receive:Math.max(0,Math.ceil(diff)),created:absolute(s),status:'pending'};s.trades.unshift(t);log(s,'trade_received',{team:ai.name});}
export function validate(s){if(!s||s.version!==VERSION||!s.id||!Array.isArray(s.teams)||s.teams.length!==6||!s.players||!Number.isInteger(s.day)||s.day<0||s.day>47||!Number.isInteger(s.season)||s.season<1||!Number.isInteger(s.rng))throw Error('invalid_save');if(!team(s)||new Set(s.teams.map(t=>t.id)).size!==6)throw Error('invalid_save');const initial=validateInitialDraft(s);let owners=[];for(let t of s.teams){if(typeof t.name!=='string'||!Array.isArray(t.roster)||(!initial&&t.roster.length<6)||t.roster.length>8)throw Error('invalid_save');owners.push(...t.roster);let active=Object.values(t.positions);if(!initial&&(active.length!==6||new Set(active).size!==6||t.order.length!==6||new Set(t.order).size!==6||t.order.some(id=>!active.includes(id)||!t.roster.includes(id))))throw Error('invalid_save');}owners.push(...s.free,...s.rookies,...s.retired);if(new Set(owners).size!==owners.length)throw Error('invalid_save');for(let id of owners){let p=player(s,id);if(!p||p.id!==id||typeof p.name!=='string'||!Number.isFinite(p.energy)||p.energy<0||p.energy>100||!ATTR.every(k=>Number.isInteger(p.base[k])&&p.base[k]>=1&&p.base[k]<=10)||!p.stats||Object.values(p.stats).some(v=>!Number.isFinite(v)||v<0))throw Error('invalid_save');if(p.stats.hits!==p.stats.singles+p.stats.doubles+p.stats.triples+p.stats.hr||p.stats.hits>p.stats.ab)throw Error('invalid_save');}if(!Array.isArray(s.schedule)||(s.schedule.length<99||s.schedule.length>110)||!s.manager||!Number.isSafeInteger(s.manager.points)||s.manager.points<0||!Array.isArray(s.archives)||!Array.isArray(s.trades)||!Array.isArray(s.tradeHistory))throw Error('invalid_save');if(s.live&&(!s.schedule.some(m=>m.id===s.live.id&&!m.result)||s.live.half<0||s.live.half>1))throw Error('invalid_save');return true;}

export function validateStructure(s){const fail=()=>{throw Error('invalid_save');},arr=x=>{if(!Array.isArray(x))fail();},integer=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(x)||x<min||x>max)fail();},str=(x,max=200)=>{if(typeof x!=='string'||x.length>max)fail();};
if(!s||!/^save-[\w-]+$/.test(s.id)||!['career','free'].includes(s.mode))fail();integer(s.nextId,1);integer(s.created);integer(s.rng,0,4294967295);for(let k of ['free','rookies','retired','archives','log','trades','tradeHistory'])arr(s[k]);for(let k of ['objectives','completed'])arr(s.manager?.[k]);str(s.manager.name);integer(s.manager.xp);integer(s.manager.reputation,0,100);if(s.careerResult!==null&&!['won','lost','dismissed'].includes(s.careerResult))fail();
const checkStats=st=>{if(!st)fail();for(let k of Object.keys(blankStats()))integer(st[k]);if(st.hits!==st.singles+st.doubles+st.triples+st.hr||st.hits>st.ab)fail();};
const checkPlayer=(p,id)=>{if(!/^p\d+$/.test(id)||p.id!==id)fail();str(p.name);integer(p.age,1,300);integer(p.birthday,0,47);integer(p.portrait,0,3);if(p.gender!=null)integer(p.gender,0,1);if(p.portraitId!=null&&(!portraitById(p.portraitId)||portraitById(p.portraitId).gender!==(p.gender??p.portrait%2)))fail();if(!GRADES.includes(p.grade)||!FORMS.includes(p.form)||!['Odd','Even','Switch'].includes(p.side)||typeof p.retired!=='boolean')fail();for(let k of ATTR)integer(p.base?.[k],1,10);integer(p.energy,0,100);if(p.freeSeasons!=null)integer(p.freeSeasons,0);checkStats(p.stats);if(p.playoffStats)checkStats(p.playoffStats);for(let k of ['history','journal','awards'])arr(p[k]);if(!p.change||typeof p.change!=='object')fail();if(p.attributeHistory!=null){arr(p.attributeHistory);const years=new Set();for(const h of p.attributeHistory){integer(h.season,1);if(years.has(h.season))fail();years.add(h.season);for(const k of ATTR)integer(h.base?.[k],1,10);}}for(let h of p.history){integer(h.season,1);if(h.development){integer(h.development.games,0,99);const d=h.development;if(typeof d.estimated!=='boolean'||(d.rules!=null&&d.rules!==2)||d.factor!==(d.rules===2?developmentFactor(d.games):.25+.75*clamp(d.games/24,0,1)))fail();}checkStats(h.stats);if(h.playoffStats)checkStats(h.playoffStats);for(let k of ATTR)integer(h.base?.[k],1,10);if(h.team!==null)str(h.team);}for(let a of p.awards){integer(a.season,1);str(a.type);integer(a.rank,1,10);}for(let e of p.journal){str(e.key);integer(e.season,1);if(!e.args||typeof e.args!=='object')fail();}};
const checkEvent=(e,ps)=>{integer(e.inning,1,20000);integer(e.half,0,1);integer(e.outs,0,3);integer(e.runs,0,4);str(e.batter);if(!ps[e.batterId]||!['K','BB','C','T','E','1B','2B','3B','HR'].includes(e.type))fail();arr(e.score);if(e.score.length!==2)fail();e.score.forEach(v=>integer(v));if(e.bases){arr(e.bases);if(e.bases.length!==3)fail();e.bases.forEach(b=>{if(b&&!ps[b.id])fail();});}if(e.checks){arr(e.checks);for(let c of e.checks){arr(c);str(c[0]);integer(c[1]);integer(c[2]);}}};
const checkSource=src=>{const initial=src===s&&validateInitialDraft(s);arr(src.teams);if(src.teams.length!==6)fail();if(src.teams.some(tm=>tm.logo!=null)&&(src.teams.some(tm=>!logoById(tm.logo))||new Set(src.teams.map(tm=>tm.logo)).size!==6))fail();for(let [id,p] of Object.entries(src.players))checkPlayer(p,id);for(let tm of src.teams){if(!/^t[0-5]$/.test(tm.id))fail();str(tm.name);integer(tm.w);integer(tm.l);integer(tm.runs);if(typeof tm.auto!=='boolean')fail();if(tm.marketDay!=null)integer(tm.marketDay);arr(tm.roster);arr(tm.order);if(tm.positionPreferences!=null){if(typeof tm.positionPreferences!=='object'||Array.isArray(tm.positionPreferences))fail();for(const [id,pref] of Object.entries(tm.positionPreferences)){if(!src.players[id]||!Array.isArray(pref)||pref.length!==2||pref.some((v,i)=>v!==''&&!POS.includes(v)&&!(i===0&&v==='Bench'))||pref[0]&&pref[0]===pref[1])fail();}}if(tm.rotation!=null){const r=tm.rotation;arr(r.players);if(r.players.length<Math.min(2,tm.roster.length)||r.players.length>4||new Set(r.players).size!==r.players.length||r.players.some(id=>!tm.roster.includes(id))||(r.players.length?!r.players.includes(r.next):r.next!==null))fail();}if((!initial&&tm.roster.length<6)||tm.roster.length>8||new Set(tm.roster).size!==tm.roster.length||(!initial&&(tm.order.length!==6||new Set(tm.order).size!==6)))fail();for(let id of tm.roster)if(!src.players[id])fail();if(!initial&&(!POS.every(pos=>tm.roster.includes(tm.positions?.[pos]))||new Set(Object.values(tm.positions)).size!==6||tm.order.some(id=>!Object.values(tm.positions).includes(id))))fail();}
arr(src.schedule);if(src.schedule.length<99||src.schedule.length>110||src.schedule.filter(m=>!m.playoff).length!==99||new Set(src.schedule.map(m=>m.id)).size!==src.schedule.length)fail();for(let m of src.schedule){if(!/^s\d+d\d+m(?:t[0-5])$/.test(m.id)||!team(src,m.away)||!team(src,m.home)||m.home===m.away)fail();integer(m.day,3,m.playoff?46:35);if(m.playoff&&!src.playoffs?.series.some(x=>x.id===m.playoff&&x.games.includes(m.id)))fail();if(m.result){let r=m.result;if(r.gameStats!=null){arr(r.gameStats);if(r.gameStats.length!==2||r.gameStats[0].id!==m.away||r.gameStats[1].id!==m.home)fail();for(let tm of r.gameStats){arr(tm.players);if(tm.players.length!==6||new Set(tm.players.map(p=>p.id)).size!==6)fail();for(let p of tm.players){if(!s.players[p.id]||!POS.includes(p.pos))fail();str(p.name);checkStats(p.stats);}}} if(r.id!==m.id||r.home!==m.home||r.away!==m.away||![m.home,m.away].includes(r.winner))fail();arr(r.score);if(r.score.length!==2||r.score[0]===r.score[1])fail();r.score.forEach(v=>integer(v));if(r.winner!==(r.score[0]>r.score[1]?r.away:r.home))fail();arr(r.box);if(r.box.length!==2)fail();r.box.forEach((row,i)=>{arr(row);row.forEach(v=>integer(v));if(row.reduce((a,b)=>a+b,0)!==r.score[i])fail();});for(let e of r.events||r.highlights||[])checkEvent(e,{...s.players,...src.players});}}};
for(const src of [s,...s.archives]){if(src.awards!=null){arr(src.awards);for(const a of src.awards){if(![...awardTypes,'avg','hr','rbi'].includes(a.type)||!s.players[a.id]||a.season!==src.season||a.rank!==1||!Number.isFinite(a.score)||a.teamId!==null&&!team(s,a.teamId))fail();str(a.name);}}if(src.leagueNews!=null){arr(src.leagueNews);for(const e of src.leagueNews){str(e.id);str(e.key);integer(e.season,1);integer(e.day,0,47);if(!e.args||typeof e.args!=='object')fail();}}}validatePostseason(s);checkSource(s);for(let a of s.archives){integer(a.season,1);validatePostseason(a);checkSource(a);if(!team(a,a.winner))fail();}for(let e of s.log){str(e.key);integer(e.season,1);integer(e.day,0,47);if(!e.args||typeof e.args!=='object')fail();}
for(let tr of [...s.trades,...s.tradeHistory]){if(!/^tr\d+$/.test(tr.id)||!team(s,tr.from)||!team(s,tr.to)||tr.from===tr.to)fail();for(let k of ['offered','asked']){arr(tr[k]);if(tr[k].some(id=>!s.players[id]))fail();}integer(tr.pay);integer(tr.receive);integer(tr.created);if(!['pending','accepted','rejected','refused','countered','completed','expired','stale'].includes(tr.status))fail();}
if(s.draft){arr(s.draft.order);arr(s.draft.picks);const length=s.draft.kind==='initial'?48:12;if(s.draft.kind!=null&&!['initial','annual'].includes(s.draft.kind))fail();integer(s.draft.index,0,length-1);if(s.draft.order.length!==length||s.draft.order.some(id=>!team(s,id)))fail();}for(let pick of s.draft?.picks||s.lastDraft||[]){if(pick.skipped===true){if(s.draft?.kind==='initial'||!s.draft&&s.lastDraftKind==='initial'||pick.id!==null||!team(s,pick.teamId))fail();integer(pick.pick,1,12);}else if(!s.players[pick.id])fail();str(pick.team);integer(pick.round,1,(s.draft?.kind==='initial'||!s.draft&&s.lastDraftKind==='initial')?8:2);}if(s.summary){integer(s.summary.season,1);str(s.summary.winner);arr(s.summary.changes);arr(s.summary.retirements);for(let c of s.summary.changes){if(!s.players[c.id])fail();for(let k of ATTR)integer(c.delta?.[k],-9,9);}if(s.summary.retirements.some(id=>!s.players[id]))fail();}
if(s.live){const l=s.live;if(l.statStart!=null){arr(l.lineups);if(l.lineups.length!==2)fail();for(let [i,tm] of l.lineups.entries()){if(tm.id!==[l.away,l.home][i])fail();arr(tm.order);if(tm.order.length!==6||new Set(tm.order).size!==6)fail();for(let id of tm.order){if(!team(s,tm.id).roster.includes(id))fail();checkStats(l.statStart[id]);}if(!POS.every(pos=>tm.order.includes(tm.positions?.[pos]))||new Set(Object.values(tm.positions)).size!==6)fail();}}const m=s.schedule.find(m=>m.id===l.id);if(!m||m.result||m.day!==s.day||m.away!==l.away||m.home!==l.home||l.done!==false)fail();integer(l.inning,1,20000);integer(l.outs,0,2);integer(l.half,0,1);integer(l.virtualOuts);arr(l.indices);if(l.indices.length!==2)fail();l.indices.forEach(v=>integer(v,0,5));arr(l.score);if(l.score.length!==2)fail();l.score.forEach(v=>integer(v));arr(l.bases);if(l.bases.length!==3)fail();l.bases.forEach(b=>{if(b&&!s.players[b.id])fail();});arr(l.events);for(let e of l.events)checkEvent(e,s.players);arr(l.box);if(l.box.length!==2)fail();for(let b of l.box){arr(b);b.forEach(v=>integer(v));}}
return true;}
export function auditStats(s){const list=Object.values(s.players).filter(p=>!p.retired||p.journal.some(e=>e.key==='retired'&&e.season===s.season)),sum=k=>list.reduce((n,p)=>n+p.stats[k],0),issues=[];for(let [a,b] of [['hits','hitsAllowed'],['bb','pitchBB'],['so','pitchSO'],['runs','allowed']])if(sum(a)!==sum(b))issues.push(a+' ≠ '+b);if(sum('ab')!==sum('hits')+sum('so')+sum('catchOuts')+sum('throwOuts')+sum('errors'))issues.push('AB ≠ H + SO + C + T + E');if(sum('bf')!==sum('ab')+sum('bb'))issues.push('BF ≠ AB + BB');if(sum('pitchOuts')!==sum('so')+sum('catchOuts')+sum('throwOuts'))issues.push('OUT ≠ SO + C + T');let score=s.teams.reduce((n,t)=>n+t.runs,0)+(s.live&&!s.schedule.find(m=>m.id===s.live.id)?.playoff?s.live.score.reduce((a,b)=>a+b,0):0);if(sum('runs')!==score)issues.push('R ≠ scores');return issues;}

function withPlayoffStats(s,enabled,fn){if(!enabled)return fn();const old=Object.values(s.players).map(p=>[p,p.stats]);for(const [p] of old){p.playoffStats??=blankStats();p.stats=p.playoffStats;}try{return fn();}finally{for(const [p,stats] of old){p.playoffStats=p.stats;p.stats=stats;}}}
export function beginPlayoffs(s){if(s.playoffs)return;if(s.schedule.some(m=>!m.playoff&&!m.result))throw Error('play_first');const seeds=standings(s).map(t=>t.id);s.playoffs={scheduleVersion:3,seeds,winner:null,series:[{id:'semi1',teams:[seeds[0],seeds[3]],target:2,wins:[0,0],games:[],winner:null},{id:'semi2',teams:[seeds[1],seeds[2]],target:2,wins:[0,0],games:[],winner:null}]};for(const p of Object.values(s.players))p.playoffStats=blankStats();for(const series of s.playoffs.series)schedulePlayoff(s,series);}
export function playoffDay(s,series,n){
 if(s.playoffs.scheduleVersion!==3)return series.target===2?36+n*2:42+n;
 if(series.target===2)return 37+n;
 const lastSemi=Math.max(...s.schedule.filter(m=>m.playoff&&m.playoff!=='final').map(m=>m.day));
 return lastSemi+2+n+(n===4?1:0);
}
function schedulePlayoff(s,series){const n=series.games.length,day=playoffDay(s,series,n),home=series.teams[n%2===0?0:1],away=series.teams[n%2===0?1:0],id=`s${s.season}d${day}m${away}`;series.games.push(id);s.schedule.push({id,day,home,away,playoff:series.id,result:null});}
function recordPlayoff(s,m){const series=s.playoffs.series.find(x=>x.id===m.playoff);series.wins[series.teams.indexOf(m.result.winner)]++;if(Math.max(...series.wins)>=series.target)series.winner=m.result.winner;else schedulePlayoff(s,series);
 if(series.id==='final'&&series.winner)s.playoffs.winner=series.winner;
 if(s.playoffs.series.length===2&&s.playoffs.series.every(x=>x.winner)){const finalists=s.playoffs.series.map(x=>x.winner).sort((a,b)=>s.playoffs.seeds.indexOf(a)-s.playoffs.seeds.indexOf(b)),final={id:'final',teams:finalists,target:3,wins:[0,0],games:[],winner:null};s.playoffs.series.push(final);schedulePlayoff(s,final);}}

export function validatePostseason(s){const bad=()=>{throw Error('invalid_save');};
 if(s.calendarVersion!=null&&s.calendarVersion!==2)bad();
 if(s.offseason&&(!['awards','development','recruitment','ready'].includes(s.offseason.stage)||!s.summary||s.day!==47))bad();
 const po=s.playoffs,extra=s.schedule.filter(m=>m.playoff);if(!po){if(extra.length)bad();return;}
 if(!Array.isArray(po.seeds)||po.seeds.length!==6||new Set(po.seeds).size!==6||po.seeds.some(id=>!team(s,id))||!Array.isArray(po.series)||![2,3].includes(po.series.length))bad();
 if(po.seeds.join()!==standings(s).map(t=>t.id).join())bad();
 for(const [i,series] of po.series.entries()){
  const target=i<2?2:3,id=i<2?'semi'+(i+1):'final',expected=i===0?[po.seeds[0],po.seeds[3]]:i===1?[po.seeds[1],po.seeds[2]]:po.series.slice(0,2).map(x=>x.winner).sort((a,b)=>po.seeds.indexOf(a)-po.seeds.indexOf(b));
  if(series.id!==id||series.target!==target||!Array.isArray(series.teams)||series.teams.join()!==expected.join()||series.teams.some(id=>!team(s,id))||!Array.isArray(series.games)||series.games.length<1||series.games.length>target*2-1||new Set(series.games).size!==series.games.length||!Array.isArray(series.wins))bad();
  const wins=[0,0];for(const [n,gid] of series.games.entries()){const m=s.schedule.find(m=>m.id===gid);if(!m||m.playoff!==series.id||m.day!==playoffDay(s,series,n)||m.home!==series.teams[n%2===0?0:1]||m.away!==series.teams[n%2===0?1:0]||Math.max(...wins)>=target)bad();if(m.result){const j=series.teams.indexOf(m.result.winner);if(j<0)bad();wins[j]++;}else if(n!==series.games.length-1)bad();}
  if(wins.join()!==series.wins.join()||(series.winner??null)!==(Math.max(...wins)===target?series.teams[wins.indexOf(target)]:null))bad();
 }
 if(extra.length!==po.series.reduce((n,x)=>n+x.games.length,0)||(po.winner??null)!==(po.series[2]?.winner??null))bad();
 if(s.offseason&&!po.winner)bad();
}

// Market evaluation uses permanent ability, not temporary match fatigue.
export function npcStrategy(s,t){const played=t.w+t.l;return played<8?'balanced':t.w/played>=.55?'contender':t.w/played<=.4?'rebuild':'balanced';}
export function recruitmentValue(s,t,ids=t.roster){const ps=ids.map(id=>player(s,id)),strategy=npcStrategy(s,t);return lineupValue(ps)+ps.reduce((n,p)=>n+.12*total(p)+(strategy==='rebuild'?.12:strategy==='contender'?.015:.06)*tradeValue(p,s),0);}
function reservedPlayers(s){return new Set(s.trades.flatMap(t=>[...t.offered,...t.asked]));}
export function npcRecruitment(s,offseason=false){
 if(s.live||s.draft||s.careerResult||(!offseason&&(s.day>=36||s.day%6!==0)))return;
 const stamp=absolute(s),reserved=reservedPlayers(s),ready=t=>t.id!==s.user&&stamp-(t.marketDay??-100)>=6;
 const candidates=npcMarketOrder(s).filter(ready);
 for(const t of candidates){let best=null,base=recruitmentValue(s,t);
  for(const id of s.free){if(reserved.has(id)||player(s,id).retired)continue;for(const cut of t.roster.length<8?[null]:t.roster.filter(x=>!reserved.has(x))){const ids=t.roster.filter(x=>x!==cut).concat(id),gain=recruitmentValue(s,t,ids)-base;if(gain>(best?.gain??1.5))best={id,cut,ids,gain};}}
  if(!best)continue;reserved.add(best.id);if(best.cut){reserved.add(best.cut);removePlayer(s,t,best.cut);log(s,'npc_release',{team:t.name,name:player(s,best.cut).name});}
  s.free=s.free.filter(id=>id!==best.id);t.roster=best.ids;player(s,best.id).freeSeasons=0;t.marketDay=stamp;player(s,best.id).journal.push({key:'joined',args:{team:t.name},season:s.season});autoAlign(s,t);log(s,'npc_sign',{team:t.name,name:player(s,best.id).name});
 }
 // At most one mutually useful, value-balanced trade per market window.
 let best=null;const eligible=npcMarketOrder(s).filter(ready);
 for(let i=0;i<eligible.length;i++)for(const b of eligible.slice(i+1)){const a=eligible[i],va=recruitmentValue(s,a),vb=recruitmentValue(s,b);
 for(const x of a.roster)for(const y of b.roster){if(reserved.has(x)||reserved.has(y))continue;const vx=tradeValue(player(s,x),s),vy=tradeValue(player(s,y),s);if(Math.min(vx,vy)<.8*Math.max(vx,vy))continue;const aa=a.roster.map(id=>id===x?y:id),bb=b.roster.map(id=>id===y?x:id),ga=recruitmentValue(s,a,aa)-va,gb=recruitmentValue(s,b,bb)-vb;if(ga>.5&&gb>.5&&ga+gb>(best?.gain??0))best={a,b,x,y,aa,bb,gain:ga+gb};}}
 if(best){const {a,b,x,y,aa,bb}=best;a.roster=aa;b.roster=bb;a.marketDay=b.marketDay=stamp;for(const [id,t] of [[x,b],[y,a]])player(s,id).journal.push({key:'traded',args:{team:t.name},season:s.season});autoAlign(s,a);autoAlign(s,b);log(s,'npc_trade',{team:a.name,other:b.name,name:player(s,x).name,player:player(s,y).name});}
}
export function biography(p,lang='fr'){
 let h=2166136261;for(const c of p.id+'|'+p.name)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
 const origins={fr:['les terrains de quartier','une ligue scolaire','les tournois estivaux','un petit club familial','une ligue amateur régionale','les matchs entre amis'],en:['neighborhood fields','a school league','summer tournaments','a small family club','a regional amateur league','games with friends'],es:['los campos del barrio','una liga escolar','los torneos de verano','un pequeño club familiar','una liga amateur regional','los partidos entre amigos']};
 const hobbies={fr:['la photographie','la musique','la randonnée','les jeux de société','la cuisine','le dessin','le jardinage','le cinéma'],en:['photography','music','hiking','board games','cooking','drawing','gardening','cinema'],es:['la fotografía','la música','el senderismo','los juegos de mesa','la cocina','el dibujo','la jardinería','el cine']};
 const l=origins[lang]?lang:'fr',o=origins[l][h%6],hobby=hobbies[l][Math.floor(h/6)%8];return l==='fr'?`Son histoire commence dans ${o}. En dehors du terrain, ${hobby} occupe une place importante dans sa vie.`:l==='en'?`Their story began on ${o}. Away from the field, they make time for ${hobby}.`:`Su historia comenzó en ${o}. Fuera del campo, dedica tiempo a ${hobby}.`;
}
export function leagueRecords(s){return ['hits','hr','rbi','pitchSO'].map(key=>{let best=null;for(const a of s.archives)for(const p of Object.values(a.players)){const value=p.stats?.[key]||0;if(value>0&&(!best||value>best.value))best={key,id:p.id,name:p.name,value,season:a.season};}return best;}).filter(Boolean);}

export function careerStory(p){const debut=p.journal.find(e=>e.key==='drafted'||e.key==='joined');return {debut:debut?{season:debut.season,team:debut.args.team}:null,clubs:[...new Set(p.journal.filter(e=>['drafted','joined','traded'].includes(e.key)).map(e=>e.args.team).filter(Boolean))],titles:p.awards.filter(a=>a.type==='champion'&&a.rank===1).map(a=>a.season)};}

// Rotate first access to free agents: a club's permanent ID is not a market advantage.
export function npcMarketOrder(s){const ids=s.teams.filter(t=>t.id!==s.user&&!managed(s,t.id)).sort((a,b)=>a.id.localeCompare(b.id));const offset=ids.length?Math.floor(absolute(s)/6)%ids.length:0;return ids.slice(offset).concat(ids.slice(0,offset));}

export function preMatchReport(s,id){return buildPreMatch(s,id,autoAlign);}
function grantAward(s,a){const p=player(s,a.id);if(p.awards.some(x=>x.season===a.season&&x.type===a.type&&x.rank===1))return;p.awards.push({season:a.season,type:a.type,rank:1});const event={key:'prize_won',args:{name:p.name,prize:a.type},season:s.season};p.journal.push(event);leagueStory(s,`${a.season}:prize:${a.type}`,event.key,event.args);const archive=s.archives.find(x=>x.season===a.season);if(archive){(archive.leagueNews??=[]).unshift({id:`${a.season}:prize:${a.type}`,key:event.key,args:clone(event.args),season:s.season,day:s.day});(archive.awards??=[]).push(clone(a));if(!archive.players[p.id]){archive.players[p.id]=clone(p);const h=p.history.find(h=>h.season===a.season);if(h)archive.players[p.id].base=clone(h.base);}else{archive.players[p.id].awards.push({season:a.season,type:a.type,rank:1});archive.players[p.id].journal.push(clone(event));}}}
function leagueStory(s,id,key,args,playerId=null){if((s.leagueNews||[]).some(e=>e.id===id))return;const e={id,key,args,season:s.season,day:s.day};(s.leagueNews??=[]).unshift(e);s.leagueNews=s.leagueNews.slice(0,300);log(s,key,args);if(playerId)player(s,playerId).journal.push({key,args:clone(args),season:s.season});}
function recordLeagueNews(s,m){
 const games=m.result.gameStats||[];
 for(const tm of games)for(const entry of tm.players){const p=player(s,entry.id),a=entry.stats,opponent=team(s,m.away===tm.id?m.home:m.away),prefix=`${s.season}:${m.id}:${p.id}`;
  if(a.hr>=2)leagueStory(s,prefix+':hr','news_hr',{name:p.name,value:a.hr,team:team(s,tm.id).name},p.id);
  else if(a.hits>=4)leagueStory(s,prefix+':hits','news_hits',{name:p.name,value:a.hits},p.id);
  else if(a.pitchSO>=8)leagueStory(s,prefix+':pitch','news_pitch',{name:p.name,value:a.pitchSO},p.id);
  if(p.journal.some(e=>['drafted','joined','traded'].includes(e.key)&&e.args.team===opponent.name))leagueStory(s,`${s.season}:return:${p.id}:${opponent.id}`,'news_return',{name:p.name,team:opponent.name},p.id);
  if(!m.playoff){
   if(rookieEligible(s,p)&&p.stats.hits>=10&&p.stats.hits-a.hits<10)leagueStory(s,`${s.season}:rookie:${p.id}`,'news_rookie',{name:p.name},p.id);
   for(const stat of ['hr','hits','rbi','pitchSO']){const historic=Math.max(0,...s.archives.flatMap(x=>Object.values(x.players).map(q=>q.stats[stat]||0)));if(!historic)continue;const bar=Math.max(historic,...Object.values(s.players).filter(q=>q.id!==p.id).map(q=>q.stats[stat]||0));if(p.stats[stat]>bar&&p.stats[stat]-a[stat]<=bar)leagueStory(s,`${s.season}:record:${p.id}:${stat}`,'news_record',{name:p.name,stat,value:p.stats[stat]},p.id);}
  }
 }
 const pair=[m.away,m.home].sort(),recent=[...s.archives.flatMap(a=>a.schedule),...s.schedule].filter(g=>g.result&&pair.includes(g.away)&&pair.includes(g.home)).slice(-5),wins=recent.filter(g=>g.result.winner===pair[0]).length;if(recent.length>=4&&Math.abs(2*wins-recent.length)<=1)leagueStory(s,`${s.season}:rivalry:${pair.join(':')}`,'news_rivalry',{team:team(s,pair[0]).name,other:team(s,pair[1]).name,wins,losses:recent.length-wins});
}

export function ensureAttributeHistory(s){for(const p of Object.values(s.players)){if(p.attributeHistory)continue;const rows=new Map((p.history||[]).map(h=>[h.season,{season:h.season,base:clone(h.base),value:h.value}]));const upcoming=s.rookies?.includes(p.id)&&(!!s.offseason||s.day>=24);const year=upcoming?s.season+1:s.season;if(!p.retired&&!rows.has(year))rows.set(year,{season:year,base:clone(p.base),value:tradeValue(p,s)});p.attributeHistory=[...rows.values()].sort((a,b)=>a.season-b.season);}return s;}
