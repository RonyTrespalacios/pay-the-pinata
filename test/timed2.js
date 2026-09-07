const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8774);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8774/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  S.party.nodes={vacuum:1}; startRun({}); await sleep(300);
  // simulate reload: empty the mag by misses via direct calls
  RUN.mag=1; aim.x=0; aim.y=0.98; RUN.lastShotT=-99; shoot(RUN.timeInRun);
  const o={reloading:RUN.reloading, reloadT:RUN.reloadT};
  // advance sim manually
  for(let i=0;i<120;i++) updateRun(0.016, RUN.timeInRun+0.016);
  o.afterReload={reloading:RUN.reloading, mag:RUN.mag};
  // vacuum: streak 6 with candy on ground
  RUN.streak=6; burst(new THREE.Vector3(0,1,-4),0xff0000,0,20); for(let i=0;i<40;i++) updateRun(0.016, RUN.timeInRun+0.016);
  o.vac={ground:groundCandy.length, particles:particles.filter(p=>p.userData.kind==='tohost').length};
  // time out
  RUN.timeLeft=0.01; for(let i=0;i<80;i++){ updateRun(0.016, RUN.timeInRun+0.016); if(!RUN.active) break; }
  o.end={active:RUN.active, mode:HUB.mode, last:S.party.lastRun&&S.party.lastRun.duration};
  return o;});
console.log(JSON.stringify(r));
await page.screenshot({path:'test/t3-runover.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
