const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8777);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
// old save migration
await page.addInitScript(()=>{ localStorage.setItem('paythepinata.save.v1', JSON.stringify({perm:{keepsakes:3,charms:{},weaponsUnlocked:['pistol','six'],seenWeapons:['pistol','six'],party:1,credits:0,aimMode:'mouse',muted:false,keepsakesEver:3},party:{candy:5000,tabs:[],tabsPaid:4,nodes:{mag_cap:2},favors:{},runCount:5,weapon:'pistol',nextTabId:3,guestCursor:2}})); });
await page.goto('http://localhost:8777/');await page.waitForTimeout(1200);
const mig=await page.evaluate(()=>({unlocked:S.perm.weaponsUnlocked, weapon:S.party.weapon, v:S.perm.v, aim:S.perm.aimMode}));
console.log('migration', JSON.stringify(mig));
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={};
  // node cost inflation
  o.cost0=D.nodeCost(NODE_BY_ID.damage,0); S.party.nodes.candy_A=5; o.costInflated=D.nodeCost(NODE_BY_ID.damage,0); S.party.nodes.candy_A=0;
  // weapon upgrade purchase
  const six=WEAPONS[1]; const u0=D.wupTracks(six)[0]; o.wupCost=D.wupCost(six, u0); const rl0=D.reloadTime(six); buyWup(six, u0); o.cadence={before:rl0.toFixed(3), after:D.reloadTime(six).toFixed(3), rank:D.wup(six,u0.id)};
  // equip in hub via key
  equipWeapon(2); o.equipped=S.party.weapon; o.bar=document.querySelectorAll('#weapon-bar .ws').length; o.barSel=document.querySelector('#weapon-bar .ws.sel span').textContent;
  // porch reach
  HUB.pos.set(6.6,0,-0.1); resolveCollisions(HUB.pos); updateHub(0.016, 1); o.porch={x:HUB.pos.x.toFixed(2), near:HUB.near&&HUB.near.id, ground:HUB.ground};
  // jump
  HUB.pos.set(0,0,3); HUB.y=0; HUB.vy=0; jump(); for(let i=0;i<10;i++) updateHub(0.05, 2+i*0.05); o.jumpY=HUB.y.toFixed(2); for(let i=0;i<30;i++) updateHub(0.05, 3+i*0.05); o.landed=HUB.y;
  // practice cans: aim at a can
  const can=PRACTICE.cans[2]; const wp=can.getWorldPosition(new THREE.Vector3()); HUB.pos.set(wp.x-3, 0, wp.z+3); updateHub(0.016,5); camera.position.set(HUB.pos.x, 1.6, HUB.pos.z); camera.lookAt(wp); camera.updateMatrixWorld(true);
  practiceShoot(10); o.can={flying:!!can.userData.flying}; for(let i=0;i<40;i++) updatePractice(0.05, 11+i*0.05); o.canReset=!can.userData.flying && can.position.distanceTo(can.userData.home)<0.01;
  return o;});
console.log(JSON.stringify(r));
await page.screenshot({path:'test/v8-hub.png'});
const r2=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={}; S.party.tabsPaid=9; clearPinatas(); startRun({}); await sleep(200); clearPinatas();
  // pea range
  S.party.weapon='pea'; buildGun(D.weapon()); const far=spawnPinata('donkey',{position:new THREE.Vector3(0,2.5,-18), stringLen:0.5}); const v=far.worldPos().clone().project(camera); aim.x=v.x; aim.y=v.y; RUN.lastShotT=-99; RUN.mag=8; const st=RUN.streak; shoot(1); o.pea={alive:far.alive, misses:RUN.missCount};
  // armored: 3 sweet hits
  const A=spawnPinata('armored',{position:new THREE.Vector3(0,2.5,-6), stringLen:0.5}); const h=()=>({part:'sweet',point:A.worldPos().clone(),dist:0,object:null});
  const r1=applyHit(A,h(),WEAPONS[1],2); const r2=applyHit(A,h(),WEAPONS[1],3); const r3=applyHit(A,h(),WEAPONS[1],4); o.armored={r1,r2,r3,alive:A.alive};
  // glitter
  const G=spawnPinata('glitter',{position:new THREE.Vector3(1,2.5,-6), stringLen:0.5}); RUN.streak=5; const rg=applyHit(G,{part:'body',point:G.worldPos().clone(),dist:0,object:null},WEAPONS[1],5); o.glitter={rg, streak:RUN.streak, flash:document.getElementById('glitter').classList.contains('on')};
  // cluster
  const C=spawnPinata('cluster',{position:new THREE.Vector3(-1,2.5,-6), stringLen:0.5}); const n0=pinatas.length; applyHit(C,{part:'sweet',point:C.worldPos().clone(),dist:0,object:null},WEAPONS[1],6); o.cluster={minis:pinatas.filter(p=>p.kindId==='mini').length}; for(let i=0;i<60;i++) pinatas.forEach(p=>p.update(0.05, 7+i*0.05)); o.minisAfter=pinatas.filter(p=>p.kindId==='mini').length;
  // comet
  const K=spawnComet(); const tl=RUN.timeLeft; K.update(0.1, 8); applyHit(K,{part:'sweet',point:K.worldPos().clone(),dist:0,object:null},WEAPONS[1],9); o.comet={timeGain:(RUN.timeLeft-tl).toFixed(1), candy:RUN.runCandy};
  return o;});
console.log(JSON.stringify(r2));
await page.evaluate(async()=>{clearPinatas(); const A=spawnPinata('armored',{position:new THREE.Vector3(-1.2,2.6,-5), stringLen:0.4}); const G=spawnPinata('glitter',{position:new THREE.Vector3(1.4,2.6,-5), stringLen:0.4}); spawnPinata('cluster',{position:new THREE.Vector3(0,2.9,-8), stringLen:0.5}); const K=spawnComet(); K.pivot.position.set(3,2.6,-6.5); K.gallopSpeed=0; K.update(0.016,1); S.party.weapon='pea'; buildGun(D.weapon()); look.pitch=0.1;});
await page.waitForTimeout(300); await page.screenshot({path:'test/v8-kinds.png'});
await page.evaluate(async()=>{ RUN.active=false; enterHub(); setPaused(false); S.party.runCount=3; S.party.candy=20000; refreshHub(); HUB.pos.set(4.8,0,-1.5); await new Promise(r=>setTimeout(r,900)); interact();});
await page.waitForTimeout(400); await page.screenshot({path:'test/v8-weapons.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
