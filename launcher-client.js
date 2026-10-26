// Launch-time updates only. Save slots stay in the same document origin.
(function(root){'use strict';
 const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
 async function digest(blob){return hex(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()));}
 function validManifest(m,config){try{return m.app==='baseball-road'&&/^[a-f0-9]{10,64}$/.test(m.build)&&m.runtime?.encoding==='gzip'&&/^[a-f0-9]{64}$/.test(m.runtime.sha256)&&new URL(m.runtime.url).origin===config.runtimeOrigin;}catch{return false;}}
 async function choose(d){
  let cached=null,chosen=null;try{const value=await d.loadCache();if(value?.blob&&await d.hash(value.blob)===value.sha256)cached={...value,source:'cache'};}catch{}
  try{const m=await d.fetchManifest();if(validManifest(m,d.config)&&m.build!==(cached?.build||d.config.build)){
   d.onState('download',m);const blob=await d.fetchRuntime(m.runtime);if(blob.size!==m.runtime.bytes||await d.hash(blob)!==m.runtime.sha256)throw Error('Runtime integrity');
   chosen={build:m.build,version:m.version,sha256:m.runtime.sha256,blob,source:'update'};try{await d.saveCache(chosen);}catch{}d.onState('updated',m);
  }}catch{d.onState('offline');}
  return chosen||cached||await d.embedded();
 }
 function database(){return new Promise(resolve=>{let finished=false;const finish=db=>{if(finished){db?.close();return;}finished=true;clearTimeout(timer);resolve(db);},timer=setTimeout(()=>finish(null),1500);try{const request=indexedDB.open('baseball-road-update-cache',1);request.onupgradeneeded=()=>request.result.createObjectStore('runtime');request.onsuccess=()=>finish(request.result);request.onerror=request.onblocked=()=>finish(null);}catch{finish(null);}});}
 async function cacheRead(){const db=await database();if(!db)return null;return new Promise(resolve=>{const tx=db.transaction('runtime','readonly'),r=tx.objectStore('runtime').get('latest');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);tx.oncomplete=tx.onerror=()=>db.close();});}
 async function cacheWrite(value){const db=await database();if(!db)return;return new Promise((resolve,reject)=>{const tx=db.transaction('runtime','readwrite');tx.objectStore('runtime').put(value,'latest');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=tx.onabort=()=>{db.close();reject(Error('Cache unavailable'));};});}
 function base64Blob(text){const parts=[],chunk=4*1024*1024;for(let i=0;i<text.length;i+=chunk){const s=atob(text.slice(i,i+chunk)),bytes=new Uint8Array(s.length);for(let j=0;j<s.length;j++)bytes[j]=s.charCodeAt(j);parts.push(bytes);}return new Blob(parts,{type:'application/octet-stream'});}
 async function inflate(blob){return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).text();}
 async function start(config){
  const status=document.querySelector('#update-status'),progress=document.querySelector('#update-progress'),button=document.querySelector('#start-current'),controller=new AbortController();
  const state=(name,m)=>{if(status)status.textContent=name==='download'?`${m.version} 새 버전을 받는 중…`:name==='updated'?'업데이트를 적용하고 있습니다…':name==='offline'?'저장된 게임을 준비하고 있습니다…':'게임을 준비하고 있습니다…';};
  button?.addEventListener('click',()=>controller.abort());
  const embedded=async()=>({build:config.build,version:config.version,sha256:config.embeddedSha256,source:'embedded',blob:base64Blob(document.querySelector('#bb-offline-runtime').textContent.trim())});
  let selected=await choose({config,embedded,loadCache:cacheRead,saveCache:cacheWrite,hash:digest,onState:state,
   async fetchManifest(){if(controller.signal.aborted)throw Error('Cancelled');const deadline=AbortSignal.timeout(4500),signal=AbortSignal.any([deadline,controller.signal]),url=new URL(config.manifestUrl);url.searchParams.set('check',String(Date.now()));const r=await fetch(url,{cache:'no-store',credentials:'omit',signal});if(!r.ok)throw Error('Manifest unavailable');return r.json();},
   async fetchRuntime(runtime){const r=await fetch(runtime.url+'?build='+encodeURIComponent(runtime.sha256.slice(0,16)),{cache:'no-store',credentials:'omit',signal:controller.signal});if(!r.ok||!r.body)throw Error('Update unavailable');const reader=r.body.getReader(),parts=[];let size=0;while(true){let timer,read;try{read=await Promise.race([reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>{reader.cancel().catch(()=>{});reject(Error('Stalled download'));},30000);})]);}finally{clearTimeout(timer);}if(read.done)break;parts.push(read.value);size+=read.value.length;if(size>runtime.bytes)throw Error('Unexpected update size');if(progress){progress.value=size;progress.max=runtime.bytes;}if(status)status.textContent=`새 버전을 받는 중… ${(size/1024/1024).toFixed(1)} / ${(runtime.bytes/1024/1024).toFixed(1)} MiB`;}return new Blob(parts,{type:'application/octet-stream'});}
  });
  state('launch');let html;try{html=await inflate(selected.blob);}catch{selected=await embedded();html=await inflate(selected.blob);}
  const meta={version:selected.version,build:selected.build,source:selected.source||'cache'},inject='<script>globalThis.BB_AUTO_UPDATE='+JSON.stringify(meta).replace(/</g,'\\u003c')+';<'+ '/script>';
  html=html.replace(/<head(?:\s[^>]*)?>/i,m=>m+inject);document.open();document.write(html);document.close();
 }
 root.BBAutoUpdater={choose,validManifest,inflate,base64Blob,start};
 if(typeof document!=='undefined'&&document.querySelector('#bb-launcher-config'))start(JSON.parse(document.querySelector('#bb-launcher-config').textContent)).catch(()=>{const s=document.querySelector('#update-status');if(s)s.textContent='게임을 열지 못했습니다. 최신 Chrome 또는 Edge에서 다시 열어 주세요.';});
})(globalThis);
