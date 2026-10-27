import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import JSZip from 'jszip';import {wrap,compressedRuntime} from './launcher.mjs';import {planRelease} from './release-plan.mjs';
const args=process.argv.slice(2);let requestedVersion,dryRun=false;for(let i=0;i<args.length;i++){if(args[i]==='--dry-run')dryRun=true;else if(args[i]==='--version'&&args[i+1])requestedVersion=args[++i];else throw Error('Usage: node prepare-release.mjs [--version YYYY.MM.DD.N] [--dry-run]');}
const root=path.dirname(fileURLToPath(import.meta.url)),ws=path.dirname(root),current=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8')),assets=path.join(root,'release-assets');
const zip=await JSZip.loadAsync(await fs.readFile(path.join(ws,'베이스볼로드-Netlify.zip'))),sw=zip.file('sw.js');if(!sw)throw Error('Input ZIP is missing sw.js.');const release=planRelease(current,await sw.async('string'),requestedVersion);
if(dryRun){console.log(JSON.stringify({version:release.version,tag:release.tag,build:release.build,previousBuild:current.build},null,2));process.exit(0);}
const origin=process.env.BASEBALL_SITE_ORIGIN||release.siteUrl||'https://baseball-road-kyg1128.onrender.com';
release.app='baseball-road';release.siteUrl=origin;release.updateMode='launch-and-refresh';
const config={build:release.build,version:release.version,manifestUrl:`https://raw.githubusercontent.com/${release.repository}/main/release.json`,runtimeOrigin:origin};
const raw=await fs.readFile(path.join(ws,'베이스볼로드.html'),'utf8');if(raw.includes('id="bb-offline-runtime"'))throw Error('Input HTML must be the original game build, not an existing launcher.');const html=wrap(raw,config);await fs.mkdir(assets,{recursive:true});await fs.writeFile(path.join(assets,'baseball-road.html'),html);
const runtime=compressedRuntime(html);release.runtime={url:origin+'/runtime/'+release.build+'/game.bin',encoding:'gzip',bytes:runtime.length,sha256:createHash('sha256').update(runtime).digest('hex')};
const index=await zip.file('index.html').async('string');zip.file('index.html',wrap(index,config));
await fs.writeFile(path.join(assets,'baseball-road-web.zip'),await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:9}}));
for(const name of['baseball-road.html','baseball-road-web.zip']){const data=await fs.readFile(path.join(assets,name));release.files[name]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};}
await fs.writeFile(path.join(root,'release.json'),JSON.stringify(release,null,2));console.log(JSON.stringify({version:release.version,build:release.build,siteUrl:origin,files:release.files,runtime:release.runtime},null,2));
