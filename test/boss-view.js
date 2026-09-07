const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8792);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});const page=await b.newPage({viewport:{width:1600,height:900}});
const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8792/');await page.waitForTimeout(1200);
await page.evaluate(()=>{pointerLockSupported=false;}); await page.click('#btn-start');await page.waitForTimeout(500);
const info=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); tutSkip(); setPaused(false);
  // force to tier 2 boss
  S.party.candy=999999; S.party.tabsPaid=3; S.party.bossDue=2; S.party.centerpieceBroken=false;
  startRun({}); await sleep(600);
  const o={boss:!!RUN.boss};
  if(RUN.boss){ const wp=RUN.boss.worldPos(); o.bossWorld={x:+wp.x.toFixed(2),y:+wp.y.toFixed(2),z:+wp.z.toFixed(2)};
    // project to screen
    const v=wp.clone().project(camera); o.screen={x:+((v.x*0.5+0.5)*1600).toFixed(0), y:+((-v.y*0.5+0.5)*900).toFixed(0), inFront:v.z<1}; }
  o.camY=+camera.position.y.toFixed(2); o.pitch=+look.pitch.toFixed(2);
  return o;});
console.log(JSON.stringify(info,null,1));
await page.screenshot({path:'test/boss-view.png'});
console.log('ERR:',errs.length?errs.join('|'):'none');
await b.close();server.close();})();
