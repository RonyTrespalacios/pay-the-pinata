const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8780);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8780/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(500);
// tutorial: move step
const t1=await page.evaluate(async()=>{const o={step0:TUT.step, card:document.getElementById('tut').classList.contains('on')}; HUB.pos.set(0,0,3); updateTutorial(0.016,1); HUB.pos.set(0,0,-1); updateTutorial(0.016,1.1); o.step1=TUT.step; return o;});
console.log('tut', JSON.stringify(t1));
await page.screenshot({path:'test/v9-tut1.png'});
// fresh game: only stars hang
const spawn=await page.evaluate(()=>{const ks={}; for(let i=0;i<60;i++){const k=pickKind(); ks[k]=(ks[k]||0)+1;} return ks;});
console.log('pool', JSON.stringify(spawn));
// run: aim step ring, sweet step
const t2=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); startRun({}); await sleep(200); updateTutorial(0.016,2); const o={step:TUT.step, ring:!!TUT.ring&&TUT.ring.visible};
  RUN.sweetHits=1; updateTutorial(0.016,3); o.afterSweet=TUT.step; o.pulse=document.getElementById('timer-wrap').classList.contains('tut-pulse'); RUN.streak=3; updateTutorial(4,4); o.afterStreak=TUT.step;
  RUN.timeLeft=0.001; RUN.encoreUsed=true; for(let i=0;i<80;i++){ updateRun(0.016, 5+i*0.016); if(!RUN.active) break; } await sleep(100); closeRunOver(); setPaused(false); updateTutorial(0.016,7); o.afterRun=TUT.step; o.trail=!!TUT.trail; updateTutorial(0.016,7.1); o.trailKids=TUT.trail&&TUT.trail.children.length;
  return o;});
console.log('tut2', JSON.stringify(t2));
await page.evaluate(()=>{ look.yaw=-0.6; camera.rotation.set(0.1,-0.6,0,'YXZ'); updateTutorial(0.016,8); });
await page.screenshot({path:'test/v9-trail.png'});
// pause menu
const pz=await page.evaluate(async()=>{ setPaused(true); const o={on:document.getElementById('pause').classList.contains('on'), toYard:document.getElementById('btn-to-yard').hidden, resume:document.getElementById('btn-resume').textContent}; document.getElementById('btn-settings').click(); o.settings=!document.getElementById('settings').hidden; document.getElementById('set-sens').value='1.6'; document.getElementById('set-sens').dispatchEvent(new Event('input')); o.sens=S.perm.sens; return o;});
console.log('pause', JSON.stringify(pz));
await page.screenshot({path:'test/v9-pause.png'});
// prestige: weapons wipe + keepsake minting + charms
const pr=await page.evaluate(async()=>{ setPaused(false); S.perm.weaponsUnlocked=['pea','six','rifle']; S.party.tabsPaid=7; S.party.nodes.p_donkey=2; S.party.wup={six:{cadence:3}}; const ks=S.perm.keepsakes; const mint=D.prestigeKeepsakes();
  S.perm.charms={oldfriend:1, headstart:2, guestbook:2, necklace:3}; partysOver(); return {mint, ks:S.perm.keepsakes-ks, weapons:S.perm.weaponsUnlocked, nodes:S.party.nodes, candy:S.party.candy, wup:S.party.wup, party:S.perm.party, global:D.globalCandy().toFixed(2), charmCost:D.charmCost(CHARMS[0])};});
console.log('prestige', JSON.stringify(pr));
// return to title from run + wipe confirm exists
const tt=await page.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms)); enterHub(); startRun({}); await sleep(100); RUN.runCandy=77; const c=S.party.candy; setPaused(true); document.getElementById('btn-to-title').click(); await sleep(100); return {mode:HUB.mode, title:document.getElementById('title').classList.contains('on'), banked:S.party.candy-c, wipeHidden:document.getElementById('wipe-confirm').hidden};});
console.log('title', JSON.stringify(tt));
await page.click('#btn-wipe'); await page.waitForTimeout(200); await page.screenshot({path:'test/v9-title.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none');
await b.close();server.close();})();
