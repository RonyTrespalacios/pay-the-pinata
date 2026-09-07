const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8786);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1600,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8786/');await page.waitForTimeout(1200);
await page.screenshot({path:'test/a0-title.png'});
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(600);
await page.screenshot({path:'test/a1-hub-first.png'});
// first run: play like a player, shoot what is under crosshair-ish
await page.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms)); HUB.pos.set(0,0,2.2); startRun({}); await sleep(300); });
await page.waitForTimeout(500); await page.screenshot({path:'test/a2-run-start.png'});
const play=await page.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let shots=0, sweets=0; const t0=performance.now();
  while(RUN.active && performance.now()-t0<9000){ const P=pinatas.filter(p=>p.alive&&p.slot).sort((a,b)=>a.worldPos().distanceTo(camera.position)-b.worldPos().distanceTo(camera.position))[0]; if(P){ const m=P.sweetMeshes[0]; const wp=new THREE.Vector3(); m.getWorldPosition(wp); const v=wp.project(camera); if(Math.random()<0.7){ aim.x=v.x; aim.y=v.y; } else { aim.x=v.x+0.05; aim.y=v.y-0.03; } look.tYaw=look.yaw; const before=RUN.sweetHits; shoot(RUN.timeInRun); shots++; if(RUN.sweetHits>before) sweets++; } await sleep(260); }
  return {shots,sweets,candy:RUN.runCandy,timeLeft:RUN.timeLeft.toFixed(1),bonus:RUN.bonusTime.toFixed(2),streak:RUN.bestStreak}; });
console.log('play', JSON.stringify(play));
await page.screenshot({path:'test/a3-run-mid.png'});
await page.evaluate(async()=>{ RUN.timeLeft=0.01; RUN.encoreUsed=true; }); await page.waitForTimeout(1800);
await page.screenshot({path:'test/a4-runover.png'});
await page.evaluate(()=>{ closeRunOver(); setPaused(false); }); await page.waitForTimeout(300); await page.screenshot({path:'test/a5-hub-after.png'});
await page.evaluate(()=>{ openPanel('mailbox'); }); await page.waitForTimeout(300); await page.screenshot({path:'test/a6-mailbox.png'});
await page.evaluate(()=>{ closePanel(); setPaused(false); S.party.candy=900; openPanel('tree'); }); await page.waitForTimeout(500); await page.screenshot({path:'test/a7-tree.png'});
await page.evaluate(()=>{ closePanel(); setPaused(false); S.party.runCount=3; S.perm.keepsakes=5; refreshHub(); openPanel('charms'); }); await page.waitForTimeout(400); await page.screenshot({path:'test/a8-charms.png'});
const st=await page.evaluate(()=>({tabs:S.party.tabs.map(t=>({g:t.guest,a:t.amount,d:t.dueLeft})), candy:S.party.candy, last:S.party.lastRun}));
console.log(JSON.stringify(st));
console.log('ERRORS:',errors.length?errors.join('\n'):'none'); await b.close();server.close();})();
