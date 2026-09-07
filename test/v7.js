const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8775);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8775/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
// 1. new kinds + llama + cannon blast + heat
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={};
  S.party.tabsPaid=9; S.perm.weaponsUnlocked=['pistol','six','shotgun','rifle','cannon']; S.party.nodes={shock:2,stun:1,jackpot:3,heavy:2,launcher:1,llama_luck:3,hot_start:2,encore:1,heirloom:1,magnet:1,vacuum:1};
  clearPinatas(); startRun({}); await sleep(200);
  o.hotStart=RUN.streak;
  clearPinatas(); for(const k of ['cactus','sun','donkey','star']) spawnHanging(k); const L=spawnLlama(); o.kinds=pinatas.map(p=>p.kindId);
  o.llamaHittable=L.hittable().length; L.update(0.5,1); o.llamaMoved=L.pivot.position.x;
  // pistol heat
  S.party.weapon='pistol'; buildGun(D.weapon()); RUN.heat=0; for(let i=0;i<8;i++){ RUN.lastShotT=-99; RUN.mag=20; aim.y=0.99; shoot(i*0.3); }
  o.heat=RUN.heat; o.heatBar=document.getElementById('heat-bar').style.width; o.heatHidden=document.getElementById('heat-wrap').hidden;
  // cannon blast at a pinata
  S.party.weapon='cannon'; buildGun(D.weapon()); RUN.mag=3; RUN.reloading=false; RUN.lastShotT=-99; RUN.heat=0;
  const P=pinatas.find(p=>p.kindId==='donkey'); const wp=P.worldPos(); const v=wp.clone().project(camera); aim.x=v.x; aim.y=v.y; const before=pinatas.length; const ks=S.perm.keepsakes;
  shoot(50); o.cannon={before, after:pinatas.length, candy:RUN.runCandy, heatHidden:document.getElementById('heat-wrap').hidden};
  // llama break
  const L2=pinatas.find(p=>p.kindId==='llama')||spawnLlama(); const h={part:'sweet',point:L2.worldPos().clone(),dist:0,object:null}; applyHit(L2,h,D.weapon(),60); o.llama={keepsakes:S.perm.keepsakes-ks, candy:RUN.runCandy, won:RUN.keepsakesWon};
  // reload FX
  RUN.mag=0; RUN.reloading=false; afterShot(); for(let i=0;i<20;i++){ updateGun(0.03, 100+i*0.03, false); } o.reloadFx=RELOAD_FX.pieces.length;
  // launcher volley
  RUN.launcherT=0; RUN.timeLeft=5; Math.random=()=>0.1; updateRun(0.016, 101); Math.random=Math.random; o.launched=RUN.launched;
  // encore
  RUN.streak=9; RUN.timeLeft=0.001; RUN.encoreUsed=false; updateRun(0.016,102); o.encore={timeLeft:RUN.timeLeft.toFixed(1), used:RUN.encoreUsed};
  // vacuum stays low
  RUN.streak=6; burst(new THREE.Vector3(0,1,-4),0xff0000,0,20); for(let i=0;i<30;i++) updateRun(0.016, 103+i*0.016); const th=particles.filter(p=>p.userData.kind==='tohost'); for(let i=0;i<10;i++) updateParticles(0.05); o.vacMaxY=Math.max(...particles.filter(p=>p.userData.kind==='tohost').map(p=>p.position.y), 0);
  return o;});
console.log(JSON.stringify(r,null,1));
await page.screenshot({path:'test/v7-run.png'});
// 2. run over screen: no mailbox button; debt banner in hub
const r2=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); RUN.timeLeft=0.001; RUN.encoreUsed=true; for(let i=0;i<80;i++){ updateRun(0.016, 200+i*0.016); if(!RUN.active) break; } await sleep(200);
  return {mode:HUB.mode, buttons:[...document.querySelectorAll('.ro-actions button')].map(b=>b.textContent)};});
console.log(JSON.stringify(r2));
await page.screenshot({path:'test/v7-runover.png'});
const r3=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); closeRunOver(); setPaused(false); S.party.tabs.forEach(t=>t.dueLeft=0); await sleep(800); return {banner:document.getElementById('debt-banner').textContent, on:document.getElementById('debt-banner').classList.contains('on'), bubble:!!BACKER.bubble};});
console.log(JSON.stringify(r3));
await page.screenshot({path:'test/v7-hub.png'});
// 3. tree renders all nodes without overlap
const r4=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); S.party.candy=999999; openPanel('tree'); await sleep(400);
  const nodes=[...document.querySelectorAll('#tree-svg .node')].map(g=>{const c=g.querySelector('circle.bg'); return {id:g.dataset.node, x:+c.getAttribute('cx'), y:+c.getAttribute('cy')};});
  let minD=1e9,pair=null; for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const d=Math.hypot(nodes[i].x-nodes[j].x,(nodes[i].y-nodes[j].y)); if(d<minD){minD=d;pair=[nodes[i].id,nodes[j].id];}}
  return {count:nodes.length, minD:Math.round(minD), pair, total:BRANCHES.reduce((a,b)=>a+b.nodes.length,0)};});
console.log(JSON.stringify(r4));
await page.screenshot({path:'test/v7-tree.png'});
await page.evaluate(async()=>{closePanel(); setPaused(false); S.party.runCount=3; refreshHub(); HUB.pos.set(4.8,0,-1.5); await new Promise(r=>setTimeout(r,900)); interact();});
await page.waitForTimeout(400); await page.screenshot({path:'test/v7-weapons.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
