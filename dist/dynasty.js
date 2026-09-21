// Club-only totals from match sheets; transferred players retain their club contribution.
export function dynastyReport(s){
 const seasons=new Map(s.archives.map(a=>[a.season,a]));seasons.set(s.season,s);
 const players=new Map();let wins=0,losses=0,titles=0,playoffs=0,missing=0;const years=[],awards=[];
 for(const [year,src] of seasons){let w=0,l=0;const club=src.teams.find(t=>t.id===s.user);if(!club)continue;
 if((src.playoffs?.winner||src.winner)===s.user)titles++;
 if(src.playoffs?.seeds?.includes(s.user))playoffs++;
 for(const a of (src.awards||s.archives.find(a=>a.season===year)?.awards||[]))if(a.teamId===s.user)awards.push({...a,season:year});
 for(const m of src.schedule){if(!m.result||![m.home,m.away].includes(s.user))continue;
 m.result.winner===s.user?(wins++,w++):(losses++,l++);
 const sheet=m.result.gameStats?.find(t=>t.id===s.user);if(!sheet){missing++;continue;}
 for(const p of sheet.players){let r=players.get(p.id);if(!r){r={id:p.id,name:p.name,games:0,stats:{}};players.set(p.id,r);}r.games++;for(const [k,v] of Object.entries(p.stats))r.stats[k]=(r.stats[k]||0)+v;}
 }years.push({season:year,w,l});
 }
 const ps=[...players.values()],score=(p,k)=>p.stats[k]||0,best=fn=>[...ps].sort((a,b)=>fn(b)-fn(a)||a.id.localeCompare(b.id))[0]||null;
 const batter=best(p=>score(p,'singles')+2*score(p,'doubles')+3*score(p,'triples')+4*score(p,'hr')+.7*score(p,'bb')+.5*score(p,'runs')+.6*score(p,'rbi')-.3*score(p,'so'));
 const pitcher=ps.some(p=>score(p,'pitchOuts')>0)?best(p=>score(p,'pitchOuts')>0?.4*score(p,'pitchOuts')+score(p,'pitchSO')-1.5*score(p,'earned')-.5*score(p,'hitsAllowed')-.5*score(p,'pitchBB'):-Infinity):null;
 const fielder=best(p=>score(p,'catchOuts')+score(p,'throwOuts')-2*score(p,'errors'));
 const avg=[...ps].filter(p=>score(p,'ab')>=30).sort((a,b)=>score(b,'hits')/score(b,'ab')-score(a,'hits')/score(a,'ab')||a.id.localeCompare(b.id))[0]||null;
 return {wins,losses,titles,playoffs,missing,seasons:years.length,bestSeason:years.sort((a,b)=>b.w-a.w||a.l-b.l)[0],stars:{batter,pitcher,fielder,loyal:best(p=>p.games)},records:{hr:best(p=>score(p,'hr')),rbi:best(p=>score(p,'rbi')),pitchSO:best(p=>score(p,'pitchSO')),avg},awards};
}
