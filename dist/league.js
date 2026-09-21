// Read-only calculations. No random draws: opening a report cannot alter a match.
const copy=x=>JSON.parse(JSON.stringify(x));
const played=a=>a&&(a.ab+a.bb+a.bf+a.balls)>0;
export const awardTypes=['award_mvp','award_pitcher','award_bat','award_glove','award_rookie','award_playoffs','award_progress'];
export function awardScore(a,type){const bat=a.singles+2*a.doubles+3*a.triples+4*a.hr+.7*a.bb+.5*a.runs+.6*a.rbi-.3*a.so,glove=a.catchOuts+a.throwOuts-2*a.errors,pitch=.4*a.pitchOuts+a.pitchSO-1.5*a.earned-.5*a.hitsAllowed-.5*a.pitchBB;return type==='award_bat'?bat:type==='award_glove'?glove:type==='award_pitcher'?pitch:bat+.5*glove+.5*Math.max(0,pitch);}
export function rookieEligible(s,p){return s.season>=2&&!p.history.some(h=>h.season<s.season&&played(h.stats))&&!s.archives.some(a=>a.season<s.season&&played(a.players[p.id]?.stats));}
export function awardTeam(s,id,playoff=false){const counts=new Map();for(const m of s.schedule.filter(m=>!!m.playoff===playoff&&m.result))for(const tm of m.result.gameStats||[])if(tm.players.some(p=>p.id===id))counts.set(tm.id,(counts.get(tm.id)||0)+1);return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||s.teams.find(t=>t.roster.includes(id))?.id||null;}
export function seasonAwards(s){
 const result=[],all=Object.values(s.players).filter(p=>!p.retired);
 for(const type of [...awardTypes.filter(k=>k!=='award_progress'&&(k!=='award_rookie'||s.season>=2)),'avg','hr','rbi']){
  const post=type==='award_playoffs',eligible=all.filter(p=>{const a=post?p.playoffStats:p.stats;if(!played(a))return false;if(type==='award_rookie'&&!rookieEligible(s,p))return false;return type==='award_pitcher'?a.pitchOuts>=54:type==='award_glove'?a.balls>=20:type==='award_bat'||type==='avg'?a.ab>=30:type==='hr'||type==='rbi'?a[type]>0:post?a.ab+a.bb>=6||a.pitchOuts>=9:a.ab+a.bb>=30||a.pitchOuts>=54;});
  const score=p=>{const a=post?p.playoffStats:p.stats;return type==='avg'?a.hits/a.ab:type==='hr'||type==='rbi'?a[type]:awardScore(a,type);};
  eligible.sort((a,b)=>score(b)-score(a)||((post?b.playoffStats:b.stats).ab+(post?b.playoffStats:b.stats).bf)-((post?a.playoffStats:a.stats).ab+(post?a.playoffStats:a.stats).bf)||a.id.localeCompare(b.id));
  if(eligible.length){const p=eligible[0];result.push({type,id:p.id,name:p.name,season:s.season,rank:1,score:score(p),teamId:awardTeam(s,p.id,post),podium:eligible.slice(0,3).map((q,i)=>({id:q.id,name:q.name,rank:i+1,score:score(q),teamId:awardTeam(s,q.id,post)}))});}
 }return result;
}
export function progressAward(s){const candidates=s.summary.changes.filter(c=>played(s.players[c.id]?.stats)).map(c=>({...c,score:Object.values(c.delta).reduce((a,b)=>a+b,0)})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));const p=candidates[0];return p?{type:'award_progress',id:p.id,name:p.name,season:s.season,rank:1,score:p.score,teamId:awardTeam(s,p.id)}:null;}
export function buildPreMatch(s,id,autoAlign){
 const m=s.schedule.find(x=>x.id===id);if(!m||m.result||m.day!==s.day||s.live||s.draft||s.offseason)return null;
 // Clone only teams; autoAlign reads players and changes only the target lineup.
 const teams=s.teams.map(copy),preview={...s,teams};for(const t of teams.filter(t=>[m.away,m.home].includes(t.id)))if(t.auto)autoAlign(preview,t);
 const rank=[...s.teams].sort((a,b)=>b.w-a.w||b.runs-a.runs||a.name.localeCompare(b.name));
 const summaries=[m.away,m.home].map(id=>{const t=teams.find(t=>t.id===id),active=t.order.map(id=>s.players[id]),recent=s.schedule.filter(g=>g.result&&[g.away,g.home].includes(id)&&g.day<m.day).sort((a,b)=>b.day-a.day).slice(0,5);return {team:t,rank:rank.findIndex(x=>x.id===id)+1,form:recent.map(g=>({id:g.id,win:g.result.winner===id,score:g.result.score})),pitcher:s.players[t.positions.P],hitters:[...active].sort((a,b)=>awardScore(b.stats,'award_bat')-awardScore(a.stats,'award_bat')||(b.base.contact+b.base.power)-(a.base.contact+a.base.power)||a.id.localeCompare(b.id)).slice(0,2),defense:active.reduce((n,p)=>n+p.base.catch,0)/6};});
 const own=summaries.find(x=>x.team.id===s.user),tips=[];
 if(own){const bench=own.team.roster.filter(id=>!own.team.order.includes(id)).map(id=>s.players[id]),used=new Set();for(const p of own.team.order.map(id=>s.players[id]).sort((a,b)=>a.energy-b.energy)){const pos=Object.keys(own.team.positions).find(k=>own.team.positions[k]===p.id),score=q=>pos==='P'?q.base.throw:pos==='C'?q.base.contact+q.base.power:q.base.catch+(pos.startsWith('F')?q.base.speed:q.base.throw);const replacement=bench.filter(q=>!used.has(q.id)&&q.energy>p.energy).sort((a,b)=>score(b)-score(a)||b.energy-a.energy)[0];if(p.energy<60&&replacement){tips.push({key:'tip_rest',args:{name:p.name,replacement:replacement.name,energy:p.energy,pos}});used.add(replacement.id);}if(tips.length===2)break;}
 const opponent=summaries.find(x=>x.team.id!==s.user);if(opponent)tips.push({key:'tip_pitcher',args:{name:opponent.pitcher.name,skill:opponent.pitcher.base.throw,energy:opponent.pitcher.energy}});if(!tips.some(t=>t.key==='tip_rest'))tips.unshift({key:'tip_ready',args:{energy:Math.min(...own.team.order.map(id=>s.players[id].energy))}});
 }
 const h2h=[...s.archives.flatMap(a=>a.schedule.map(g=>({...g,season:a.season}))),...s.schedule.filter(g=>g.day<m.day).map(g=>({...g,season:s.season}))].filter(g=>g.result&&[g.away,g.home].includes(m.away)&&[g.away,g.home].includes(m.home)).sort((a,b)=>b.season-a.season||b.day-a.day).slice(0,5);
 return {match:m,teams:summaries,tips:tips.slice(0,3),h2h};
}
