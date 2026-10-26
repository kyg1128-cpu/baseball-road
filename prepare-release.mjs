import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import JSZip from 'jszip';import {wrap,compressedRuntime} from './launcher.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),ws=path.dirname(root),release=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8')),assets=path.join(root,'release-assets');
const origin=process.env.BASEBALL_SITE_ORIGIN||release.siteUrl||'https://baseball-road-kyg1128.onrender.com';
release.app='baseball-road';release.siteUrl=origin;release.updateMode='launch-and-refresh';
const config={build:release.build,version:release.version,manifestUrl:`https://raw.githubusercontent.com/${release.repository}/main/release.json`,runtimeOrigin:origin};
const raw=await fs.readFile(path.join(ws,'베이스볼로드.html'),'utf8'),html=wrap(raw,config);await fs.writeFile(path.join(assets,'baseball-road.html'),html);
const runtime=compressedRuntime(html);release.runtime={url:origin+'/runtime/game.bin',encoding:'gzip',bytes:runtime.length,sha256:createHash('sha256').update(runtime).digest('hex')};
const zip=await JSZip.loadAsync(await fs.readFile(path.join(ws,'베이스볼로드-Netlify.zip'))),index=await zip.file('index.html').async('string');zip.file('index.html',wrap(index,config));
await fs.writeFile(path.join(assets,'baseball-road-web.zip'),await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:9}}));
for(const name of['baseball-road.html','baseball-road-web.zip']){const data=await fs.readFile(path.join(assets,name));release.files[name]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};}
await fs.writeFile(path.join(root,'release.json'),JSON.stringify(release,null,2));console.log(JSON.stringify({version:release.version,build:release.build,siteUrl:origin,files:release.files,runtime:release.runtime},null,2));
