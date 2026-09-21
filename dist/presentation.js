import {logoById} from './logos.js';
const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16));
const mix=(a,b,f)=>'#'+rgb(a).map((v,i)=>Math.round(v*(1-f)+rgb(b)[i]*f).toString(16).padStart(2,'0')).join('');
export const luminance=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
export const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
export const onColor=c=>contrast(c,'#ffffff')>=contrast(c,'#000000')?'#ffffff':'#000000';
export function themeTokens(id){const l=logoById(id);if(!l)return '';const [main,second,third]=l.colors,accent=id==='wolf'?third:second;
 const tokens={ink:'#eaf3ff',deep:'#071629',paper:'#071322',light:'#10243b',line:'#284f75',muted:'#a9bfd5',orange:'#f0c365','team-main':main,'team-accent':accent,'team-third':third,'on-main':onColor(main),'on-accent':onColor(accent),'team-soft':mix(main,'#10243b',.86),'team-hover':mix(main,'#284568',.8)};
 return Object.entries(tokens).map(([k,v])=>`--${k}:${v}`).join(';');}
export function viewedLogo(s,route,params,source,previous){if(!s)return null;let id=s.user;if(route==='team')id=params.id||s.user;else if(route==='profile'&&previous?.route==='team')id=previous.params.id||s.user;return (source?.teams.find(t=>t.id===id)||s.teams.find(t=>t.id===s.user))?.logo;}
// Presentation only: never consumes gameplay RNG or changes a match result.
export function matchMoment(e,previous,finished=false){if(!e)return null;
 if(e.type==='HR')return e.runs===4?'grand-slam':'home-run';
 if(e.type==='DP'||e.doublePlay===true)return 'double-play';
 if(finished)return 'victory';
 if(e.type==='3B')return 'triple';
 const h=e.half,old=previous?.score||[0,0];
 if(e.runs>0&&old[h]<=old[1-h]&&e.score[h]>e.score[1-h])return 'lead';
 return null;}
export const MOMENT_LABELS={
 'home-run':['CIRCUIT !','HOME RUN!','¡JONRÓN!'],
 'grand-slam':['GRAND CHELEM !','GRAND SLAM!','¡GRAND SLAM!'],
 'double-play':['DOUBLE JEU !','DOUBLE PLAY!','¡DOBLE PLAY!'],
 triple:['TRIPLE !','TRIPLE!','¡TRIPLE!'],
 lead:['PREND L’AVANCE !','TAKES THE LEAD!','¡TOMA LA VENTAJA!'],
 victory:['VICTOIRE !','VICTORY!','¡VICTORIA!']
};

// Explicit runner routes derived from consecutive event snapshots, never inferred
// from a defensive animation or a random draw. Bases use 0=home, 1..3, 4=scored.
export function runnerTransitions(previous,event){
 if(!event?.bases||!event.batterId)return [];
 const before=previous?.inning===event.inning&&previous?.half===event.half?previous.bases||[]:[];
 const after=event.bases;
 if(!['BB','E','1B','2B','3B','HR'].includes(event.type))return [];
 const candidates=before.flatMap((runner,i)=>runner?[{id:runner.id,from:i+1}]:[]);
 candidates.push({id:event.batterId,from:0});
 return candidates.flatMap(r=>{const dest=after.findIndex(x=>x?.id===r.id);const to=dest>=0?dest+1:4;return to===r.from?[]:[{...r,to,scored:to===4}];});
}
// Prefer the match snapshot. Older full replays can recover positions from their box score.
export function replayLineup(match,team){
 const saved=match.lineups?.find(x=>x.id===team.id);if(saved)return saved;
 const players=match.gameStats?.find(x=>x.id===team.id)?.players;
 if(players?.length)return {id:team.id,order:players.map(p=>p.id),positions:Object.fromEntries(players.filter(p=>p.pos).map(p=>[p.pos,p.id]))};
 return {id:team.id,order:team.order,positions:team.positions};
}
