const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8781);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8781/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
// fallback camera: unbounded yaw via movementX
const cam=await page.evaluate(async()=>{ tutSkip(); setPaused(false); const y0=look.yaw; for(let i=0;i<50;i++) canvas.dispatchEvent(new MouseEvent('mousemove',{clientX:700,clientY:400,movementX:-60,movementY:0})); return {turned:(look.yaw-y0).toFixed(2), edge:HUB.edgeTurn}; });
console.log('camera', JSON.stringify(cam));
// chelo station + panel + dread
const ch=await page.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={}; HUB.pos.copy(BACKER.group.position); HUB.pos.z+=0.5; updateHub(0.016,1); o.near=HUB.near&&HUB.near.id; interact(); o.panel=PANEL.kind; document.getElementById('btn-lore-next').click(); o.lore=S.perm.lore; o.line=document.querySelector('.chelo-say .line').textContent.slice(0,40); closePanel(); setPaused(false);
  S.party.tabs.forEach(t=>t.dueLeft=0); updateBacker(0.016,2); for(let i=0;i<120;i++) updateDread(0.05, 3+i*0.05); o.dread={on:DREAD.on, k:DREAD.k.toFixed(2), sun:sun.intensity.toFixed(2), eyes:BACKER.eyes[0].visible, skin:BACKER.skinMat.color.getHexString()};
  S.party.tabs.forEach(t=>t.dueLeft=3); updateBacker(0.016,10); for(let i=0;i<200;i++) updateDread(0.05, 11+i*0.05); o.after={on:DREAD.on, k:DREAD.k.toFixed(2), eyes:BACKER.eyes[0].visible}; return o;});
