// Hub flow smoke test + screenshots.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const three = fs.readFileSync(path.join(__dirname, '..', 'node_modules/three/build/three.min.js'));
const server = http.createServer((q, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(fs.readFileSync(path.join(__dirname, '..', 'dist/index.html'))); }).listen(8769);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errors = []; page.on('pageerror', e => errors.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route('**/three.min.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: three }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto('http://localhost:8769/'); await page.waitForTimeout(1500);
  if (errors.length) console.log('BOOT:', errors.join('\n'));
  await page.evaluate(() => { pointerLockSupported=false; });
  await page.click('#btn-start'); await page.waitForTimeout(800);
  await page.screenshot({ path: 'test/h1-hub.png' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // look toward the mailbox and walk there with W
  const r1 = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const st = stationById.mailbox; const dx = st.pos.x - HUB.pos.x, dz = st.pos.z - HUB.pos.z; look.tYaw = Math.atan2(-dx, -dz); look.yaw = look.tYaw;
    HUB.keys.KeyW = true; await sleep(700); HUB.keys.KeyW = false; const walked = HUB.pos.toArray().map(v => v.toFixed(2)); HUB.pos.set(2.2, 0, 1.6); await sleep(900);
    return { walked, pos: HUB.pos.toArray().map(v => v.toFixed(2)), near: HUB.near && HUB.near.id, prompt: document.getElementById('prompt').textContent, objective: document.getElementById('objective').textContent };
  });
  console.log('walk:', JSON.stringify(r1));
  await page.screenshot({ path: 'test/h2-nearmailbox.png' });
  await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
  await page.screenshot({ path: 'test/h3-mailbox.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // tree panel
  await page.evaluate(() => { S.party.candy = 900; S.party.runCount = 3; refreshHub(); HUB.pos.set(-3.5, 0, -1.2); });
  await page.waitForTimeout(900); await page.keyboard.press("KeyE"); await page.waitForTimeout(400);
  await page.screenshot({ path: 'test/h4-tree.png' });
  await page.click('g.node[data-node="sweet_refund"]', { force: true }); await page.waitForTimeout(200);
  await page.screenshot({ path: 'test/h5-tree-node.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // weapons + charms panels
  await page.evaluate(() => { HUB.pos.set(4.8, 0, -1.5); }); await page.waitForTimeout(900); await page.keyboard.press("KeyE"); await page.waitForTimeout(300); await page.screenshot({ path: 'test/h6-weapons.png' }); await page.keyboard.press('Escape');
  // start a run from the firing line
  const r2 = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    HUB.pos.set(0, 0, 2.6); await sleep(900); interact(); await sleep(600);
    const out = { mode: HUB.mode, active: RUN.active, mag: RUN.mag, cam: camera.position.toArray().map(v => v.toFixed(2)) };
    for (let i = 0; i < 30 && RUN.active; i++) { const P = pinatas.find(p => p.alive && p.open && p.sweetMeshes.length); if (!P) { await sleep(200); continue; } const v = new THREE.Vector3(); P.sweetMeshes[0].getWorldPosition(v); v.project(camera); aim.x = v.x; aim.y = v.y; if (i % 4 === 3) aim.x += 0.5; shoot(RUN.timeInRun); await sleep(300); }
    out.shots = RUN.shots; out.candy = Math.floor(RUN.runCandy);
    return out;
  });
  console.log('run:', JSON.stringify(r2));
  await page.screenshot({ path: 'test/h7-run.png' });
  await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); aim.x = 0; aim.y = 0.98; for (let i = 0; i < 40 && RUN.active; i++) { shoot(RUN.timeInRun); await sleep(300); } });
  await page.waitForTimeout(2000);
  const r3 = await page.evaluate(() => ({ mode: HUB.mode, candy: S.party.candy, recapHidden: document.getElementById('recap-card').hidden, tabs: S.party.tabs.map(t => t.guest + ':' + t.dueLeft), objective: document.getElementById('objective').textContent }));
  console.log('after run:', JSON.stringify(r3));
  await page.screenshot({ path: 'test/h8-afterrun.png' });
  // overdue → Tía Chelo collects
  await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); S.party.tabs.forEach(t => t.dueLeft = 0); refreshHub(); look.tYaw = 1.1; look.yaw = 1.1; await sleep(2500); });
  await page.screenshot({ path: 'test/h9-chelo.png' });
  const r4 = await page.evaluate(() => ({ state: BACKER.state, pos: BACKER.group.position.toArray().map(v => v.toFixed(1)), sign: stationById.mailbox.signKey }));
  console.log('chelo:', JSON.stringify(r4));
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await b.close(); server.close();
})();
