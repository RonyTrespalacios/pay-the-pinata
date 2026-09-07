const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8771);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8771/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(900);
await page.evaluate(()=>{look.tYaw=0.9;look.yaw=0.9;});await page.waitForTimeout(600);
await page.screenshot({path:'test/k1-hub-rings.png'});
// gating: tree locked before run 1
const g1=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));HUB.pos.set(-3.5,0,-1.2);await sleep(900);interact();await sleep(200);return {mode:HUB.mode,prompt:document.getElementById('prompt').innerText,lock:stationLocked(stationById.tree)};});
console.log('gating:',JSON.stringify(g1));
// hold-to-start
const h=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));HUB.pos.set(0,0,2.6);await sleep(900);interact();const afterTap=HUB.mode;holdStart();await sleep(400);const mid=HOLD.t;HOLD.t=5;await sleep(400);return {afterTap,mid:mid>0,mode:HUB.mode};});
console.log('hold:',JSON.stringify(h));
await page.waitForTimeout(500);
// shoot a bit then end run → summary screen
await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<8&&RUN.active;i++){const P=pinatas.find(p=>p.alive&&p.open&&p.sweetMeshes.length);if(!P){await sleep(200);continue;}const v=new THREE.Vector3();P.sweetMeshes[0].getWorldPosition(v);v.project(camera);aim.x=v.x;aim.y=v.y;shoot(RUN.timeInRun);await sleep(300);} RUN.mag=0; RUN.endingAt=RUN.timeInRun+0.01;});
await page.waitForTimeout(2500);
const ro=await page.evaluate(()=>({mode:HUB.mode,on:document.getElementById('runover').classList.contains('on'),title:document.querySelector('.ro-title').textContent}));
console.log('runover:',JSON.stringify(ro));
await page.screenshot({path:'test/k2-runover.png'});
await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
const after=await page.evaluate(()=>({mode:HUB.mode,paused:PAUSE.on,cool:interactCooldownUntil>performance.now()}));
console.log('after close:',JSON.stringify(after));
// weapons panel with buy
await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));setPaused(false);S.party.runCount=2;S.party.candy=800;refreshHub();HUB.pos.set(4.8,0,-1.5);await sleep(900);interact();});
await page.waitForTimeout(400);await page.screenshot({path:'test/k3-weapons.png'});
const buy=await page.evaluate(()=>{document.querySelector('button[data-buy="six"]').click();return {unlocked:S.perm.weaponsUnlocked,candy:S.party.candy,weapon:S.party.weapon};});
console.log('buy:',JSON.stringify(buy));
await page.keyboard.press('Escape');
// charms overflow at small viewport
await page.setViewportSize({width:1100,height:620});
await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));S.perm.keepsakes=20;HUB.pos.set(-4.6,0,-1.6);await sleep(900);interact();});
await page.waitForTimeout(400);await page.screenshot({path:'test/k4-charms.png'});
const ov=await page.evaluate(()=>{const b=document.getElementById('panel-body');return {scroll:b.scrollHeight,client:b.clientHeight,canScroll:b.scrollHeight>b.clientHeight, overflowY:getComputedStyle(b).overflowY};});
console.log('charms overflow:',JSON.stringify(ov));
await page.keyboard.press('Escape');
// Chelo collecting during run: arms + position
await page.setViewportSize({width:1400,height:860});
await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));S.party.tabs.forEach(t=>t.dueLeft=0);HUB.pos.set(0,0,2.6);await sleep(900);startRun({});await sleep(200);BACKER.group.position.copy(CHELO_COLLECT);look.tYaw=0.35;look.yaw=0.35;await sleep(800);});
await page.screenshot({path:'test/k5-chelo-run.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
