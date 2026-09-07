const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8790);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});const page=await b.newPage({viewport:{width:1600,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8790/');await page.waitForTimeout(1200);
await page.evaluate(()=>{ setLang('es'); pointerLockSupported=false; });
await page.click('#btn-start');await page.waitForTimeout(600);
// go to firing line region, refresh signs, capture backyard for tree sign
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o={};
  tutSkip(); setPaused(false);
  // recap card: fake a lastRun and show it
  S.party.lastRun={banked:1234,sweetHits:8,shots:12,bestStreak:9,crits:3,taken:200};
  S.party.tabsArrivedThisRun=[{guest:'Cousin Beto',amount:1800,dueLeft:3}];
  S.party.tabs=[{id:1,guest:'Aunt Rosa',favor:'mag',favorText:'',amount:500,tier:1,dueLeft:2,arrivedRun:0}];
  showRecapCard(); await sleep(150);
  o.recap=document.getElementById('recap-card').innerText;
  // debt banner
  S.party.tabs[0].dueLeft=-1; refreshHub(); updateHubHUD(); if(typeof updateBacker==='function')updateBacker(0.016);
  o.debt=(document.getElementById('debt-banner')||{}).innerText||'';
  // objective + signs
  o.objective=document.getElementById('objective').innerText;
  return o;});
console.log('RECAP:\n'+r.recap);
console.log('\nOBJECTIVE:',r.objective);
console.log('DEBT:',r.debt);
// face the tree to capture the chalkboard sign
await page.evaluate(()=>{ HUB.pos.set(-4.2,0,0.2); HUB.yaw=Math.atan2(stationById.tree.pos.x-HUB.pos.x, stationById.tree.pos.z-HUB.pos.z); updateHub(0.016,2); });
await page.waitForTimeout(300);
await page.screenshot({path:'test/v16-tree-sign-es.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none'); await b.close();server.close();})();
