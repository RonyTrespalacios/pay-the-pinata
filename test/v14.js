const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8788);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});const page=await b.newPage({viewport:{width:1600,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8788/');await page.waitForTimeout(1200);
// language toggle on the title
const lang=await page.evaluate(()=>{ setLang('es'); return {btn:document.getElementById('btn-start').textContent, pitch:document.querySelector('.pitch').textContent, hop:[...document.querySelectorAll('.controls span')].map(s=>s.textContent).find(t=>t.includes('Saltar'))}; });
console.log('lang', JSON.stringify(lang));
await page.screenshot({path:'test/v14-title-es.png'});
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(600);
await page.screenshot({path:'test/v14-hub-es.png'});
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={}; o.tut=document.querySelector('#tut .t-text').textContent; o.objective=document.getElementById('objective').textContent; o.prompt=(()=>{ HUB.pos.set(3.4,0,1.6); updateHub(0.016,1); return document.getElementById('prompt').textContent; })();
  // first runs fuller
  o.startPinatas=D.startPinatas(); o.spawnInt=D.spawnInterval().toFixed(2); S.party.runCount=5; o.laterStart=D.startPinatas(); S.party.runCount=0;
  // achievements + records
  tutSkip(); const ks=S.perm.keepsakes; o.ach1=unlockAchievement('golden'); o.ach2=unlockAchievement('golden'); o.ksGain=S.perm.keepsakes-ks; o.achToast=document.getElementById('achv').textContent.slice(0,40);
  openPanel('records'); await sleep(200); o.records={achs:document.querySelectorAll('.ach').length, got:document.querySelectorAll('.ach.got').length, title:document.getElementById('panel-title').textContent}; closePanel(); setPaused(false);
  // boss: pay tabs to tier 2
  S.party.candy=99999; const t1=S.party.tabs[0]; payTab(t1); S.party.tabs.push({id:9,guest:'X',favor:'mag',favorText:'',amount:10,tier:1,dueLeft:3,arrivedRun:0}); payTab(S.party.tabs[0]); S.party.tabs.push({id:10,guest:'Y',favor:'mag',favorText:'',amount:10,tier:1,dueLeft:3,arrivedRun:0}); const res=payTab(S.party.tabs[0]); o.boss={due:S.party.bossDue, tier:D.tier(), name:bossName(S.party.bossDue), prompt:stationById.firing.prompt()};
  startRun({}); await sleep(200); o.bossRun={spawned:!!RUN.boss, kind:RUN.boss&&RUN.boss.kindId, layers:RUN.boss&&RUN.boss.layers, banner:document.getElementById('event-banner').textContent, time:RUN.timeLeft.toFixed(0)};
  const B=RUN.boss; const ks2=S.perm.keepsakes; for(let i=0;i<3;i++){ const h={part:'sweet',point:B.worldPos().clone(),dist:0,object:null}; applyHit(B,h,WEAPONS[1],1+i); } o.bossDown={alive:B.alive, due:S.party.bossDue, ks:S.perm.keepsakes-ks2, beaten:S.party.bossesBeaten, ach:!!S.perm.ach.boss};
  // events
  S.party.runCount=4; scheduleEvents(); o.events=RUN.events.map(e=>e.id); RUN.events=[{id:'golden_hour',at:5,announced:false,count:3}]; updateEvents(2.5); o.evBanner=document.getElementById('event-banner').textContent; updateEvents(5.1); o.evFired={golden:RUN.goldenUntil>0, banner:document.getElementById('event-banner').textContent};
  // damage pips
  o.pips=damagePips(1,3);
  // run over + records after, party summary
  RUN.runCandy=555; RUN.timeLeft=0.001; RUN.encoreUsed=true; for(let i=0;i<80;i++){ updateRun(0.016, 10+i*0.016); if(!RUN.active) break; } await sleep(300); o.hist=S.party.history; o.stats=S.perm.stats;
  closeRunOver(); setPaused(false); snapshotParty(3); partysOver(); openPanel('summary'); await sleep(200); o.summary={title:document.querySelector('.sum-title')&&document.querySelector('.sum-title').textContent, chart:!!document.querySelector('.hist'), party:S.perm.party};
  return o;});
console.log(JSON.stringify(r,null,1));
await page.screenshot({path:'test/v14-summary.png'});
await page.evaluate(async()=>{ closePanel(); setPaused(false); S.party.candy=5000; S.party.runCount=3; refreshHub(); openPanel('tree'); await new Promise(r=>setTimeout(r,500)); fitView(true); }); await page.waitForTimeout(300); await page.screenshot({path:'test/v14-tree.png'});
await page.evaluate(async()=>{ closePanel(); setPaused(false); openPanel('charms'); }); await page.waitForTimeout(300); await page.screenshot({path:'test/v14-charms.png'});
await page.evaluate(async()=>{ closePanel(); setPaused(false); HUB.near=stationById.chelo; interact(); }); await page.waitForTimeout(400); await page.screenshot({path:'test/v14-chelo.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none'); await b.close();server.close();})();
