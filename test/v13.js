const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8787);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});const page=await b.newPage({viewport:{width:1600,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8787/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(600);
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={}; o.music={on:MUSIC.on, step:MUSIC.step>0, gain:MUSIC.gain&&MUSIC.gain.gain.value.toFixed(3)};
  // tutorial move → run jump
  o.tut0=TUT.step; startRun({}); await sleep(200); updateTutorial(0.016,1); o.tutRun=TUT.step; o.musicMode=MUSIC.mode; o.canSign=PRACTICE.sign.visible;
  // tab progress HUD
  RUN.runCandy=120; S.party.candy=200; updateHUD(); o.tp={on:document.getElementById('tab-progress').classList.contains('on'), num:document.getElementById('tp-num').textContent, bank:document.getElementById('tp-bank').style.width, run:document.getElementById('tp-run').style.width};
  // manual reload
  RUN.mag=3; RUN.reloading=false; manualReload(); o.reload={reloading:RUN.reloading, t:RUN.reloadT.toFixed(2)};
  // streak banner
  RUN.streak=5; streakMilestone(1); o.banner=document.getElementById('event-banner').textContent;
  // low time vignette
  RUN.timeLeft=5; updateTimerHUD(); o.low=document.body.classList.contains('lowtime');
  // wheel switch
  S.perm.weaponsUnlocked=['pea','six','shotgun']; S.party.weapon='pea'; canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:100})); o.wheel1=S.party.weapon; canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:-100})); canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:-100})); o.wheel2=S.party.weapon;
  // run over with records
  tutSkip(); RUN.runCandy=777; RUN.bestStreak=9; RUN.breaks=20; RUN.timeLeft=0.001; RUN.encoreUsed=true; for(let i=0;i<80;i++){ updateRun(0.016, 5+i*0.016); if(!RUN.active) break; } await sleep(1900);
  o.ro={records:document.querySelector('.ro-records').textContent, bank:document.querySelector('.ro-bank').textContent.trim(), confetti:document.querySelectorAll('.ro-confetti i').length, again:!document.getElementById('btn-runover-again').hidden, rec:S.perm.records};
  return o;});
console.log(JSON.stringify(r,null,1));
await page.screenshot({path:'test/v13-runover.png'});
await page.evaluate(async()=>{ document.getElementById('btn-runover-again').click(); }); await page.waitForTimeout(400);
const r2=await page.evaluate(()=>({mode:HUB.mode, active:RUN.active, run:S.party.runCount})); console.log(JSON.stringify(r2));
await page.evaluate(()=>{ RUN.runCandy=61; S.party.candy=380; updateHUD(); RUN.timeLeft=6; updateTimerHUD(); }); await page.waitForTimeout(200); await page.screenshot({path:'test/v13-run.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none'); await b.close();server.close();})();
