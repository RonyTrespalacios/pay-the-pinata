// Second smoke test: high Tier families, all weapons, Toss, The Cut, Repo, Party's Over, credits.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs'); const http = require('http');
const dist = path.join(__dirname, '..', 'dist');
const three = fs.readFileSync(path.join(__dirname, '..', 'node_modules/three/build/three.min.js'));
const server = http.createServer((req, res) => { const f = path.join(dist, 'index.html'); res.writeHead(200, { 'content-type': 'text/html' }); res.end(fs.readFileSync(f)); }).listen(8766);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route('**/three.min.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: three }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto('http://localhost:8766/'); await page.waitForTimeout(1200);
  await page.click('#btn-start'); await page.waitForTimeout(300);
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(rs => setTimeout(rs, ms));
    const out = {};
    pointerLockSupported=false;
    // Tier 4, all weapons, some nodes, overdue tabs so The Cut applies
    S.party.tabsPaid = 6; S.perm.weaponsUnlocked = ['pistol', 'six', 'shotgun', 'rifle'];
    S.party.nodes = { pierce: 1, damage: 4, punch: 1, sweet_refund: 2, crit_refund: 1, grace: 1, confetti: 1, sugar_hands: 1, double: 1, spill: 2 };
    S.party.tabs.forEach(t => t.dueLeft = 0); S.party.backerTaken = 500;
    for (const wid of ['shotgun', 'rifle', 'six', 'pistol']) {
      S.party.weapon = wid; startRun({ toss: true }); await sleep(500);
      out[wid] = { mag: RUN.mag, kinds: pinatas.map(p => p.kindId) };
      let shots = 0;
      for (let i = 0; i < 25 && RUN.active; i++) {
        const P = pinatas.find(p => p.alive && p.open && p.sweetMeshes.length && p.kindId !== 'centerpiece') || pinatas.find(p => p.alive && p.parts.length);
        if (!P) { await sleep(200); continue; }
        const m = (P.open && P.sweetMeshes[0]) || P.parts[0];
        const v = new THREE.Vector3(); m.getWorldPosition(v); v.project(camera); aim.x = v.x; aim.y = v.y;
        if (i === 3) confettiBurst(RUN.timeInRun);
        const before = RUN.mag; shoot(RUN.timeInRun); if (RUN.mag !== before || RUN.shots > shots) shots = RUN.shots; await sleep(320);
      }
      out[wid].after = { shots: RUN.shots, sweet: RUN.sweetHits, crits: RUN.crits, candy: Math.floor(RUN.runCandy), taken: RUN.taken, mag: RUN.mag, cut: D.cutPct(), kindsNow: pinatas.map(p => p.kindId) };
      // drain
      aim.x = 0; aim.y = 0.98; for (let i = 0; i < 12 && RUN.active; i++) { shoot(RUN.timeInRun); await sleep(300); } RUN.mag = 0; RUN.endingAt = RUN.timeInRun + 0.01;
      await sleep(1500);
      out[wid].ended = !RUN.active && HUB.mode === 'hub';
      out[wid].lastRun = S.party.lastRun;
    }
    out.tossSeen = out.tossSeen || Object.values(out).some(o => o.kindsNow && o.kindsNow.includes('toss')) || Object.values(out).some(o => o.after && o.after.kindsNow.includes('toss'));
    // double or nothing button present?
    openPanel('mailbox'); out.donBtn = !!document.getElementById('btn-don'); closePanel();
    // party's over
    const keepBefore = S.perm.keepsakes; partysOver(); arriveTabsIfDue(); refreshHub();
    out.afterPO = { party: S.perm.party, tier: D.tier(), candy: S.party.candy, tabs: S.party.tabs.map(t => t.guest + ':' + t.amount), weapons: S.perm.weaponsUnlocked.length, keep: S.perm.keepsakes === keepBefore };
    // buy a charm with cheated keepsakes and check the crown
    S.perm.keepsakes = 30; buyCharm(CHARMS[4]); buyCharm(CHARMS[0]); partysOver(); arriveTabsIfDue();
    out.crown = { tabs: S.party.tabs.length, tabsPaid: S.party.tabsPaid, mag: D.magCapacity(), note: S.party.crownNote };
    // cleanup tab + credits path
    S.party.centerpieceBroken = true; S.party.centerpieceCandy = 5000; S.party.tabs = []; arriveTabsIfDue();
    out.cleanup = S.party.tabs.map(t => t.guest + ':' + t.amount);
    S.party.candy = 99999; openPanel('mailbox'); document.querySelector('.pay-btn').click(); await sleep(100);
    out.credits = (document.querySelector('.screen.on') || {}).id;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await page.screenshot({ path: 'test/08-credits.png' });
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close(); server.close();
})();
