const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8784);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8784/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
const r=await page.evaluate(async()=>{ const o={}; tutSkip(); setPaused(false); const p=S.party;
  o.startTabs=p.tabs.length; o.max=D.tabsOpenMax();
  // starter-only slots
  clearPinatas(); const lines={}; for(let i=0;i<40;i++){ const P=spawnHanging(); if(!P) break; lines[P.slot.line+':'+Math.abs(P.slot.x)]=1; } o.starterSlots=Object.keys(lines).sort(); clearPinatas();
  S.perm.weaponsUnlocked=['pea','six']; const lines2={}; for(let i=0;i<40;i++){ const P=spawnHanging(); if(!P) break; lines2[P.slot.line]=1; } o.anySlots=Object.keys(lines2); clearPinatas(); S.perm.weaponsUnlocked=['pea'];
  // pay the first tab early (run 1) → grace until run 3
  p.candy=5000; p.runCount=1; const tab=p.tabs[0]; o.tabArrived=tab.arrivedRun; o.due=tab.dueLeft; payTab(tab); o.nextTabRun=p.nextTabRun; arriveTabsIfDue(); o.tabsAfterPay=p.tabs.length; o.grace=D.graceRuns();
  p.runCount=2; arriveTabsIfDue(); o.tabsRun2=p.tabs.length; p.runCount=3; arriveTabsIfDue(); o.tabsRun3=p.tabs.length; o.newArrived=p.tabs[0]&&p.tabs[0].arrivedRun;
  // tier 3 → 2 tabs
  p.tabsPaid=6; p.runCount=10; p.nextTabRun=0; arriveTabsIfDue(); o.tier3={max:D.tabsOpenMax(), tabs:p.tabs.length};
  // spiker fuse swap
  p.tabsPaid=0; startRun({}); await new Promise(r=>setTimeout(r,200)); clearPinatas(); const sp=spawnHanging('spiker'); const slot=sp.slot; o.fuse=sp.fuse.toFixed(2); for(let i=0;i<60;i++) pinatas.slice().forEach(P=>P.update(0.05, i*0.05)); o.afterFuse={spikerAlive:sp.alive, slotTaken:!!slot.taken, newKind:slot.taken&&slot.taken.kindId, timeLeft:RUN.timeLeft.toFixed(1), penalty:RUN.penalty};
  return o;});
console.log(JSON.stringify(r,null,1));
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
