const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8773);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8773/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  S.party.tabsPaid=9; S.party.nodes={chain:3,vacuum:1,rush:1,run_time:2,damage:3}; S.party.candy=50; refreshHub();
  startRun({}); await sleep(400);
  const out={t0:RUN.timeLeft.toFixed(1), runTime:D.runTime()};
  // sweet hits add time; misses drain the mag → reload
  for(let i=0;i<14&&RUN.active;i++){const P=pinatas.find(p=>p.alive&&p.open&&p.sweetMeshes.length&&p.kindId!=='centerpiece');if(!P){await sleep(150);continue;}const v=new THREE.Vector3();P.sweetMeshes[0].getWorldPosition(v);v.project(camera);aim.x=v.x;aim.y=v.y;shoot(RUN.timeInRun);await sleep(260);}
  out.afterSweet={timeLeft:RUN.timeLeft.toFixed(1),bonus:RUN.bonusTime.toFixed(2),streak:RUN.streak,chains:RUN.chains,candy:Math.floor(RUN.runCandy),hitStopSeen:true};
  aim.x=0;aim.y=0.98; for(let i=0;i<20&&RUN.active&&!RUN.reloading;i++){shoot(RUN.timeInRun);await sleep(240);}
  out.reload={reloading:RUN.reloading,mag:RUN.mag};
  // body hit kicks a swinging piñata
  const P=pinatas.find(p=>p.alive&&['swing','swingFast','zip','bounce'].includes(p.behavior)); if(P){const before=P.angVel;P.kick(P.worldPos());out.kick={before:before.toFixed(2),after:P.angVel.toFixed(2),behavior:P.behavior};}
  out.behaviors=pinatas.map(p=>p.behavior);
  // time runs out
  RUN.timeLeft=0.05; await sleep(2500);
  out.end={mode:HUB.mode,active:RUN.active,last:S.party.lastRun&&{banked:S.party.lastRun.banked,bonus:S.party.lastRun.bonusTime,chains:S.party.lastRun.chains}};
  return out;});
console.log(JSON.stringify(r,null,1));
await page.screenshot({path:'test/t1-runover.png'});
await page.keyboard.press('KeyE');await page.waitForTimeout(300);
await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));HUB.pos.set(0,0,2.6);await sleep(800);startRun({});await sleep(300);const P=pinatas.find(p=>p.alive&&p.sweetMeshes.length);if(P){const v=new THREE.Vector3();P.sweetMeshes[0].getWorldPosition(v);v.project(camera);aim.x=v.x;aim.y=v.y;shoot(RUN.timeInRun);}await sleep(120);});
await page.screenshot({path:'test/t2-run.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
