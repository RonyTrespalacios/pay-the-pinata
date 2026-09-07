const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8770);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const page=await b.newPage({viewport:{width:1400,height:860}});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8770/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;});await page.click('#btn-start');await page.waitForTimeout(300);
await page.evaluate(()=>{S.party.tabsPaid=7;startRun({});clearPinatas();const slots=HANG.filter(h=>h.line===0);['skull','glass','nest','bull','star'].forEach((k,i)=>spawnPinata(k,{slot:slots[i]}));look.tPitch=0.2;look.pitch=0.2;});
await page.waitForTimeout(1500);await page.screenshot({path:'test/p1-pinatas.png'});
await page.evaluate(()=>{clearPinatas();const slots=HANG.filter(h=>h.line===0);['donkey','burro','golden','repo','nestlet'].forEach((k,i)=>spawnPinata(k,{slot:slots[i]}));});
await page.waitForTimeout(1200);await page.screenshot({path:'test/p2-pinatas.png'});
for (const w of ['six','shotgun','rifle']) { await page.evaluate((w)=>{S.party.weapon=w;buildGun(D.weapon());},w); await page.waitForTimeout(400); await page.screenshot({path:`test/p3-${w}.png`, clip:{x:800,y:460,width:600,height:400}}); }
await page.evaluate(()=>{RUN.mag=0;afterShot();});await page.waitForTimeout(2200);
await page.evaluate(()=>{S.party.candy=2500;HUB.pos.set(-3.5,0,-1.2);});await page.waitForTimeout(900);await page.keyboard.press('KeyE');await page.waitForTimeout(500);await page.screenshot({path:'test/p4-tree.png'});
await b.close();server.close();})();
