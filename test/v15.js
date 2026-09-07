const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const http=require('http');
const three = fs.readFileSync(path.join(__dirname,'..','node_modules/three/build/three.min.js'));
const server = http.createServer((q,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'..','dist/index.html')));}).listen(8789);
const EN=/\b(Weapons|Damage|reload|shots|Buy|Equip|Locked|Owned|Nodes owned|affordable|Streak|Best|Runs|Candy earned|Tabs paid|Pay|Due in|Pays back|counts toward|OVERDUE|Grace Period|Next Tab|Note from the Backer|The one decision|recap|Sweet Hits|Banked|Spillover|The Cut took|branch|rank|Buy for|Need|more Candy|Maxed|not invited|at the party|Achievement|is over|Throw Party|Best Run|Never overdue|Bosses beaten|Keepsakes minted|This Party|All time|Piñatas broken|Nodes owned|Old Friend|Weapon Coupon|Sugar Jar)\b/;
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});const page=await b.newPage({viewport:{width:1600,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR '+e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('**/three.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:three}));
await page.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await page.goto('http://localhost:8789/');await page.waitForTimeout(1200);
await page.evaluate(()=>{ setLang('es'); pointerLockSupported=false; });await page.click('#btn-start');await page.waitForTimeout(500);
async function panelText(kind, setup){ if(setup) await page.evaluate(setup); return await page.evaluate((kind)=>{ if(PANEL.kind) closePanel(); setPaused(false); openPanel(kind); return document.getElementById('panel-body').innerText; }, kind); }
const checks={};
checks.mailbox = await panelText('mailbox');
checks.weapons = await panelText('weapons','()=>{ S.party.tabsPaid=9; S.perm.weaponsUnlocked=WEAPONS.map(w=>w.id); S.party.candy=99999; S.party.wup={}; }');
checks.charms = await panelText('charms','()=>{ S.perm.keepsakes=20; }');
checks.partyover = await panelText('partyover');
checks.records = await panelText('records','()=>{ unlockAchievement("golden"); }');
await page.evaluate(()=>{ closePanel(); setPaused(false); S.party.candy=99999; openPanel("tree"); }); await page.waitForTimeout(300);
checks.tree = await page.evaluate(()=>{ selectNode(NODE_BY_ID.damage); return document.getElementById("panel-body").innerText + ' || ' + (document.getElementById("node-card")?document.getElementById("node-card").innerText:''); });
// runover in ES
await page.evaluate(async()=>{ closePanel(); setPaused(false); tutSkip(); S.party.tabsPaid=6; startRun({}); await new Promise(r=>setTimeout(r,150)); RUN.runCandy=800; RUN.bestStreak=12; RUN.breaks=15; RUN.timeLeft=0.001; RUN.encoreUsed=true; for(let i=0;i<80;i++){updateRun(0.016,10+i*0.016); if(!RUN.active)break;} }); await page.waitForTimeout(300);
checks.runover = await page.evaluate(()=>document.getElementById('runover').innerText);
for(const k in checks){ const hit=checks[k].split('\n').filter(l=>EN.test(l)); console.log('['+k+'] EN-suspect lines:', hit.length?JSON.stringify(hit.slice(0,6)):'none'); }
await page.evaluate(()=>{ closeRunOver(); setPaused(false); S.party.candy=99999; openPanel('tree'); }); await page.waitForTimeout(400); await page.screenshot({path:'test/v15-tree-es.png'});
await page.evaluate(()=>{ closePanel(); setPaused(false); openPanel('weapons'); }); await page.waitForTimeout(300); await page.screenshot({path:'test/v15-weapons-es.png'});
await page.evaluate(()=>{ closePanel(); setPaused(false); openPanel('mailbox'); }); await page.waitForTimeout(300); await page.screenshot({path:'test/v15-mailbox-es.png'});
console.log('ERRORS:',errors.length?errors.join('\n'):'none'); await b.close();server.close();})();
