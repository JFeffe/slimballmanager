const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const validKey=k=>typeof k==='string'&&/^[a-zA-Z0-9-]{64,100}$/.test(k);
async function body(req,max){if(Number(req.headers.get('Content-Length')||0)>max)throw Error('Message trop volumineux.');const text=await req.text();if(text.length>max)throw Error('Message trop volumineux.');return JSON.parse(text);}
export async function relay(req,env){
 const url=new URL(req.url),db=env.DB,now=Date.now();
 if(req.method==='OPTIONS')return json({});
 if(!db)return json({error:'Le service multijoueur est indisponible.'},503);
 try{
  // Relay payloads expire; there is no cloud-save or restore endpoint.
  await db.batch([db.prepare('DELETE FROM relay_commands WHERE room IN (SELECT id FROM relay_rooms WHERE expires < ?)').bind(now),db.prepare('DELETE FROM relay_presence WHERE room IN (SELECT id FROM relay_rooms WHERE expires < ?)').bind(now),db.prepare('DELETE FROM relay_rooms WHERE expires < ?').bind(now)]);
  if(url.pathname==='/api/rooms'&&req.method==='POST'){
   const b=await body(req,4000);if(!b.keys||!validKey(b.keys.t0)||Object.keys(b.keys).length>6||Object.entries(b.keys).some(([id,key])=>!/^t[0-5]$/.test(id)||!validKey(key)))return json({error:'Invitation invalide.'},400);
   const ip=await hash(req.headers.get('CF-Connecting-IP')||'local');const quota=await db.prepare('SELECT COUNT(*) AS n FROM relay_rooms WHERE owner_ip=?').bind(ip).first();if(quota.n>=12)return json({error:'Trop de salons ouverts. Fermez un ancien salon et réessayez dans une minute.'},429);
   const id=crypto.randomUUID(),keys=Object.fromEntries(await Promise.all(Object.entries(b.keys).map(async([id,key])=>[id,await hash(key)])));
   await db.prepare('INSERT INTO relay_rooms (id,keys_json,snapshot,revision,expires,host_seen,owner_ip) VALUES (?,?,?,?,?,?,?)').bind(id,JSON.stringify(keys),'',-1,now+60000,now,ip).run();return json({room:id});
  }
  const match=url.pathname.match(/^\/api\/rooms\/([\w-]{36})(?:\/(snapshot|commands|leave))?$/);if(!match)return json({error:'Salon introuvable.'},404);
  const [,id,action]=match,room=await db.prepare('SELECT * FROM relay_rooms WHERE id=?').bind(id).first();if(!room)return json({error:'Le salon est fermé. Demandez une nouvelle invitation à l’hôte.',expired:true},410);
  const auth=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!validKey(auth))return json({error:'Invitation invalide.'},403);
  const key=await hash(auth),keys=JSON.parse(room.keys_json),actor=Object.keys(keys).find(tid=>keys[tid]===key);if(!actor)return json({error:'Cette invitation ne correspond pas à un participant de la ligue.'},403);
  const host=actor==='t0';
  if(action==='leave'&&req.method==='POST'){
   await db.prepare('DELETE FROM relay_presence WHERE room=? AND actor=?').bind(id,actor).run();
   if(host)await db.prepare('UPDATE relay_rooms SET host_seen=0 WHERE id=?').bind(id).run();return json({ok:true});
  }
  await db.prepare('INSERT INTO relay_presence(room,actor,seen) VALUES(?,?,?) ON CONFLICT(room,actor) DO UPDATE SET seen=excluded.seen').bind(id,actor,now).run();
  if(host)await db.prepare('UPDATE relay_rooms SET expires=?,host_seen=? WHERE id=?').bind(now+60000,now,id).run();
  if(action==='snapshot'&&req.method==='POST'){
   if(!host)return json({error:'Seul l’hôte peut publier la partie.'},403);
   const b=await body(req,1950000);if(typeof b.snapshot!=='string'||b.snapshot.length>1800000||!Number.isSafeInteger(b.revision)||!Array.isArray(b.allowed)||!b.allowed.includes('t0')||b.allowed.some(t=>!keys[t]))return json({error:'État invalide.'},400);
   if(b.revision<room.revision)return json({error:'État dépassé.'},409);
   const allowed=Object.fromEntries(b.allowed.map(t=>[t,keys[t]]));
   // Compare at write time: a delayed request must not roll back a newer snapshot or acknowledge its commands.
   const results=await db.batch([db.prepare('UPDATE relay_rooms SET snapshot=?,revision=?,keys_json=? WHERE id=? AND (revision<? OR (revision=? AND snapshot=?))').bind(b.snapshot,b.revision,JSON.stringify(allowed),id,b.revision,b.revision,b.snapshot),db.prepare('DELETE FROM relay_commands WHERE room=? AND seq<=? AND EXISTS (SELECT 1 FROM relay_rooms WHERE id=? AND revision=? AND snapshot=?)').bind(id,Number.isSafeInteger(b.ack)?b.ack:0,id,b.revision,b.snapshot)]);
   if(!(results[0].meta?.changes??results[0].changes))return json({error:'État dépassé.'},409);return json({ok:true});
  }
  if(action==='commands'&&req.method==='POST'){
   const b=await body(req,8000);if(typeof b.id!=='string'||b.id.length>100||typeof b.type!=='string'||b.type.length>40)return json({error:'Commande invalide.'},400);
   const count=await db.prepare('SELECT COUNT(*) AS n FROM relay_commands WHERE room=? AND actor=?').bind(id,actor).first();if(count.n>=30)return json({error:'Veuillez attendre la réponse de l’hôte.'},429);
   await db.prepare('INSERT OR IGNORE INTO relay_commands(room,actor,command_id,payload) VALUES(?,?,?,?)').bind(id,actor,b.id,JSON.stringify(b)).run();return json({ok:true});
  }
  if(!action&&req.method==='GET'){
   const peers=await db.prepare('SELECT actor FROM relay_presence WHERE room=? AND seen>?').bind(id,now-10000).all();
   const presence=peers.results.map(x=>x.actor).filter(x=>keys[x]);if(!host&&room.host_seen<now-10000){const i=presence.indexOf('t0');if(i>=0)presence.splice(i,1);}
   const out={actor,presence,revision:room.revision};
   if(host){const cmds=await db.prepare('SELECT seq,actor,payload FROM relay_commands WHERE room=? ORDER BY seq LIMIT 60').bind(id).all();out.commands=cmds.results.map(c=>({seq:c.seq,actor:c.actor,command:JSON.parse(c.payload)}));}
   else if(Number(url.searchParams.get('since'))!==room.revision)out.snapshot=room.snapshot;
   return json(out);
  }
  return json({error:'Requête invalide.'},405);
 }catch(e){return json({error:e instanceof SyntaxError?'Message invalide.':'Connexion momentanément indisponible.'},e instanceof SyntaxError?400:503);}
}
