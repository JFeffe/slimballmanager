// Local integration server using the exact production relay and migrations.
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {relay} from '../server/relay.js';
const sql=new DatabaseSync(':memory:');for(const f of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())sql.exec(await readFile('drizzle/'+f,'utf8'));
const DB={prepare(query){let values=[];return {bind(...v){values=v;return this;},run(){return sql.prepare(query).run(...values);},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};}};},async batch(items){sql.exec('BEGIN');try{const results=[];for(const s of items)results.push(s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://127.0.0.1');if(u.pathname.startsWith('/api/')){let body='';for await(const chunk of req)body+=chunk;const request=new Request(u,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}:{})});const r=await relay(request,{DB});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return;}const file=path.resolve('dist','.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(path.resolve('dist')+'/'))throw Error('not found');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:process.env.PORT||8080),'0.0.0.0',()=>console.log('Slimball online preview ready'));
