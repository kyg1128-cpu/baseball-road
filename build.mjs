import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
import {unwrap,compressedRuntime} from './launcher.mjs';

const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'public'),release=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
const archiveArg=process.argv.indexOf('--archive'),asset='baseball-road-web.zip',url=`https://github.com/${release.repository}/releases/download/${release.tag}/${asset}`;
let bytes;
if(archiveArg>=0)bytes=await fs.readFile(path.resolve(process.argv[archiveArg+1]));
else{const response=await fetch(url,{signal:AbortSignal.timeout(240000)});if(!response.ok)throw Error(`Release download failed: HTTP ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());}
if(bytes.length!==release.files[asset].bytes||createHash('sha256').update(bytes).digest('hex')!==release.files[asset].sha256)throw Error('The game archive differs from the verified release.');
const archive=await JSZip.loadAsync(bytes),entries=Object.values(archive.files).filter(x=>!x.dir);
// Only the generated public folder is replaceable. User saves and project
// sources are outside it; release archive entries cannot escape /play.
if(path.dirname(out)!==root||path.basename(out)!=='public')throw Error('Invalid output path');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(path.join(out,'play'),{recursive:true});
for(const entry of entries){const target=path.resolve(out,'play',entry.name);if(!target.startsWith(path.join(out,'play')+path.sep))throw Error('Unsafe archive path');await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,entry.name==='index.html'?unwrap(await entry.async('string')):await entry.async('nodebuffer'));}
const launcherFile='baseball-road.html';let launcher;
if(archiveArg>=0)launcher=await fs.readFile(path.join(path.dirname(path.resolve(process.argv[archiveArg+1])),launcherFile));
else{const response=await fetch(`https://github.com/${release.repository}/releases/download/${release.tag}/${launcherFile}`,{signal:AbortSignal.timeout(240000)});if(!response.ok)throw Error('Launcher download failed: '+response.status);launcher=Buffer.from(await response.arrayBuffer());}
if(launcher.length!==release.files[launcherFile].bytes||createHash('sha256').update(launcher).digest('hex')!==release.files[launcherFile].sha256)throw Error('Launcher differs from verified release');
const runtime=compressedRuntime(launcher.toString('utf8'));if(runtime.length!==release.runtime.bytes||createHash('sha256').update(runtime).digest('hex')!==release.runtime.sha256)throw Error('Runtime differs from update manifest');
await fs.mkdir(path.join(out,'runtime'),{recursive:true});await fs.writeFile(path.join(out,'runtime/game.bin'),runtime);
// Network-first refreshes never pin a visitor to an old asset cache.
await fs.writeFile(path.join(out,'play/sw.js'),`const CACHE='baseball-road-${release.build}';self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('baseball-road-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>{const c=await caches.open(CACHE);return await c.match(e.request)||e.request.mode==='navigate'&&await c.match('./index.html')||Response.error();}));});`);
let portal=await fs.readFile(path.join(root,'download.html'),'utf8');
const htmlSize=(release.files['baseball-road.html'].bytes/1024/1024).toFixed(1),zipSize=(release.files[asset].bytes/1024/1024).toFixed(1);
for(const[key,value]of Object.entries({VERSION:release.version,HTML_SIZE:htmlSize,ZIP_SIZE:zipSize,REPOSITORY:release.repository,TAG:release.tag}))portal=portal.replaceAll(`{{${key}}}`,value);
await fs.writeFile(path.join(out,'index.html'),portal);await fs.writeFile(path.join(out,'release.json'),JSON.stringify(release,null,2));
await fs.writeFile(path.join(out,'SHA256SUMS.txt'),Object.entries(release.files).map(([n,f])=>f.sha256+'  '+n).join('\n')+'\n');
console.log(`Built ${entries.length} game files + download page; verified release ${release.version}.`);
