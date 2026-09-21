import {matchMoment} from './presentation.js';
import * as E from './engine.js';
// All commands run only on the host, against the canonical state. Views are disposable.
export const token=()=>crypto.randomUUID()+crypto.randomUUID();
const fail=message=>{throw Error(message);};
export const member=(s,id)=>s.online?.members.find(m=>m.teamId===id);
export const liveFor=(s,id)=>Object.values(s.online?.lives||{}).find(l=>[l.away,l.home].includes(id));
export function createLeague(name,manager,logo,seed=Date.now()){
 const s=E.newGame(name,manager,'free',seed,logo);
 s.online={version:1,phase:'lobby',host:'t0',members:[{teamId:'t0',name:manager,delegated:false,joined:true}],keys:Object.fromEntries(s.teams.map(t=>[t.id,token()])),managers:{t0:s.manager},lives:{},lastMatches:{},ready:{},matchReady:{},controls:{},vote:null,revision:0,receipts:[]};
 return s;
}
export function publicState(s){const out=E.clone(s);delete out.online.keys;delete out.online.receipts;return out;}
export function project(s,id){const out=E.clone(s);out.user=id;out.manager=out.online.managers[id]||out.manager;out.lastMatch=out.online.lastMatches[id]||null;out.live=liveFor(out,id)||null;return out;}
export function asTeam(s,id,fn){const old=s.user,manager=s.manager,live=s.live;s.user=id;s.manager=s.online.managers[id]||manager;s.live=liveFor(s,id)||null;try{return fn();}finally{s.user=old;s.manager=manager;s.live=live;}}
function editable(s,id){if(s.online.phase!=='playing')fail('La ligue n’a pas encore commencé.');asTeam(s,id,()=>E.assertEditable(s));}
function hostOnly(s,id){if(id!==s.online.host)fail('Seul l’hôte peut faire cette action.');}
function clearReady(s){s.online.ready={};s.online.matchReady={};}
function autoPicks(s){E.autoDraft(s);}
function requiredPlayers(s,m){return [m.away,m.home].filter(tid=>E.managed(s,tid));}
export function allPresent(s,presence){return s.online.members.every(m=>presence.includes(m.teamId));}
export function canAdvance(s,presence){return s.online.phase==='playing'&&!s.draft&&!Object.keys(s.online.lives).length&&allPresent(s,presence);}
export const dayKey=s=>s.season+':'+s.day+':'+(s.offseason?.stage||'');
export const needsDayConfirmation=s=>!!s.offseason||s.calendarVersion===2&&[35,46].includes(s.day);
export const canAutoAdvance=()=>false;
function proposeTime(s,actor,cmd,presence,kind){
 hostOnly(s,actor);const o=s.online;
 if(!canAdvance(s,presence)||kind==='period'&&s.offseason)fail('Tous les participants doivent être connectés. Terminez le repêchage et les matchs en cours.');
 if(o.vote)fail('Un vote est déjà en cours.');
 o.timeNotice=null;o.vote={id:cmd.id,kind,sourceDay:dayKey(s),season:s.season,day:Math.min(47,(Math.floor(s.day/12)+1)*12),approvals:{[actor]:true},running:o.members.length===1};
}
function getMatch(s,id){const m=E.todayMatches(s).find(m=>m.id===id&&!m.result);if(!m)fail('Ce match n’est plus disponible.');return m;}
function start(s,m){const old=s.live;E.startMatch(s,m.id);s.online.lives[m.id]=s.live;s.live=old;s.online.lives[m.id].matchRng=(Math.floor(E.rng(s)*4294967296)>>>0);s.online.controls[m.id]={playing:false,speed:1200,pauseRequested:null};for(const tid of [m.away,m.home])delete s.online.ready[tid];}
function step(s,id){const l=s.online.lives[id];if(!l)fail('Ce match n’est pas en cours.');const old=s.live,rng=s.rng;s.live=l;s.rng=l.matchRng;try{const previous=l.events.at(-1),event=E.stepMatch(s),c=s.online.controls[id];if(c)c.holdUntil=Date.now()+(matchMoment(event,previous,!s.live)?8500:Math.max(1100,c.speed*1.6));l.matchRng=s.rng;if(!s.live){delete s.online.lives[id];delete s.online.controls[id];delete s.online.matchReady[id];}}finally{s.live=old;s.rng=rng;}}
function simulate(s,id){if(!s.online.lives[id])start(s,getMatch(s,id));let count=0;while(s.online.lives[id]){step(s,id);if(++count>20000)fail('simulation_limit');}}
function controller(s,m){return E.managed(s,m.home)?m.home:E.managed(s,m.away)?m.away:s.online.host;}
function matchPresent(s,m,presence){return requiredPlayers(s,m).every(id=>presence.includes(id));}
function next(s){for(const m of E.todayMatches(s))if(!m.result)simulate(s,m.id);if(s.offseason)E.advanceOffseason(s);else E.nextDay(s);for(const m of s.online.members){if(m.teamId!==s.user)asTeam(s,m.teamId,()=>E.processTrades(s));}clearReady(s);autoPicks(s);}
export function resetSession(s){validateOnline(s,true);s.live=null;s.user=s.online.host;s.manager=s.online.managers[s.user];clearReady(s);s.online.vote=null;for(const c of Object.values(s.online.controls))c.playing=false;s.online.revision++;return s;}
// Atomic clone + validation: refused commands cannot leave a partial mutation behind.
export function command(state,actor,cmd,presence){
 if(!state.online||!cmd||typeof cmd.type!=='string'||typeof cmd.id!=='string')fail('Commande invalide.');
 if(state.online.receipts.some(r=>r.id===cmd.id&&r.actor===actor))return state;
 const s=E.clone(state),o=s.online,a=cmd.args||{},me=member(s,actor);s.manager=o.managers[o.host];
 if(!presence.includes(o.host))fail('En attente du retour de l’hôte.');
 if(!presence.includes(actor))fail('Reconnectez-vous avant de continuer.');
 if(!me&&!(cmd.type==='join'&&o.phase==='lobby'&&/^t[1-5]$/.test(actor)))fail('Cette place n’appartient pas à un participant de la ligue.');
 if(o.vote&&['match-ready','delegate'].includes(cmd.type))fail('Répondez à la demande de passage du temps avant de commencer un match ou de déléguer.');
 if(o.vote?.running&&!['vote-cancel'].includes(cmd.type))fail('La période est en cours de simulation.');
 switch(cmd.type){
 case 'join':{
  if(o.phase!=='lobby')fail('Les participants sont fixés au lancement.');
  if(typeof a.name!=='string'||!a.name.trim()||a.name.length>40)fail('Indiquez votre pseudo.');
  if(!E.logoById(a.logo))fail('Logo invalide.');
  if(o.members.some(m=>m.teamId!==actor&&E.team(s,m.teamId).logo===a.logo))fail('Ce logo vient d’être choisi par un autre joueur.');
  const tm=E.team(s,actor),other=s.teams.find(t=>t.id!==actor&&t.logo===a.logo);if(other){other.logo=tm.logo;other.name=E.logoById(other.logo).teamName;}
  tm.logo=a.logo;tm.name=(a.team||E.logoById(a.logo).teamName).trim().slice(0,40)||E.logoById(a.logo).teamName;
  if(me)me.name=a.name.trim();else{o.members.push({teamId:actor,name:a.name.trim(),delegated:false,joined:true});o.managers[actor]={...E.clone(s.manager),name:a.name.trim()};}
  break;
 }
 case 'launch':hostOnly(s,actor);if(o.phase!=='lobby')fail('La ligue a déjà commencé.');if(!allPresent(s,presence))fail('Tous les participants doivent être connectés.');o.phase='playing';for(const t of s.teams)t.auto=!E.human(s,t.id);autoPicks(s);break;
 case 'ready':fail('Le passage du temps est demandé par l’hôte.');break;
 case 'delegate':if(liveFor(s,actor))fail('Terminez votre match avant de déléguer votre équipe.');me.delegated=!!a.value;if(me.delegated){me.previousAuto=E.team(s,actor).auto;E.team(s,actor).auto=true;}else if(me.previousAuto!==undefined)E.team(s,actor).auto=me.previousAuto;o.ready[actor]=false;autoPicks(s);break;
 case 'draft':if(a.index!=null&&a.index!==s.draft?.index)fail('Ce choix a déjà été traité.');if(o.phase!=='playing'||!s.draft||s.draft.order[s.draft.index]!==actor)fail('Ce n’est pas votre tour de repêcher.');asTeam(s,actor,()=>a.skip===true?E.skipDraftTurn(s):E.draftPick(s,a.player||null,a.cut||null,!!a.auto));autoPicks(s);break;
 case 'match-ready':{
  const m=getMatch(s,a.match);if(![m.away,m.home].includes(actor)||me.delegated)fail('Vous ne contrôlez pas ce match.');if(s.draft)fail('Terminez le repêchage.');
  (o.matchReady[m.id]??={})[actor]=true;
  if(requiredPlayers(s,m).every(id=>o.matchReady[m.id][id])&&matchPresent(s,m,presence)){start(s,m);if(requiredPlayers(s,m).length<2&&a.quick)simulate(s,m.id);}
  break;
 }
 case 'control':{
  const m=getMatch(s,a.match),c=o.controls[m.id];if(!c)fail('Les deux équipes doivent être prêtes.');
  if(a.action==='request-pause'){if(![m.away,m.home].includes(actor))fail('Match indisponible.');c.pauseRequested=actor;break;}
  if(controller(s,m)!==actor)fail('L’équipe à domicile contrôle la simulation.');
  if(!matchPresent(s,m,presence))fail('Match en pause : un participant est déconnecté.');
  if(a.action==='toggle'){c.playing=!c.playing;c.pauseRequested=null;}
  else if(a.action==='step'){c.playing=false;c.pauseRequested=null;step(s,m.id);}
  else if(a.action==='speed'){if(![1200,600,250].includes(a.speed))fail('Vitesse invalide.');c.speed=a.speed;}
  else if(a.action==='finish'){if(requiredPlayers(s,m).length>1)fail('Utilisez la vitesse de lecture pour ce match entre joueurs.');simulate(s,m.id);}
  else fail('Commande invalide.');break;
 }
 case 'next':proposeTime(s,actor,cmd,presence,'day');break;
 case 'vote-propose':proposeTime(s,actor,cmd,presence,'period');break;
 case 'vote':if(!o.vote||o.vote.id!==a.vote||o.vote.running)fail('Ce vote est terminé.');if(a.accept!==true){o.timeNotice={id:cmd.id,message:me.name+' a refusé le passage du temps. Action annulée.'};o.vote=null;break;}o.vote.approvals[actor]=true;if(o.members.every(m=>o.vote.approvals[m.teamId])&&allPresent(s,presence))o.vote.running=true;break;
 case 'vote-cancel':hostOnly(s,actor);o.timeNotice={id:cmd.id,message:'L’hôte a annulé le passage du temps.'};o.vote=null;break;
 case 'rotation-next':editable(s,actor);asTeam(s,actor,()=>E.setNextPitcher(s,a.player));break;
 case 'preferences':editable(s,actor);asTeam(s,actor,()=>E.setPositionPreferences(s,a.player,a.preferences));break;
 case 'rotation':editable(s,actor);asTeam(s,actor,()=>E.setPitchingRotation(s,a.players));o.ready[actor]=false;break;
 case 'align':editable(s,actor);asTeam(s,actor,()=>E.autoAlign(s,E.team(s)));o.ready[actor]=false;break;
 case 'auto':editable(s,actor);E.team(s,actor).auto=!!a.value;o.ready[actor]=false;break;
 case 'swap':editable(s,actor);asTeam(s,actor,()=>E.swap(s,a.from,a.to,a.kind==='offense'?'offense':'defense'));o.ready[actor]=false;break;
 case 'sign':editable(s,actor);asTeam(s,actor,()=>E.sign(s,a.player,a.cut||null));o.ready[actor]=false;break;
 case 'cut':editable(s,actor);asTeam(s,actor,()=>E.cut(s,a.player));o.ready[actor]=false;break;
 case 'propose':editable(s,actor);if(!Array.isArray(a.offered)||!Array.isArray(a.asked))fail('invalid_trade');asTeam(s,actor,()=>E.propose(s,a.to,a.offered,a.asked,a.pay,a.receive));break;
 case 'accept':case 'refuse':{
  editable(s,actor);const t=s.trades.find(t=>t.id===a.trade);if(!t||![t.from,t.to].includes(actor))fail('invalid_trade');
  if([t.from,t.to].some(id=>liveFor(s,id)))fail('Un des clubs joue actuellement.');
  asTeam(s,actor,()=>cmd.type==='accept'?E.acceptTrade(s,t.id):E.refuseTrade(s,t.id));o.ready[t.from]=false;o.ready[t.to]=false;for(const r of Object.values(o.matchReady)){delete r[t.from];delete r[t.to];}break;
 }
 case 'offer':editable(s,actor);asTeam(s,actor,()=>E.generateOffer(s));break;
 default:fail('Commande multijoueur inconnue.');
 }
 // Changes to lineups invalidate preparation for a match not yet started.
 if(['rotation','rotation-next','preferences','align','auto','swap','sign','cut','accept'].includes(cmd.type))for(const r of Object.values(o.matchReady))delete r[actor];
 o.revision++;o.receipts.push({id:cmd.id,actor});o.receipts=o.receipts.slice(-2000);E.validate(s);validateOnline(s);return s;
}
export function tick(state,presence,due=[]){
 if(!presence.includes(state.online.host)||!state.online.vote&&!Object.values(state.online.controls).some(c=>c.playing)&&!canAutoAdvance(state,presence))return state;
 const s=E.clone(state),o=s.online; s.manager=o.managers[o.host];let changed=false;
 for(const [id,c] of Object.entries(o.controls)){const m=getMatch(s,id);if(!matchPresent(s,m,presence)){if(c.playing){c.playing=false;changed=true;}}else if(c.playing&&due.includes(id)&&Date.now()>=(c.holdUntil||0)){step(s,id);changed=true;}}
 if(o.vote&&!o.vote.running&&o.members.every(m=>o.vote.approvals[m.teamId])&&allPresent(s,presence)){o.vote.running=true;changed=true;}
 if(o.vote?.running){
  if(!allPresent(s,presence)){o.timeNotice={id:o.vote.id,message:'Passage du temps annulé : un participant est déconnecté.'};o.vote=null;changed=true;}
  else if(o.vote.kind==='day'){const key=o.vote.sourceDay;o.vote=null;if(dayKey(s)===key)next(s);changed=true;}
  else if(s.draft||s.offseason||s.season!==o.vote.season||s.day>=o.vote.day){o.vote=null;changed=true;}
  else {next(s);changed=true;if(s.draft||s.offseason||s.season!==o.vote.season||s.day>=o.vote.day)o.vote=null;}
 }
 else if(canAutoAdvance(s,presence)){next(s);changed=true;}
 if(!changed)return state;o.revision++;E.validate(s);return s;
}
export function validateOnline(s,requireKeys=false){
 const o=s.online;if(!o)return true;const bad=()=>fail('invalid_save');
 if(o.version!==1||!['lobby','playing'].includes(o.phase)||o.host!=='t0'||!Array.isArray(o.members)||o.members.length<1||o.members.length>6||new Set(o.members.map(m=>m.teamId)).size!==o.members.length||!o.members.some(m=>m.teamId===o.host))bad();
 for(const m of o.members){if(!E.team(s,m.teamId)||typeof m.name!=='string'||m.name.length>40||typeof m.delegated!=='boolean'||!o.managers[m.teamId]||!Number.isSafeInteger(o.managers[m.teamId].points)||o.managers[m.teamId].points<0)bad();if(requireKeys&&(typeof o.keys?.[m.teamId]!=='string'||o.keys[m.teamId].length<64))bad();}
 if(!o.lives||!o.controls||!o.ready||!o.matchReady||!o.lastMatches||!Number.isSafeInteger(o.revision)||o.revision<0)bad();
 const occupied=new Set();for(const [id,l] of Object.entries(o.lives)){if(l.id!==id||!o.controls[id]||!Number.isInteger(l.matchRng))bad();for(const tid of [l.away,l.home]){if(occupied.has(tid))bad();occupied.add(tid);}E.validate({...s,live:l});}
 return true;
}
