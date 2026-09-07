// Headless smoke test: boots the game, plays a Run by aiming at real piñatas, walks the Mailbox.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const http = require('http');
const dist = path.join(__dirname, '..', 'dist');
const three = fs.readFileSync(path.join(__dirname, '..', 'node_modules/three/build/three.min.js'));
const server = http.createServer((req, res) => { const f = path.join(dist, req.url === '/' ? 'index.html' : req.url); fs.existsSync(f) ? (res.writeHead(200, { 'content-type': 'text/html' }), res.end(fs.readFileSync(f))) : (res.writeHead(404), res.end()); }).listen(8765);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.route('**/three.min.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: three }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto('http://localhost:8765/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test/01-title.png' });
  if (errors.length) { console.log('BOOT ERRORS:', errors.join('\n')); }
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test/02-mailbox.png' });
  const tabs = await page.evaluate(() => S.party.tabs.map(t => t.guest + ' ' + t.amount + ' due ' + t.dueLeft));
  console.log('tabs:', tabs);
  // start a run in mouse-aim mode (pointer lock isn't available headless)
  await page.evaluate(() => { pointerLockSupported=false; });
  await page.click('#btn-run');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test/03-run.png' });
  // fire at sweet spots programmatically: project each live piñata's sweet mesh to NDC and shoot
  const log = await page.evaluate(async () => {
    const out = [];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 40 && RUN.active; i++) {
      const P = pinatas.find(p => p.alive && p.open && p.sweetMeshes.length);
      if (!P) { await sleep(300); continue; }
      const v = new THREE.Vector3(); P.sweetMeshes[0].getWorldPosition(v); v.project(camera);
      aim.x = v.x; aim.y = v.y;
      if (i % 5 === 4) aim.x += 0.4; // deliberate miss now and then
      const before = RUN.mag; shoot(RUN.timeInRun);
      out.push(`shot ${i}: ${P.k.name} mag ${before}->${RUN.mag} streak ${RUN.streak} candy ${Math.floor(RUN.runCandy)}`);
      await sleep(260);
    }
    return out;
  });
  console.log(log.join('\n'));
  await page.screenshot({ path: 'test/04-shooting.png' });
  // now drain the Mag with Misses so the Run ends
  await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); aim.x = 0; aim.y = 0.95; for (let i = 0; i < 40 && RUN.active; i++) { shoot(RUN.timeInRun); await sleep(300); } });
  await page.waitForTimeout(2000);
  const state = await page.evaluate(() => ({ active: RUN.active, candy: S.party.candy, last: S.party.lastRun, screen: document.querySelector('.screen.on') && document.querySelector('.screen.on').id }));
  console.log('after run:', JSON.stringify(state));
  await page.screenshot({ path: 'test/05-after.png' });
  // walk mailbox panes
  for (const sheet of ['weapons', 'charms', 'partyover']) { await page.click(`.chips button[data-sheet="${sheet}"]`); await page.waitForTimeout(150); await page.screenshot({ path: `test/06-${sheet}.png` }); await page.click('#sheet-close'); }
  // cheat some candy, buy a node, pay a tab, check tier
  const eco = await page.evaluate(() => {
    S.party.candy += 5000; renderMailbox();
    const n = NODE_BY_ID.mag_cap; const ok = buyNode(n);
    const tab = S.party.tabs[0]; const res = payTab(tab);
    return { bought: ok, magRank: rank('mag_cap'), paid: res, tier: D.tier(), keepsakes: S.perm.keepsakes, tabs: S.party.tabs.length, favors: S.party.favors };
  });
  console.log('eco:', JSON.stringify(eco));
  // force a Centerpiece run + toss
  const cp = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    S.party.tabsPaid = BAL.centerpiece_tabs; S.party.tabs = []; renderMailbox();
    startRun({ toss: true });
    await sleep(600);
    const out = { hasCenterpiece: !!RUN.centerpiece, tier: D.tier(), pinatas: pinatas.map(p => p.kindId) };
    // shoot centerpiece doors
    for (let i = 0; i < 30 && RUN.active && RUN.centerpiece; i++) {
      const P = RUN.centerpiece; const g = P.layerGroups[P.layerIndex]; const door = g.userData.doors[P.doorIndex];
      const v = new THREE.Vector3(); door.getWorldPosition(v); v.project(camera); aim.x = v.x; aim.y = v.y; shoot(RUN.timeInRun); await sleep(250);
    }
    out.centerpieceBroken = S.party.centerpieceBroken; out.mag = RUN.mag; out.runCandy = RUN.runCandy; out.tossKinds = pinatas.filter(p => p.kindId === 'toss').length;
    return out;
  });
  console.log('centerpiece:', JSON.stringify(cp));
  await page.screenshot({ path: 'test/07-centerpiece.png' });
  await page.waitForTimeout(500);
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close(); server.close();
})();
