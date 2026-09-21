import {mkdir,readdir,cp,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist/client',{recursive:true,force:true});await mkdir('dist/client',{recursive:true});
for(const f of await readdir('dist'))if(!['client','server','.openai'].includes(f))await cp('dist/'+f,'dist/client/'+f,{recursive:true});
await mkdir('dist/server',{recursive:true});await cp('server/worker.js','dist/server/index.js');await cp('server/relay.js','dist/server/relay.js');
await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/wrangler.json',JSON.stringify({name:'slimball-manager',main:'index.js',compatibility_date:'2026-09-01',assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*']},d1_databases:[{binding:'DB',database_name:'slimball-relay',database_id:'local'}]},null,2));
console.log('Built game assets and online relay');