console.log('chelo', JSON.stringify(ch));
await page.evaluate(()=>{ S.party.tabs.forEach(t=>t.dueLeft=0); updateBacker(0.016,2); for(let i=0;i<120;i++) updateDread(0.05, 3+i*0.05); HUB.pos.set(BACKER.group.position.x, 0, BACKER.group.position.z+2.6); camera.position.set(HUB.pos.x,1.6,HUB.pos.z); camera.lookAt(BACKER.group.position.x, 1.5, BACKER.group.position.z); camera.updateMatrixWorld(true); });
await page.waitForTimeout(200); await page.screenshot({path:'test/v10-dread.png'});
await page.evaluate(()=>{ interact(); }); await page.waitForTimeout(300); await page.screenshot({path:'test/v10-chelo.png'});
// run: reticles, timer bar, weapons
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={}; closePanel(); setPaused(false); S.party.tabs.forEach(t=>t.dueLeft=3); S.party.tabsPaid=12; S.perm.weaponsUnlocked=WEAPONS.map(w=>w.id); S.party.nodes.p_donkey=1; S.party.nodes.p_burro=1;
  clearPinatas(); startRun({}); await sleep(200); clearPinatas();
  o.bar={fill:document.getElementById('timer-fill').style.width, text:document.getElementById('timer').textContent};
  const tl=RUN.timeLeft; addTime(0.12,'SWEET'); o.gain={dt:(RUN.timeLeft-tl).toFixed(3), gainOp:document.getElementById('timer-gain').style.opacity};
  // spiker penalty
  const Sp=spawnPinata('spiker',{position:new THREE.Vector3(0,2.5,-5), stringLen:0.5}); const t2=RUN.timeLeft; applyHit(Sp,{part:'body',point:Sp.worldPos().clone(),dist:0,object:null},WEAPONS[1],1); updateTimerHUD(); o.penalty={lost:(t2-RUN.timeLeft).toFixed(1), penOp:document.getElementById('timer-pen').style.opacity, cls:document.getElementById('timer-wrap').className};
  // reticles
  o.ret={}; for(const w of WEAPONS){ S.party.weapon=w.id; setReticle(w); updateReticle(1,1); o.ret[w.id]=document.getElementById('crosshair').dataset.reticle; }
  S.party.weapon='shotgun'; setReticle(D.weapon()); updateReticle(1,1); o.circle=getComputedStyle(document.getElementById('crosshair')).getPropertyValue('--r').trim();
  // shotgun falloff: near donkey vs far donkey
  S.party.weapon='shotgun'; buildGun(D.weapon()); const near=spawnPinata('bull',{position:new THREE.Vector3(0,2.3,-4), stringLen:0.4}); scene.updateMatrixWorld(true); const v=near.worldPos().clone().project(camera); aim.x=v.x; aim.y=v.y; RUN.lastShotT=-99; RUN.mag=6; shoot(2); o.shotgunNear={alive:near.alive, dmg:near.damage, shots:RUN.shots, miss:RUN.missCount, active:RUN.active, ending:RUN.endingAt, v:[v.x.toFixed(2),v.y.toFixed(2)], hits:castRay(v.x,v.y,allHittables()).length, tl:RUN.timeLeft};
  // rifle splash
  S.party.weapon='rifle'; buildGun(D.weapon()); const a=spawnPinata('donkey',{position:new THREE.Vector3(-1,2.4,-7), stringLen:0.4}); const bb=spawnPinata('donkey',{position:new THREE.Vector3(0.2,2.4,-7), stringLen:0.4}); scene.updateMatrixWorld(true); const v2=a.worldPos().clone().project(camera); aim.x=v2.x; aim.y=v2.y; RUN.lastShotT=-99; RUN.mag=4; shoot(3); o.rifle={aAlive:a.alive, bAlive:bb.alive, bDmg:bb.damage};
  // cannon projectile
  S.party.weapon='cannon'; buildGun(D.weapon()); const c=spawnPinata('donkey',{position:new THREE.Vector3(0,2.4,-9), stringLen:0.4}); scene.updateMatrixWorld(true); const v3=c.worldPos().clone().project(camera); aim.x=v3.x; aim.y=v3.y+0.02; RUN.lastShotT=-99; RUN.mag=3; shoot(4); o.proj={inFlight:PROJ.length}; for(let i=0;i<120;i++){ updateProjectiles(0.016, 4+i*0.016); if(!PROJ.length) break; } o.proj.after=PROJ.length; o.proj.cAlive=c.alive;
  // repeater auto + ramp
  S.party.weapon='pistol'; buildGun(D.weapon()); RUN.mag=18; RUN.holdT=0; aim.firing=true; RUN.lastShotT=-99; RUN.heat=0; let shots=RUN.shots; for(let i=0;i<60;i++){ updateRun(0.033, 10+i*0.033); } o.auto={fired:RUN.shots-shots, holdT:RUN.holdT.toFixed(2), heat:RUN.heat.toFixed(2)}; aim.firing=false;
  // luchador + chili exist
  const L=spawnPinata('luchador',{position:new THREE.Vector3(-2,2.6,-5),stringLen:0.4}); const C=spawnPinata('chili',{position:new THREE.Vector3(2,2.6,-5),stringLen:0.4}); C.kick(C.worldPos()); o.chili={heat:C.heatLevel, candy:C.candyBase}; L.kick(L.worldPos()); o.luch={dropped:L.dropped, str:L.stringLen};
  return o;});
console.log(JSON.stringify(r));
await page.evaluate(()=>{ S.party.weapon='shotgun'; buildGun(D.weapon()); setReticle(D.weapon()); updateReticle(1,1); RUN.heat=0; clearPinatas(); spawnPinata('spiker',{position:new THREE.Vector3(0,2.6,-5),stringLen:0.4}); spawnPinata('luchador',{position:new THREE.Vector3(-2.2,2.9,-5),stringLen:0.4}); spawnPinata('chili',{position:new THREE.Vector3(2.2,2.6,-5),stringLen:0.4}); look.pitch=0.12; updateTimerHUD(); });
await page.waitForTimeout(200); await page.screenshot({path:'test/v10-run.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
