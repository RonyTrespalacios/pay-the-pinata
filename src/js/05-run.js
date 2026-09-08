// ---------- LOOP 1: THE RUN ----------
const RUN = {
  active: false, mag: 0, halfBank: 0, streak: 0, misses: 0, runCandy: 0, shots: 0, taken: 0,
  breaks: 0, sweetHits: 0, crits: 0, bodyHits: 0, missCount: 0, spillCandy: 0,
  lastSweetT: -99, lastShotT: -99, burstScale: 1, burstUntil: 0, burstReadyAt: 0, sugarHandsUntil: 0,
  toss: false, tossT: 0, spawnT: 0, centerpiece: null, boss: null, bossDown: false, endingAt: 0, timeInRun: 0, doubleOffered: false,
  crowdMult: 1, streakShown: -1, timeLeft: 0, bonusTime: 0, bonusCount: 0, reloading: false, reloadT: 0, reloadDur: 0, arOn: false, arDone: false, arHits: 0, rushUsed: false, rushUntil: 0, vacT: 0, vacCandy: 0, lastTick: 99, chains: 0,
  heat: 0, launcherT: 0, launched: 0, llamas: 0, keepsakesWon: 0, encoreUsed: false, jackpots: 0, holdT: 0, penalty: 0, spikers: 0,
};
const PROJ = [];   // Candy Cannon jawbreakers in flight
const JUICE = { hitStop: 0, shake: 0 };
const $ = id => document.getElementById(id);
const ui = {
  mag: $('mag-num'), pips: $('mag-pips'), weapon: $('weapon-name'), runCandy: $('run-candy'), streakN: $('streak-n'), streakMult: $('streak-mult'),
  cutLine: $('cut-line'), cutPct: $('cut-pct'), party: $('hud-party'), tier: $('hud-tier'), run: $('hud-run'), banner: $('event-banner'),
  floaters: $('floaters'), wild: $('wild-bar'), crosshair: $('crosshair'), hint: $('hint'), toast: $('toast'),
  streakCard: $('streak-card'), refundPct: $('refund-pct'),
};
const raycaster = new THREE.Raycaster();
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _ndc = new THREE.Vector2();
const aim = { x: 0, y: 0, locked: false, mouseMode: false };  // aim point in NDC (0,0 = crosshair centre)

// ---- dynamic crosshair: every weapon aims differently ----
const RET = { t: 0 };
function setReticle(w) { w = w || D.weapon(); ui.crosshair.dataset.reticle = w.reticle || 'dot'; ui.crosshair.classList.remove('lock', 'hot'); ui.crosshair.style.setProperty('--ex', '0px'); const rg = ui.crosshair.querySelector('.range'); if (rg) rg.textContent = ''; }
function updateReticle(dt, t) {
  const w = D.weapon(); const ch = ui.crosshair;
  if (w.reticle === 'circle') { const sp = D.spread(w) * (1 + 0.25 * favor('shotgun')); ch.style.setProperty('--r', Math.round(sp * window.innerWidth) + 'px'); }
  else if (w.reticle === 'expand') { ch.style.setProperty('--ex', Math.round(RUN.heat * 26) + 'px'); ch.classList.toggle('hot', RUN.heat > BAL.heat_soft); }
  RET.t -= dt; if (RET.t > 0) return; RET.t = 0.08;
  if (w.reticle === 'diamond' || w.reticle === 'sniper') {
    const hits = castRay(0, 0, allHittables());
    if (w.reticle === 'diamond') ch.classList.toggle('lock', !!(hits.length && hits[0].object.userData.part === 'sweet'));
    else { const rg = ch.querySelector('.range'); if (rg) rg.textContent = hits.length ? hits[0].distance.toFixed(1) + ' m' + (hits[0].object.userData.pinata && hits[0].object.userData.pinata.moving ? ' ·moving' : '') : ''; }
  }
}
function streakMult() { return Math.min(D.streakCap(), 1 + D.streakStep() * RUN.streak); }

function startRun(opts) {
  opts = opts || {};
  const p = S.party;
  clearPinatas(); clearGroundCandy(); arHide();
  const w = D.weapon(); buildGun(w);
  Object.assign(RUN, { active: true, mag: D.magCapacity(w), halfBank: 0, crowdMult: 1, streak: 0, streakShown: -1, misses: 0, runCandy: 0, shots: 0, taken: 0, breaks: 0, sweetHits: 0, crits: 0, bodyHits: 0, missCount: 0, spillCandy: 0,
    lastSweetT: -99, lastShotT: -99, burstScale: 1, burstUntil: 0, burstReadyAt: 0, sugarHandsUntil: 0, toss: !!opts.toss, tossT: 1.5, spawnT: 0, centerpiece: null, endingAt: 0, timeInRun: 0, doubleOffered: false, repoSpawned: false, bestStreak: 0, timeLeft: D.runTime(), bonusTime: 0, bonusCount: 0, reloading: false, reloadT: 0, reloadDur: 0, arOn: false, arDone: false, arHits: 0, rushUsed: false, rushUntil: 0, vacT: 0, vacCandy: 0, lastTick: 99, chains: 0, heat: 0, launcherT: 3 + Math.random() * 3, launched: 0, llamas: 0, keepsakesWon: 0, encoreUsed: false, jackpots: 0, holdT: 0, penalty: 0, spikers: 0, boss: null, bossDown: false, spikersFizzled: 0, events: [], goldenUntil: 0, stormUntil: 0, eventsFired: 0 });
  scheduleEvents();
  PROJ.forEach(p => scene.remove(p.mesh)); PROJ.length = 0; aim.firing = false; setReticle(w);
  RUN.streak = D.hotStart(); RUN.toss = false;
  JUICE.hitStop = 0; JUICE.shake = 0;
  growBackyard(D.tier());
  const n = D.startPinatas();
  for (let i = 0; i < n; i++) spawnHanging();
  if (D.centerpieceDue()) {
    RUN.centerpiece = spawnPinata('centerpiece', { position: new THREE.Vector3(0, 5.4, -20), stringLen: 0, sweetScale: 2.0 / D.sweetScaleForTier() });
    ui.banner.textContent = T('THE CENTERPIECE'); ui.banner.classList.add('on');
  } else if (p.bossDue && !p.centerpieceBroken) {
    // a Tier boss waits on the middle line: three layers, three doors, a Keepsake inside
    RUN.boss = spawnPinata('boss', { position: new THREE.Vector3(0, 2.0, -9), stringLen: 0, bodyScale: 1.15, sweetScale: 1.5 / D.sweetScaleForTier() });
    RUN.timeLeft += 12; ui.banner.textContent = T('TIER ' + p.bossDue + ' BOSS · ' + bossName(p.bossDue).toUpperCase()); ui.banner.classList.add('on'); SFX.launch();
  } else ui.banner.classList.remove('on');
  // the Host steps up to the firing line and stays there for the whole Run
  HUB.mode = 'run'; HUB.pos.set(FIRING_LINE.x, 0, FIRING_LINE.z); camera.position.copy(FIRING_LINE);
  look.tYaw = 0; look.tPitch = 0.1; look.yaw = 0; look.pitch = 0.1;
  document.body.classList.add('playing'); document.body.classList.remove('menu'); document.body.classList.remove('hub');
  $('prompt').classList.remove('on'); $('recap-card').hidden = true; STATIONS.forEach(st => { if (st.sprite) st.sprite.visible = false; st.ring.visible = st.ringInner.visible = false; }); marker.visible = false;
  showScreen(null); closePanel();
  renderWildBar(); updateHUD();
  ui.hint.textContent = T(aim.mouseMode ? 'Move the mouse to look · click to shoot · 1–6 weapons' : 'Click to capture the mouse · click to shoot · Esc releases');
  tryPointerLock(); updateTimerHUD(); if (typeof setMusicMode === 'function') setMusicMode('run'); if (typeof PRACTICE !== 'undefined' && PRACTICE.sign) PRACTICE.sign.visible = false;
}
// The clock is a bar that drains. Earned time shows as a gold sliver at the tip; a Spiker penalty flashes the bar red and bites a chunk off.
const TBAR = { bonusAt: 0, bonusFrom: 0, bonusTo: 0, penAt: 0, penFrom: 0, penTo: 0 };
function updateTimerHUD() {
  const el = $('timer'); if (!el) return; const tl = Math.max(0, RUN.timeLeft); const max = Math.max(1, D.runTime() + RUN.bonusTime);
  el.textContent = tl.toFixed(2) + ' s';
  const wrap = $('timer-wrap'); wrap.classList.toggle('low', tl < 10); wrap.classList.toggle('rush', RUN.timeInRun < RUN.rushUntil); document.body.classList.toggle('lowtime', RUN.active && tl < 8 && tl > 0);
  const fill = $('timer-fill'); fill.style.width = (100 * tl / max) + '%';
  const now = performance.now() / 1000;
  const bon = $('timer-gain'); const bAge = now - TBAR.bonusAt; if (bAge < 0.9) { bon.style.left = (100 * TBAR.bonusFrom / max) + '%'; bon.style.width = Math.max(0.6, 100 * (TBAR.bonusTo - TBAR.bonusFrom) / max) + '%'; bon.style.opacity = 1 - bAge / 0.9; } else bon.style.opacity = 0;
  const pen = $('timer-pen'); const pAge = now - TBAR.penAt; if (pAge < 0.9) { pen.style.left = (100 * TBAR.penFrom / max) + '%'; pen.style.width = (100 * (TBAR.penTo - TBAR.penFrom) / max) + '%'; pen.style.opacity = 1 - pAge / 0.9; wrap.classList.toggle('penalty', pAge < 0.5); } else { pen.style.opacity = 0; wrap.classList.remove('penalty'); }
}
function addTime(sec, label) {
  const cap = D.runTime() * D.timeBonusCap(); let bonus = sec * Math.pow(BAL.time_decay, RUN.bonusCount);
  bonus = Math.max(0, Math.min(bonus, cap - RUN.bonusTime)); if (bonus <= 0.005) return;
  TBAR.bonusFrom = Math.max(0, RUN.timeLeft); RUN.timeLeft += bonus; RUN.bonusTime += bonus; RUN.bonusCount++; TBAR.bonusTo = RUN.timeLeft; TBAR.bonusAt = performance.now() / 1000;
  const b = $('timer-bonus'); if (b) { b.textContent = '+' + (bonus * 1000).toFixed(0) + ' ms'; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
  beep(1568, 0.05, 'triangle', 0.05); updateTimerHUD();
}
function loseTime(sec) {
  TBAR.penTo = Math.max(0, RUN.timeLeft); RUN.timeLeft = Math.max(0, RUN.timeLeft - sec); TBAR.penFrom = RUN.timeLeft; TBAR.penAt = performance.now() / 1000; RUN.penalty += sec;
  const b = $('timer-bonus'); if (b) { b.textContent = '−' + sec.toFixed(1) + ' s'; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
  SFX.cut(); JUICE.shake = Math.max(JUICE.shake, 0.7);
}

function updateHUD() {
  ui.mag.textContent = RUN.mag; ui.mag.classList.toggle('low', RUN.mag <= 2);
  const cap = D.magCapacity(); let pips = '';
  for (let i = 0; i < Math.min(RUN.mag, 40); i++) pips += `<i class="${i >= cap ? 'extra' : ''}"></i>`;
  ui.pips.innerHTML = pips;
  ui.weapon.textContent = RUN.reloading ? T('RELOADING…') : T(D.weapon().name); ui.mag.classList.toggle('reloading', RUN.reloading);
  const hw = $('heat-wrap'); if (hw) { const w = D.weapon(); hw.hidden = !w.heat; if (w.heat) { const bar = $('heat-bar'); bar.style.width = Math.min(100, RUN.heat * 100) + '%'; bar.classList.toggle('hot', RUN.heat > BAL.heat_soft); } }
  ui.runCandy.textContent = Math.floor(RUN.runCandy).toLocaleString();
  // La racha, al estilo osu: aparece a partir de 1, calienta a 5 y arde a 10, y el numero pega
  // un bote cada vez que sube. Es lo unico del HUD que se mira sin querer, asi que se gana el sitio.
  ui.streakN.textContent = RUN.streak; ui.streakMult.textContent = streakMult().toFixed(2);
  const sc = ui.streakCard;
  sc.classList.toggle('on', RUN.streak > 0);
  sc.classList.toggle('hot', RUN.streak >= 5);
  sc.classList.toggle('blaze', RUN.streak >= 10);
  if (RUN.streak !== RUN.streakShown) { RUN.streakShown = RUN.streak; if (RUN.streak > 0) { sc.classList.remove('pop'); void sc.offsetWidth; sc.classList.add('pop'); } }
  ui.refundPct.textContent = Math.round(D.refundChance() * 100) + '%';
  const cut = D.cutPct(); ui.cutLine.classList.toggle('on', cut > 0); ui.cutPct.textContent = cut + '%';
  // how close this Run puts you to the next Tab: banked Candy (teal) + this Run's Candy (pink) against the amount
  const tp = $('tab-progress'); if (tp) { const soon = S.party.tabs.filter(t => !t.cleanup).sort((a, b) => a.dueLeft - b.dueLeft)[0] || S.party.cleanupTab;
    if (soon && !S.party.cleanupPaid) { const bank = S.party.candy, run = Math.floor(RUN.runCandy), tot = bank + run; tp.classList.add('on'); tp.classList.toggle('can', tot >= soon.amount);
      $('tp-name').textContent = (soon.cleanup ? T('Cleanup') : (LANG.cur === 'es' ? glossES('Tab de ' + T(soon.guest)) : soon.guest + "'s Tab")) + (soon.dueLeft <= 0 ? ' · ' + T('OVERDUE') : soon.dueLeft === 1 ? (LANG.cur === 'es' ? ' · vence ya' : ' · due next') : ''); $('tp-num').textContent = (tot >= soon.amount ? 'OK · ' : '') + fmt(Math.min(tot, soon.amount)) + ' / ' + fmt(soon.amount);
      $('tp-bank').style.width = Math.min(100, 100 * bank / soon.amount) + '%'; $('tp-run').style.left = Math.min(100, 100 * bank / soon.amount) + '%'; $('tp-run').style.width = Math.max(0, Math.min(100 - 100 * bank / soon.amount, 100 * run / soon.amount)) + '%'; }
    else tp.classList.remove('on'); }
  ui.party.textContent = S.perm.party; ui.tier.textContent = D.tier(); ui.run.textContent = S.party.runCount + 1;
}
// One shot puts up several of these at once — the Candy, the Round the Sweet Hit refunds, the
// zone multiplier — and they are all born at the same point in the world, so they projected to
// the same screen coordinates and printed on top of each other: "+16 Candy" sitting on
// "SWEET +1 Round". The ±15px of horizontal scatter was never going to separate them, and the
// float animation only travels about 19px in a whole second — less than one line of text.
//
// So a spot is reserved when it is used, and anything landing on an occupied one lines up with
// it and goes a line higher. The reservation is deliberately short-lived: it exists to group the
// floaters of a single hit, which all spawn in the same tick. Keeping it any longer would make
// later shots stack onto stale positions the earlier floaters have already drifted away from,
// which reads worse than not stacking at all.
const FLOAT_LINE = 18;      // vertical spacing, px
const FLOAT_NEAR = 44;      // closer than this horizontally counts as the same spot
const FLOAT_MEMORY = 250;   // ms a spot stays reserved
const floatTaken = [];

function floatSlot(x, y) {
  const now = performance.now();
  for (let i = floatTaken.length - 1; i >= 0; i--) if (now - floatTaken[i].t > FLOAT_MEMORY) floatTaken.splice(i, 1);
  // Adopt the x of whatever is in the way instead of keeping our own: a hit then reads as one
  // tidy stack rather than a crooked staircase. Terminates because y only ever moves up, a line
  // at a time, and there are finitely many reservations to clear.
  let clash;
  while ((clash = floatTaken.find(f => Math.abs(f.x - x) < FLOAT_NEAR && Math.abs(f.y - y) < FLOAT_LINE))) {
    x = clash.x; y = clash.y - FLOAT_LINE;
  }
  floatTaken.push({ x, y, t: now });
  return { x, y };
}

function floater(text, cls, worldPos) {
  const el = document.createElement('div'); el.className = 'floater ' + (cls || ''); el.textContent = T(text);
  let x = window.innerWidth / 2, y = window.innerHeight / 2 - 40;
  if (worldPos) { _v.copy(worldPos).project(camera); x = (_v.x * 0.5 + 0.5) * window.innerWidth; y = (-_v.y * 0.5 + 0.5) * window.innerHeight; }
  x += (Math.random() - 0.5) * 30;
  const slot = floatSlot(x, y); x = slot.x; y = slot.y;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  ui.floaters.appendChild(el); setTimeout(() => el.remove(), 1000);
}
let toastT = null;
function toast(msg, ms) { ui.toast.textContent = T(msg); ui.toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => ui.toast.classList.remove('on'), ms || 2200); }

// ---- Candy payout with The Cut (§5) ----
function collectCandy(amount, pos, opts) {
  opts = opts || {}; amount = Math.floor(amount * (RUN.crowdMult || 1)); if (amount <= 0) return 0;
  let taken = 0;
  if (!opts.untaxed) { const cut = D.cutPct(); taken = Math.floor(amount * cut / 100); }
  const net = amount - taken;
  if (RUN.timeInRun < RUN.rushUntil) { RUN.runCandy += net; }   // Sugar Rush: everything pays twice
  if (RUN.timeInRun < RUN.goldenUntil) { RUN.runCandy += net; }   // Golden Hour event: and twice again
  RUN.runCandy += net; RUN.taken += taken; S.party.backerTaken += taken;
  if (taken > 0) backerTakes(taken);
  floater('+' + net + ' Candy', opts.cls || 'candy', pos);
  ui.runCandy.classList.remove('pop'); void ui.runCandy.offsetWidth; ui.runCandy.classList.add('pop');
  return net;
}

// ---- Refunds (§2): whole Rounds only; half Rounds bank silently ----
function refund(n, pos, label) {
  RUN.halfBank += n; const whole = Math.floor(RUN.halfBank); RUN.halfBank -= whole;
  if (whole > 0) { RUN.mag += whole; floater(label + ' +' + whole + (whole === 1 ? ' Round' : ' Rounds'), label === 'CRIT' ? 'crit' : 'sweet', pos); }
  else floater(label, 'sweet', pos);
}

// ---- Shooting ----
function castRay(nx, ny, hittables) {
  _ndc.set(nx, ny); raycaster.setFromCamera(_ndc, camera);
  return raycaster.intersectObjects(hittables, false);
}
function allHittables() { const out = []; pinatas.forEach(p => { if (p.alive) out.push(...p.hittable()); }); return out; }

function shoot(t) {
  if (!RUN.active || RUN.endingAt) return;
  const w = D.weapon();
  let cd = D.cooldown(w);
  if (w.auto) cd *= 1 - D.rampMax(w) * Math.min(1, RUN.holdT / 2.0);   // the Repeater ramps up while the trigger is held
  if (t - RUN.lastShotT < cd) return;
  if (RUN.mag <= 0 || RUN.reloading) return;
  RUN.lastShotT = t;
  const free = RUN.shots === 0 && D.freeFirst();
  if (!free) RUN.mag -= 1;
  RUN.shots++;
  gunKick(t); if (w.aoe) { SFX.cannon(); JUICE.shake = Math.max(JUICE.shake, 0.5); } else SFX.shot();
  ui.crosshair.classList.remove('hit'); void ui.crosshair.offsetWidth;
  // the pistol runs hot: past the soft limit each shot wanders off the crosshair a little more
  let jitterX = 0, jitterY = 0;
  if (w.heat) { const over = Math.max(0, RUN.heat - BAL.heat_soft); if (over > 0) { const a = Math.random() * Math.PI * 2, rr = over * 0.16 * Math.sqrt(Math.random()); jitterX = Math.cos(a) * rr; jitterY = Math.sin(a) * rr * camera.aspect; } RUN.heat = Math.min(1.3, RUN.heat + BAL.heat_per_shot); }
  if (w.aoe) { launchJawbreaker(w, t); afterShot(); return; }

  const hittables = allHittables();
  const pellets = w.id === 'shotgun' ? D.shotgunPellets() : 1;
  const spread = w.id === 'shotgun' ? D.spread(w) * (1 + 0.25 * favor('shotgun')) : 0;
  // Collect one hit per piñata (best part wins). One shot, one Round (§4).
  const hitsByPinata = new Map();
  const consider = (hit) => {
    const P = hit.object.userData.pinata; if (!P || !P.alive) return;
    const part = hit.object.userData.part;
    const prev = hitsByPinata.get(P);
    const rankOf = pt => pt === 'sweet' ? 3 : pt === 'mid' ? 2 : pt === 'rim' ? 1 : 1;
    if (!prev || rankOf(part) > rankOf(prev.part)) hitsByPinata.set(P, { part, point: hit.point, dist: hit.distance, object: hit.object, pelletHits: (prev ? prev.pelletHits : 0) + 1 }); else prev.pelletHits++;
  };
  let pierceTargets = [];
  for (let i = 0; i < pellets; i++) {
    const ang = Math.random() * Math.PI * 2, rad = pellets > 1 ? Math.sqrt(Math.random()) * spread : 0;
    const nx = aim.x + jitterX + Math.cos(ang) * rad, ny = aim.y + jitterY + Math.sin(ang) * rad * camera.aspect;
    let hits = castRay(nx, ny, hittables);
    // Hit Radius forgiveness for single-shot weapons: a ring of extra rays
    const hr = D.hitRadius(w);
    if (!hits.length && pellets === 1 && hr > 0) {
      for (let k = 0; k < 8 && !hits.length; k++) { const a = k / 8 * Math.PI * 2; hits = castRay(nx + Math.cos(a) * hr, ny + Math.sin(a) * hr * camera.aspect, hittables); }
    }
    if (hits.length && w.range && hits[0].distance > w.range) { floater('OUT OF RANGE', 'miss', hits[0].point); hits = []; }   // the Peashooter fizzles past its range
    if (hits.length) {
      consider(hits[0]);
      if ((D.pierce(w) && hits[0].object.userData.part === 'sweet') || (w.id === 'shotgun' && D.wup(w, 'pierce'))) { // Pierce: pass through to the piñata behind
        const first = hits[0].object.userData.pinata;
        const behind = hits.find(h => h.object.userData.pinata !== first);
        if (behind) pierceTargets.push(behind);
      }
    }
  }
  pierceTargets.forEach(h => { if (!hitsByPinata.has(h.object.userData.pinata)) consider(h); });

  if (hitsByPinata.size === 0) { onMiss(); afterShot(); return; }

  // Bonus de multitud (la Escopeta). Se fija ANTES de repartir para que lo cobre todo lo que
  // salga de este disparo — roturas, salpicadura, cadenas y excedente — y no solo la primera piñata.
  RUN.crowdMult = 1 + (w.crowd || 0) * Math.max(0, hitsByPinata.size - 1);
  if (RUN.crowdMult > 1) floater(es('CROWD', 'MULTITUD') + ' ×' + RUN.crowdMult.toFixed(2), 'golden');

  // Resolve every piñata hit; refund/streak/crit are evaluated ONCE per shot
  let anySweet = false, sweetPos = null, sweetPinata = null, brokeCount = 0;
  for (const [P, h] of hitsByPinata) {
    let ww = w;
    if (w.id === 'shotgun') { // pellets: heavy up close, weak past the second line; several pellets on one piñata stack
      const fall = h.dist < 10 ? 1.5 : h.dist < 16 ? 1.0 : 0.55; ww = Object.assign({}, w, { damage: w.damage * fall * Math.min(4, h.pelletHits || 1) });
    }
    const res = applyHit(P, h, ww, t);
    if (res.sweet) { anySweet = true; sweetPos = sweetPos || h.point; sweetPinata = sweetPinata || P; }
    if (res.broke) brokeCount++;
    if (w.splash) splash(P, h.point, w, t);   // the Big Top Rifle always splashes the neighbours
  }
  ui.crosshair.classList.add('hit');
  if (anySweet) {
    RUN.misses = 0; RUN.streak++; RUN.sweetHits++; RUN.bestStreak = Math.max(RUN.bestStreak || 0, RUN.streak);
    if (RUN.streak === 5 && rank('sugar_hands')) { RUN.sugarHandsUntil = t + 10; toast('Sugar Hands! Crits refund 3 Rounds for 10 s'); }
    streakMilestone(t);
    const crit = critCondition(w, sweetPinata, hitsByPinata, t, sweetPos);
    RUN.lastSweetT = t;
    onSweet(w, crit, sweetPos, t);
  } else { SFX.body(); JUICE.shake = Math.max(JUICE.shake, 0.15); }
  afterShot();
}
// ---- Run events: announced three seconds ahead, then they happen ----
const RUN_EVENTS = {
  starfall:    { name: 'STAR SHOWER', desc: 'the launcher empties itself', fire: () => { for (let i = 0; i < 6; i++) setTimeout(() => { if (RUN.active) spawnToss(); }, i * 220); RUN.launched += 6; } },
  golden_hour: { name: 'GOLDEN HOUR', desc: 'everything pays double for 10 s', fire: t => { RUN.goldenUntil = t + 10; } },
  sugar_storm: { name: 'SUGAR STORM', desc: 'piñatas hang three times faster for 12 s', fire: t => { RUN.stormUntil = t + 12; } },
  stampede:    { name: 'STAMPEDE', desc: 'sprinters cross the yard', fire: () => { const llama = rank('p_llama') > 0; for (let i = 0; i < (llama ? 2 : 3); i++) setTimeout(() => { if (!RUN.active) return; if (llama) spawnLlama(); else spawnComet(); }, i * 900); } },
  spike_party: { name: 'SPIKE PARTY', desc: 'three Spikers — hold your fire', fire: () => { for (let i = 0; i < 3; i++) setTimeout(() => { if (RUN.active) spawnHanging('spiker'); }, i * 300); } },
};
function scheduleEvents() {
  RUN.events = []; const p = S.party; if (p.runCount < 3 || D.centerpieceDue()) return;
  const n = 1 + (D.tier() >= 3 ? 1 : 0) + (D.tier() >= 5 ? 1 : 0); const pool = ['starfall', 'golden_hour', 'sugar_storm']; if (D.tier() >= 2 || rank('p_comet')) pool.push('stampede'); if (D.tier() >= 2) pool.push('spike_party');
  const span = D.runTime() - 14; for (let i = 0; i < n; i++) { const id = pool[Math.floor(Math.random() * pool.length)]; const at = 8 + span * (i + 0.3 + Math.random() * 0.5) / n; RUN.events.push({ id, at, announced: false, count: 3 }); }
  RUN.events.sort((a, b) => a.at - b.at);
}
function updateEvents(t) {
  const ev = RUN.events[0]; if (!ev) return;
  if (!ev.announced && t >= ev.at - 3) { ev.announced = true; ev.count = 3; ui.banner.textContent = T(RUN_EVENTS[ev.id].name + ' IN 3'); ui.banner.classList.add('on'); beep(660, 0.08, 'square', 0.06); }
  if (ev.announced) { const left = Math.ceil(ev.at - t); if (left > 0 && left !== ev.count) { ev.count = left; ui.banner.textContent = T(RUN_EVENTS[ev.id].name + ' IN ' + left); beep(660 + (3 - left) * 120, 0.08, 'square', 0.06); } }
  if (t >= ev.at) { RUN.events.shift(); RUN.eventsFired++; const E = RUN_EVENTS[ev.id]; E.fire(t); ui.banner.textContent = T(E.name) + ' — ' + T(E.desc); ui.banner.classList.add('on'); SFX.golden(); JUICE.shake = Math.max(JUICE.shake, 0.4); clearTimeout(RUN.bannerT); RUN.bannerT = setTimeout(() => { if (RUN.active && ui.banner.textContent.startsWith(T(E.name))) ui.banner.classList.remove('on'); }, 2600); }
}
// what every Sweet Hit earns, whatever fired it: the refund, the time, the Rush trigger
function onSweet(w, crit, sweetPos, t) {
  const tm = w.timeMult || 1;
  unlockAchievement('first_sweet'); if (RUN.streak >= 30) unlockAchievement('streak30'); else if (RUN.streak >= 20) unlockAchievement('streak20'); else if (RUN.streak >= 10) unlockAchievement('streak10');
  // La Round vuelve por probabilidad (D.refundChance, que sube con Devolución de Balas hasta el
  // 100%). Cuando no toca, el Sweet Hit sigue pagando Candy y reloj: lo unico que se pierde es la bala.
  if (crit) {
    RUN.crits++; const manos = t < RUN.sugarHandsUntil;   // Sugar Hands: durante esos 10 s la devolución es segura
    let cr = D.critRefund(); if (manos) cr = Math.max(cr, 3);
    if (manos || Math.random() < D.critRefundChance()) refund(cr, sweetPos, 'CRIT'); else floater('CRIT', 'crit', sweetPos);
    SFX.crit(); addTime(D.critTime() * tm, 'CRIT'); JUICE.hitStop = 0.09; JUICE.shake = Math.max(JUICE.shake, 0.6);
  } else {
    if (Math.random() < D.refundChance()) refund(D.sweetRefund(), sweetPos, 'SWEET HIT'); else floater('SWEET HIT', 'sweet', sweetPos);
    SFX.sweet(); addTime(D.sweetTime(w) * tm, 'SWEET'); JUICE.hitStop = 0.06; JUICE.shake = Math.max(JUICE.shake, 0.35);
  }
  if (RUN.streak >= 10 && D.rush() && !RUN.rushUsed) { RUN.rushUsed = true; RUN.rushUntil = t + D.rushDuration(); toast('SUGAR RUSH — the clock freezes, everything pays double!', 3000); SFX.golden(); }
}
// The Candy Cannon: one slow shell, an area blast at the impact point. Every piñata inside goes; a Sweet Spot inside makes it a Sweet Hit.
const _impact = new THREE.Vector3(), _sw = new THREE.Vector3();
// a jawbreaker leaves the muzzle and arcs; it goes off on the first piñata it touches, or the ground
const jawGeo = new THREE.SphereGeometry(0.16, 12, 10);
function launchJawbreaker(w, t) {
  _ndc.set(aim.x, aim.y); raycaster.setFromCamera(_ndc, camera); const r = raycaster.ray;
  const m = new THREE.Mesh(jawGeo, new THREE.MeshStandardMaterial({ map: polkaTexture(0xe63946, 0xfff4e0), roughness: 0.4 })); m.castShadow = true;
  m.position.copy(r.origin).addScaledVector(r.direction, 0.6).add(new THREE.Vector3(0.15, -0.12, 0));
  const v = r.direction.clone().multiplyScalar(D.projectileSpeed(w)); v.y += 1.6;   // a touch of loft: it arcs
  scene.add(m); PROJ.push({ mesh: m, v, w, life: 4 });
}
function updateProjectiles(dt, t) {
  for (let i = PROJ.length - 1; i >= 0; i--) {
    const p = PROJ[i]; p.v.y -= BAL.gravity * 0.25 * dt; p.mesh.position.addScaledVector(p.v, dt); p.mesh.rotation.x += 8 * dt; p.mesh.rotation.z += 5 * dt; p.life -= dt;
    let hitP = null; for (const P of pinatas) { if (!P.alive) continue; if (P.worldPos(_sw).distanceTo(p.mesh.position) < 0.75 * (P.baseScale || 1)) { hitP = P; break; } }
    const ground = p.mesh.position.y <= 0.12, out = p.mesh.position.z < -24 || Math.abs(p.mesh.position.x) > 15 || p.life <= 0;
    if (hitP || ground || out) { if (ground) p.mesh.position.y = 0.12; scene.remove(p.mesh); PROJ.splice(i, 1); if (RUN.active && !RUN.endingAt) cannonBlast(p.w, t, p.mesh.position, hitP); }
  }
}
function cannonBlast(w, t, at, direct) {
  _impact.copy(at);
  const R = D.aoe(w); burst(_impact, 0xffd23f, 50, 0, null); popFlash(_impact, 0xff8c42); const ring = popFlash(_impact, 0xffffff); if (ring) ring.scale.setScalar(R * 0.5); SFX.cannon(); JUICE.shake = Math.max(JUICE.shake, 0.6);
  let broke = 0, anySweet = false, sweetPos = null;
  const targets = pinatas.filter(P => P.alive && P.worldPos(_sw).distanceTo(_impact) < R + 0.4);
  targets.forEach(P => {
    let sweet = false; P.sweetMeshes.forEach(m => { if (P.open || P.layered) { m.getWorldPosition(_sw); if (_sw.distanceTo(_impact) < R * 0.6) sweet = true; } });
    if (direct === P) sweet = true;
    const res = applyHit(P, { part: sweet ? 'sweet' : 'body', point: P.worldPos().clone(), dist: 0, object: null }, w, t);
    if (res.sweet) { anySweet = true; sweetPos = sweetPos || P.worldPos().clone(); }
    if (res.broke) broke++;
  });
  // cluster jawbreakers: mini-blasts on the nearest piñatas just outside the main radius
  const n = D.clusterBlasts(w);
  if (n > 0) { const outer = pinatas.filter(P => P.alive && !targets.includes(P) && P.worldPos(_sw).distanceTo(_impact) < R * 2.2).sort((a, b) => a.worldPos().distanceTo(_impact) - b.worldPos().distanceTo(_impact)).slice(0, n);
    outer.forEach((P, i) => setTimeout(() => { if (!P.alive || !RUN.active) return; const wp = P.worldPos(); burst(wp, 0xff8c42, 18, 0, null); popFlash(wp, 0xff8c42); SFX.body(); applyHit(P, { part: 'body', point: wp.clone(), dist: 0, object: null, shock: true }, Object.assign({}, w, { damage: 3, id: 'shock' }), t); }, 120 + i * 90)); }
  if (!targets.length) { if (!direct) onMiss(); return; }
  ui.crosshair.classList.add('hit');
  if (broke >= 3) unlockAchievement('blast3');
  if (anySweet) { RUN.misses = 0; RUN.streak++; RUN.sweetHits++; RUN.bestStreak = Math.max(RUN.bestStreak || 0, RUN.streak); const crit = broke >= 3; RUN.lastSweetT = t; onSweet(w, crit, sweetPos, t); if (crit) floater('BLAST ×' + broke, 'golden', _impact); }
  else { SFX.body(); }
}
// Big Top Rifle: every hit splashes a share of its damage over the neighbours (Body-Hit rules — may break them, never refunds)
function splash(P, point, w, t) {
  const R = D.splashRadius(w), dmg = w.damage * D.damageMult() * D.splashPct(w); if (R <= 0 || dmg <= 0) return;
  const ring = popFlash(point, 0xc9b3ef); if (ring) ring.scale.setScalar(R * 0.35);
  pinatas.filter(q => q.alive && q !== P && !q.layered && q.worldPos(_sw).distanceTo(point) < R).forEach(q => {
    applyHit(q, { part: 'body', point: q.worldPos().clone(), dist: 0, object: null, shock: true }, { damage: dmg, candyMult: w.candyMult, id: 'shock' }, t);
  });
}
function critCondition(w, P, hits, t, pos) {
  switch (w.id) {
    case 'pistol': return (t - RUN.lastSweetT) < 0.4;
    case 'pea': return pos && pos.distanceTo(camera.position) < 6;
    case 'cannon': return false;
    case 'six': return pos && pos.distanceTo(camera.position) > 16;
    case 'shotgun': return hits.size >= 2;
    case 'rifle': return P && P.moving;
  }
  return false;
}
// a quiet damage readout: filled pips for damage dealt, hollow for what is left
function damagePips(dmg, health) { const n = Math.max(1, Math.round(health)); const f = Math.min(n, Math.round(dmg)); return '●'.repeat(f) + '○'.repeat(n - f); }
function streakMilestone(t) {
  if (RUN.streak < 5 || RUN.streak % 5 !== 0) return;
  ui.banner.textContent = T(`STREAK ${RUN.streak} · ×${streakMult().toFixed(2)}`); ui.banner.classList.add('on'); clearTimeout(RUN.bannerT); RUN.bannerT = setTimeout(() => { if (RUN.active && ui.banner.textContent.startsWith('STREAK')) ui.banner.classList.remove('on'); }, 1400);
  [880, 1108, 1318, 1760].slice(0, 2 + Math.min(2, RUN.streak / 5 | 0)).forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.09), i * 60)); JUICE.shake = Math.max(JUICE.shake, 0.3);
}
function onMiss() {
  RUN.missCount++; RUN.misses++;
  if (RUN.misses > D.grace()) { RUN.streak = 0; floater('MISS', 'miss'); }
  else floater('MISS (Grace)', 'miss');
  SFX.miss();
}
// ---- ACTIVE RELOAD: the Gears of War beat, but a palm's width under the crosshair ----
// Every reload draws a short track under the crosshair with a needle running across it. Press R
// again while the needle is inside the window and the Mag refills on the spot; land the narrow
// band at the START of that window and the clock pays you for it too.
//
// The windows are FRACTIONS of the track, never seconds (see BAL.active_reload). That is what
// makes the trick learnable: the spot on screen where R has to land is the same with every
// weapon and every rank of Quick reload, even though those change how long a reload takes.
//
// Missing jams the weapon — the track grows and the needle drops back — so mashing R is worse
// than not touching it. Doing nothing is always the old behaviour, which is what keeps the
// mechanic optional for a player who does not want a reflex test.
const AR = { el: $('active-reload'), hideT: 0 };
AR.needle = AR.el.querySelector('.ar-needle'); AR.good = AR.el.querySelector('.ar-good'); AR.perfect = AR.el.querySelector('.ar-perfect');
function arZones() {
  const B = BAL.active_reload, k = S.perm.activeReload === 2 ? B.wide : 1;
  // Se ensancha hacia delante y no alrededor del centro: el punto donde HAY que darle no se
  // mueve entre "Normal" y "Amplia", asi que lo aprendido en una sigue valiendo en la otra.
  const estirar = z => [z[0], Math.min(1, z[0] + (z[1] - z[0]) * k)];
  return { good: estirar(B.good), perfect: estirar(B.perfect) };
}
function startReload(dur) {
  RUN.reloading = true; RUN.reloadT = dur; RUN.reloadDur = dur; RUN.arDone = false;
  RUN.arOn = S.perm.activeReload !== 0 && dur >= BAL.active_reload.min_dur;
  if (RUN.arOn) arShow(); else arHide();
  updateHUD();
}
function arShow() {
  const Z = arZones(), poner = (el, z) => { el.style.left = z[0] * 100 + '%'; el.style.width = (z[1] - z[0]) * 100 + '%'; };
  poner(AR.good, Z.good); poner(AR.perfect, Z.perfect);
  AR.needle.style.left = '0%';
  AR.el.classList.remove('good', 'perfect', 'jam');
  AR.el.classList.toggle('teach', (S.perm.arHits || 0) < BAL.active_reload.teach);   // la tecla se enseña hasta que se coge el truco
  AR.el.hidden = false; clearTimeout(AR.hideT);
}
function arHide() { clearTimeout(AR.hideT); AR.el.hidden = true; AR.el.classList.remove('good', 'perfect', 'jam'); }
function arFlash(cls, quedarse) {
  AR.el.classList.remove('good', 'perfect', 'jam'); void AR.el.offsetWidth; AR.el.classList.add(cls);
  clearTimeout(AR.hideT); if (!quedarse) AR.hideT = setTimeout(arHide, 420);
}
// true si el toque de R se lo ha quedado el minijuego; false para que siga siendo una recarga normal.
function activeReload() {
  if (!RUN.active || !RUN.reloading || !RUN.arOn || RUN.arDone) return false;
  RUN.arDone = true;
  const k = 1 - Math.max(0, RUN.reloadT) / RUN.reloadDur;   // exactamente lo que dibuja la aguja
  const Z = arZones(), dentro = z => k >= z[0] && k <= z[1];
  if (dentro(Z.perfect)) {
    arFlash('perfect'); floater('PERFECT RELOAD', 'golden'); SFX.crit();
    ui.crosshair.classList.remove('hit'); void ui.crosshair.offsetWidth; ui.crosshair.classList.add('hit');
    finishReload(true); addTime(BAL.active_reload.time, 'RELOAD'); arAcertada();
  } else if (dentro(Z.good)) {
    arFlash('good'); floater('QUICK RELOAD', 'sweet'); SFX.sweet();
    finishReload(true); arAcertada();
  } else {
    const pena = RUN.reloadDur * BAL.active_reload.jam;
    RUN.reloadT += pena; RUN.reloadDur += pena;   // la barra crece y la aguja retrocede: se ve lo que ha costado
    arFlash('jam', true); floater('JAMMED', 'miss'); SFX.miss();
  }
  return true;
}
function arAcertada() { S.perm.arHits = (S.perm.arHits || 0) + 1; RUN.arHits++; saveGame(); }
function finishReload(activa) {
  RUN.reloading = false; RUN.arOn = false; RUN.mag = D.magCapacity(); RUN.halfBank = 0;
  updateHUD(); if (!activa) { SFX.open(); arHide(); }
}
function manualReload() { if (!RUN.active || RUN.reloading || RUN.mag >= D.magCapacity()) return; startReload(D.reloadTime() * (0.5 + 0.5 * (1 - RUN.mag / D.magCapacity()))); floater('RELOAD', 'miss'); SFX.open(); }
function afterShot() {
  RUN.crowdMult = 1;   // el bonus de multitud vive solo lo que dura el disparo
  if (RUN.mag <= 0 && !RUN.reloading) { startReload(D.reloadTime()); SFX.miss(); floater('RELOAD', 'miss'); }
  updateHUD();
}

// Apply one shot's effect on one piñata. Returns { sweet, broke }.
function applyHit(P, h, w, t) {
  const part = h.part; const pos = h.point.clone();
  const dmg = w.id === 'shock' ? w.damage : Math.max(1, w.damage * D.damageMult());
  const famMult = D.candyMult(P.family === 'BD' ? 'D' : P.family === 'R' ? 'A' : P.family) * (w.candyMult || 1) * D.breakCandyMult() * D.kindCandyMult(P.kindId === 'mini' ? 'cluster' : P.kindId === 'nestlet' ? 'nest' : P.kindId);

  // Family C: Sugar Glass pays by zone, shatters on any shot (§3)
  if (P.kindId === 'glass') {
    const zone = part === 'sweet' ? 5 : part === 'mid' ? 2 : 1;
    const sweet = part === 'sweet';
    let candy = P.candyBase * famMult * zone * (sweet ? Math.min(D.streakCap(), 1 + D.streakStep() * (RUN.streak + 1)) : 1);
    breakPinata(P, pos, sweet ? 'sweet' : 'body');
    collectCandy(candy, pos);
    if (!sweet) { RUN.bodyHits++; floater(zone === 2 ? 'MIDDLE ×2' : 'RIM ×1', 'body', pos); }
    else floater('CENTER ×5', 'golden', pos);
    return { sweet, broke: true };
  }
  // The Centerpiece: Layers with sequential doors (§7)
  if (P.kindId === 'centerpiece' || P.kindId === 'boss') {
    const L = P.layerIndex; const sweet = part === 'sweet';
    P.layerDamage[L] += sweet ? Math.max(dmg, P.layerHealth[L]) : dmg;
    if (sweet || P.layerDamage[L] >= P.layerHealth[L]) {
      const base = P.candyBase * (L + 1) * famMult;
      const mult = sweet ? Math.min(D.streakCap(), 1 + D.streakStep() * (RUN.streak + 1)) : 1;
      const spill = spillover(P.layerDamage[L], P.layerHealth[L], base);
      collectCandy(base * mult + spill, pos, { cls: 'golden' });
      burst(P.worldPos(), P.layerCols[L], 60, 30); SFX.golden();
      P.layerGroups[L].visible = false; P.layerIndex++;
      if (P.layerIndex >= P.layers) { // it breaks
        if (P.kindId === 'boss') {
          const jackpot = P.candyBase * 8 * famMult; collectCandy(jackpot, pos, { cls: 'golden', untaxed: true });
          const tierN = S.party.bossDue || D.tier(); S.party.bossDue = 0; S.party.bossesBeaten = (S.party.bossesBeaten || 0) + 1; S.perm.bossesEver = (S.perm.bossesEver || 0) + 1;
          S.perm.keepsakes += 1; S.perm.keepsakesEver += 1; RUN.keepsakesWon += 1; RUN.bossDown = true;
          burst(P.worldPos(), 0xff5ea8, 140, 90); P.remove(); RUN.boss = null; toast(bossName(tierN) + ' is down. +1 Keepsake.', 4000); ui.banner.textContent = 'BOSS DOWN'; SFX.golden(); JUICE.hitStop = 0.14; JUICE.shake = 1;
          setTimeout(() => { if (RUN.active) ui.banner.classList.remove('on'); }, 2500); unlockAchievement('boss');
        } else {
          const jackpot = P.candyBase * 12 * famMult; const got = collectCandy(jackpot, pos, { cls: 'golden', untaxed: true });
          S.party.centerpieceBroken = true; S.party.centerpieceCandy = RUN.runCandy;
          burst(P.worldPos(), 0xffd23f, 120, 80); P.remove(); RUN.centerpiece = null; toast('THE CENTERPIECE IS BROKEN! No Tabs left.', 4000);
          ui.banner.textContent = 'NO TABS LEFT'; unlockAchievement('centerpiece');
        }
      } else { P.layerGroups[P.layerIndex].visible = true; toast('Layer ' + (L + 1) + ' of ' + P.layers + ' broken!'); }
      return { sweet, broke: true };
    }
    RUN.bodyHits++; floater('BODY', 'body', pos); return { sweet: false, broke: false };
  }
  // The Spiker: a hazard. Pop it and the clock loses two seconds.
  if (P.kindId === 'spiker') { breakPinata(P, pos, 'body'); burst(pos, 0x222222, 40, 0, _dir); RUN.spikers++; loseTime(BAL.time_penalty); floater('SPIKER! −' + BAL.time_penalty.toFixed(0) + ' s', 'cut', pos); return { sweet: false, broke: true }; }
  // The Glitter Bomb: a decoy. Any hit sets it off in your face — no Candy, the Streak drops, and the screen fills with glitter.
  if (P.kindId === 'glitter') {
    breakPinata(P, pos, 'body'); burst(pos, 0xffffff, 80, 0, _dir); RUN.streak = 0; RUN.misses = 0; RUN.glitters = (RUN.glitters || 0) + 1;
    floater('GLITTER BOMB! Streak lost', 'cut', pos); glitterFlash(); SFX.cut();
    return { sweet: false, broke: true };
  }
  // The Tin Bull: armoured. A Sweet Hit cracks one plate (and still counts as a Sweet Hit); the third one breaks it.
  if (P.armor && part === 'sweet' && P.armorHits + D.armorCrack(w) < P.armor) {
    P.armorHits += D.armorCrack(w); if (P.cracks) P.cracks.forEach((c, i) => { c.visible = i < P.armorHits; });
    floater('ARMOR ' + P.armorHits + '/' + P.armor, 'crit', pos); burst(pos, 0xb8c0c8, 12, 0, _dir); P.kick(pos, 0.5); SFX.body();
    return { sweet: true, broke: false };
  }
  // Everyone else: 1 Sweet Hit breaks; ≤3 Body Hits break (§2, §9 rule 1)
  const sweet = part === 'sweet';
  P.damage += sweet ? Math.max(dmg, P.health) : (P.armor ? dmg * 0.5 : dmg);
  const broke = sweet || P.damage >= P.health;
  if (!broke) {
    RUN.bodyHits++; floater(damagePips(P.damage, P.health), 'body pips', pos); P.kick(pos, D.kickMult(w));
    if (D.stun()) P.stunUntil = t + 1.5;
    if (D.shock() > 0 && !h.shock) shockwave(P, w, t);   // Shockwave: the neighbours feel it too
    return { sweet: false, broke: false };
  }
  // payout
  let candy;
  if (P.kindId === 'comet') {
    RUN.comets = (RUN.comets || 0) + 1; unlockAchievement('comet'); const base = P.candyBase * famMult; const mult = sweet ? Math.min(D.streakCap(), 1 + D.streakStep() * (RUN.streak + 1)) : 1;
    breakPinata(P, pos, 'sweet'); burst(pos, 0xffc300, 70, 20, _dir); collectCandy(base * mult, pos, { cls: 'golden' }); floater('SUGAR COMET ×5!', 'golden', pos); SFX.golden();
    RUN.timeLeft += 3; RUN.bonusTime += 3; const bb = $('timer-bonus'); if (bb) { bb.textContent = '+3.0 s'; bb.classList.remove('on'); void bb.offsetWidth; bb.classList.add('on'); }
    JUICE.hitStop = Math.max(JUICE.hitStop, 0.1); JUICE.shake = Math.max(JUICE.shake, 0.7);
    return { sweet, broke: true };
  }
  if (P.kindId === 'llama') {
    RUN.llamas++; unlockAchievement('llama'); const base = P.candyBase * famMult; const mult = sweet ? Math.min(D.streakCap(), 1 + D.streakStep() * (RUN.streak + 1)) : 1;
    breakPinata(P, pos, 'sweet'); burst(pos, 0xff5ea8, 90, 30, _dir); collectCandy(base * mult, pos, { cls: 'golden' }); floater('LUCKY LLAMA ×8!', 'golden', pos); SFX.golden();
    const ks = 1 + (D.heirloom() ? 1 : 0); S.perm.keepsakes += ks; S.perm.keepsakesEver += ks; RUN.keepsakesWon += ks; floater('+' + ks + ' KEEPSAKE', 'crit', pos.clone().add(new THREE.Vector3(0, 0.5, 0)));
    JUICE.hitStop = Math.max(JUICE.hitStop, 0.12); JUICE.shake = Math.max(JUICE.shake, 0.8);
    return { sweet, broke: true };
  }
  if (P.kindId === 'repo') {
    candy = Math.min(P.repoHeld, S.party.backerTaken); S.party.backerTaken -= candy; // untaxed, unmultiplied (§3)
    breakPinata(P, pos, sweet ? 'sweet' : 'body'); collectCandy(candy, pos, { untaxed: true, cls: 'golden' }); floater('REPO — Candy back!', 'golden', pos);
    return { sweet, broke: true };
  }
  const base = P.candyBase * famMult;
  const mult = sweet ? Math.min(D.streakCap(), 1 + D.streakStep() * (RUN.streak + 1)) : 1;
  const spill = spillover(P.damage, P.health, base);
  if (spill > 0) { RUN.spillCandy += spill; floater('SPILLOVER +' + spill, 'candy', pos.clone().add(new THREE.Vector3(0, 0.4, 0))); }
  candy = base * mult + spill;
  if (w.id === 'pea' && Math.random() < D.doubleDrop(w)) { candy *= 2; floater('DOUBLE DROP', 'crit', pos.clone().add(new THREE.Vector3(0, 0.5, 0))); }
  if (D.candyPull(w) > 0) candyToHost(D.candyPull(w), () => { RUN.runCandy += 2; updateHUD(); });
  if (P.armor) unlockAchievement('tinbull');
  if (D.jackpotChance() > 0 && Math.random() < D.jackpotChance()) { candy *= 5; RUN.jackpots++; floater('JACKPOT ×5', 'golden', pos.clone().add(new THREE.Vector3(0, 0.6, 0))); SFX.golden(); JUICE.shake = Math.max(JUICE.shake, 0.6); }
  if (!sweet) RUN.bodyHits++;
  breakPinata(P, pos, sweet ? 'sweet' : 'body');
  collectCandy(candy, pos, { cls: P.kindId === 'golden' ? 'golden' : 'candy' });
  if (P.kindId === 'golden') { floater('GOLDEN ×10!', 'golden', pos); SFX.golden(); unlockAchievement('golden'); if (D.heirloom()) { S.perm.keepsakes++; S.perm.keepsakesEver++; RUN.keepsakesWon++; floater('+1 KEEPSAKE', 'crit', pos.clone().add(new THREE.Vector3(0, 0.5, 0))); } }
  if (sweet && D.chainChance() > 0 && Math.random() < D.chainChance()) chainPop(P.worldPos(), mult);
  if (P.k.cluster) { const kids = releaseMinis(P); floater('CLUSTER! ' + kids.length + ' Mini Stars', 'crit', pos.clone().add(new THREE.Vector3(0, 0.5, 0))); }
  // Family B: release Nestlings; Punch-Through opens extra Layers (§3)
  if (P.kindId === 'nest') {
    const kids = releaseNestlets(P);
    const extra = sweet ? D.punch() - 1 : 0;
    for (let i = 0; i < extra && kids.length; i++) { const kid = kids.pop(); const kb = kid.candyBase * D.candyMult('B'); breakPinata(kid, kid.worldPos(), 'sweet'); collectCandy(kb * mult, kid.worldPos()); floater('PUNCH-THROUGH', 'crit', kid.worldPos()); }
  }
  return { sweet, broke: true };
}
function glitterFlash() { const el = $('glitter'); if (!el) return; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
// Shockwave: a Body Hit thumps every piñata within 2 m for a little damage (Body-Hit rules: may break them, never refunds)
function shockwave(P, w, t) {
  const from = P.worldPos(); const d = D.shock();
  pinatas.filter(q => q.alive && q !== P && !q.layered && q.worldPos(_sw).distanceTo(from) < 2).forEach(q => {
    applyHit(q, { part: 'body', point: q.worldPos().clone(), dist: 0, object: null, shock: true }, { damage: d, candyMult: w.candyMult, id: 'shock' }, t);
  });
}
// Chain Pop: the nearest hanging piñata goes too, a beat later, paying its Candy (no refund, no time — those are for aim)
function chainPop(from, mult) {
  const cands = pinatas.filter(q => q.alive && !q.layered && q.kindId !== 'repo');
  let best = null, bd = 6.5; cands.forEach(q => { const d = q.worldPos().distanceTo(from); if (d < bd) { bd = d; best = q; } });
  if (!best) return;
  setTimeout(() => {
    if (!best.alive || !RUN.active) return;
    const famMult = D.candyMult(best.family === 'R' ? 'A' : best.family); const pos = best.worldPos();
    RUN.chains++; breakPinata(best, pos, 'sweet'); collectCandy(best.candyBase * famMult * mult, pos, { cls: 'crit' }); floater('CHAIN POP', 'crit', pos);
    if (best.kindId === 'nest') releaseNestlets(best);
    if (Math.random() < D.chainChance()) chainPop(pos, mult);
  }, 140);
}
function spillover(damage, health, base) {
  if (health <= 0 || damage <= health) return 0;
  return Math.floor((damage - health) / health * base * D.spillRate());
}
const _dir = new THREE.Vector3();
function breakPinata(P, pos, how) {
  RUN.breaks++; camera.getWorldDirection(_dir);
  const wp = P.worldPos();
  burst(wp, P.k.color, how === 'sweet' ? 34 : 20, Math.min(16, 5 + Math.round(P.candyBase / 5)), _dir);
  popFlash(wp, how === 'sweet' ? 0xffffff : P.k.color);
  SFX.breakP(); P.remove();
}

// ---- Wild actives (§6) ----
function confettiBurst(t) {
  if (!rank('confetti') || t < RUN.burstReadyAt || !RUN.active) return;
  RUN.burstUntil = t + 3; RUN.burstReadyAt = t + 20; RUN.burstScale = 2;
  pinatas.forEach(p => { if (p.open && !p.layered) p.sweetMeshes.forEach(m => m.scale.setScalar(p.sweetScale * 2)); });
  toast('Confetti Burst! Sweet Spots enlarged for 3 s'); renderWildBar();
}
function renderWildBar() {
  ui.wild.innerHTML = '';
  if (rank('confetti')) { const b = document.createElement('button'); b.className = 'wild-btn'; b.id = 'btn-burst'; b.innerHTML = 'Confetti Burst <kbd>Q</kbd><span class="cd"></span>'; b.onclick = e => { e.stopPropagation(); confettiBurst(RUN.timeInRun); }; ui.wild.appendChild(b); }
}

// ---- per-frame ----
function updateRun(dt, t) {
  RUN.timeInRun = t;
  if (RUN.burstUntil && t > RUN.burstUntil) { RUN.burstUntil = 0; RUN.burstScale = 1; pinatas.forEach(p => { if (p.open && !p.layered) p.sweetMeshes.forEach(m => m.scale.setScalar(p.sweetScale)); }); }
  const bb = $('btn-burst'); if (bb) { const ready = t >= RUN.burstReadyAt; bb.disabled = !ready; bb.querySelector('.cd').style.width = ready ? '0' : (100 * (1 - (RUN.burstReadyAt - t) / 20)) + '%'; }
  for (let i = pinatas.length - 1; i >= 0; i--) pinatas[i].update(dt, t);
  updateProjectiles(dt, t); updateReticle(dt, t); if (!RUN.endingAt) updateEvents(t);
  if (RUN.endingAt) { updateTimerHUD(); if (t >= RUN.endingAt) endRun(); return; }
  if (aim.firing && D.weapon().auto) { RUN.holdT += dt; shoot(t); } else RUN.holdT = Math.max(0, RUN.holdT - dt * 2);
  // the clock (frozen during a Sugar Rush)
  if (t >= RUN.rushUntil) RUN.timeLeft -= dt;
  if (RUN.timeLeft < 5 && Math.ceil(RUN.timeLeft) !== RUN.lastTick) { RUN.lastTick = Math.ceil(RUN.timeLeft); SFX.tick(); }
  updateTimerHUD();
  if (RUN.timeLeft <= 0 && D.encore() && !RUN.encoreUsed && RUN.streak >= 8) { RUN.encoreUsed = true; RUN.timeLeft = 5; toast('ENCORE! Five more seconds — keep the Streak alive.', 3000); SFX.golden(); JUICE.shake = 0.5; }
  if (RUN.timeLeft <= 0) { RUN.timeLeft = 0; RUN.endingAt = t + 0.9; ui.hint.textContent = T('Time! The Run is over.'); SFX.timeUp(); JUICE.shake = 0.5; return; }
  if (RUN.heat > 0) { RUN.heat = Math.max(0, RUN.heat - D.heatCool() * dt); if (D.weapon().heat) { const bar = $('heat-bar'); if (bar) { bar.style.width = Math.min(100, RUN.heat * 100) + '%'; bar.classList.toggle('hot', RUN.heat > BAL.heat_soft); } } }
  if (RUN.reloading) {
    RUN.reloadT -= dt;
    // El avance se mide contra la duracion DE ESTA recarga (una recarga a mano con el cargador
    // medio lleno es mas corta, y un atasco la alarga), no contra D.reloadTime().
    const k = Math.max(0, Math.min(1, 1 - Math.max(0, RUN.reloadT) / (RUN.reloadDur || D.reloadTime())));
    const bar = $('reload-bar'); if (bar) bar.style.width = (100 * k) + '%';
    if (RUN.arOn) AR.needle.style.left = (k * 100) + '%';
    if (RUN.reloadT <= 0) finishReload(false);
  }
  // Candy Vacuum: on a hot Streak the grass empties itself into your pockets
  if (D.vacuum() && RUN.streak >= D.vacuumStreak() && groundCandy.length) { RUN.vacT -= dt; if (RUN.vacT <= 0) { RUN.vacT = 0.22; const per = D.vacuumCandy(); candyToHost(3, () => { RUN.runCandy += per; RUN.vacCandy += per; SFX.vac(); if (RUN.vacCandy % 10 < per) floater('VACUUM +' + RUN.vacCandy, 'sweet', _feetFloat.set(camera.position.x, 0.4, camera.position.z - 1.5)); updateHUD(); }); } }
  // spawn pacing: keep the Backyard full
  RUN.spawnT -= dt;
  const hanging = pinatas.filter(p => p.slot).length;
  const target = Math.min(D.maxPinatas(), D.startPinatas() + 2 + rank('max_pinatas'));
  if ((RUN.spawnT <= 0 && hanging < target) || hanging < 2) {
    RUN.spawnT = D.spawnInterval() * (t < RUN.stormUntil ? 0.33 : 1);
    const roll = Math.random();
    if (!pinatas.some(p => p.kindId === 'llama') && Math.random() < D.llamaChance()) { spawnLlama(); toast('A Lucky Llama! Hit it before it leaves the yard.', 2500); SFX.open(); }
    else if (!pinatas.some(p => p.kindId === 'comet') && Math.random() < D.cometChance()) { spawnComet(); SFX.launch(); }
    if (roll < D.goldenChance()) spawnHanging('golden');
    else if (D.overdueCount() >= BAL.repo_debt_threshold && S.party.backerTaken > 20 && !pinatas.some(p => p.kindId === 'repo') && roll < D.goldenChance() + BAL.repo_chance + 0.02 * D.overdueCount()) {
      const held = Math.min(S.party.backerTaken, Math.max(30, Math.floor(S.party.backerTaken * 0.4)));
      const rp = spawnHanging('repo'); if (rp) rp.repoHeld = held; if (rp && !RUN.repoSpawned) { RUN.repoSpawned = true; toast('A Repo Piñata! Break it to get Candy back from the Backer.'); }
    } else spawnHanging();
  }
  // the launcher: from Tier 2 it fires volleys at random, more eagerly as the clock runs down
  if (D.tier() >= BAL.launcher_from_tier || S.party.runCount >= 5) {
    RUN.launcherT -= dt * D.launcherRate();
    if (RUN.launcherT <= 0) {
      RUN.launcherT = BAL.launcher_gap[0] + Math.random() * (BAL.launcher_gap[1] - BAL.launcher_gap[0]);
      const late = 1 - RUN.timeLeft / D.runTime(); const p = 0.35 + 0.55 * late;
      if (Math.random() < p) { RUN.launched += launcherVolley(); SFX.launch(); ui.banner.textContent = T('LAUNCHER!'); ui.banner.classList.add('on'); setTimeout(() => { if (RUN.active && ui.banner.textContent === T('LAUNCHER!')) ui.banner.classList.remove('on'); }, 1800); }
    }
  }
}
const _feetFloat = new THREE.Vector3();

function endRun() {
  RUN.active = false; RUN.endingAt = 0; RUN.reloading = false; arHide(); document.body.classList.remove('lowtime');
  const p = S.party;
  const banked = Math.floor(RUN.runCandy);
  p.candy += banked;
  p.lastRun = { banked, taken: RUN.taken, shots: RUN.shots, sweetHits: RUN.sweetHits, crits: RUN.crits, bodyHits: RUN.bodyHits, misses: RUN.missCount, breaks: RUN.breaks, spill: RUN.spillCandy, bestStreak: RUN.bestStreak || 0, toss: RUN.toss, bonusTime: RUN.bonusTime, chains: RUN.chains, vac: RUN.vacCandy, duration: D.runTime() + RUN.bonusTime, launched: RUN.launched, llamas: RUN.llamas, keepsakesWon: RUN.keepsakesWon, jackpots: RUN.jackpots, penalty: RUN.penalty, spikers: RUN.spikers, bossDown: RUN.bossDown, bossFaced: !!RUN.boss || RUN.bossDown };
  PROJ.forEach(pr => scene.remove(pr.mesh)); PROJ.length = 0; aim.firing = false;
  p.runCount++;
  bumpStats(p.lastRun); p.bestStreak = Math.max(p.bestStreak || 0, RUN.bestStreak || 0); p.breaksThisParty = (p.breaksThisParty || 0) + RUN.breaks;
  if (banked >= 10000) unlockAchievement('rich_run2'); else if (banked >= 1000) unlockAchievement('rich_run');
  if ((RUN.spikersFizzled || 0) >= 3 && RUN.spikers === 0) unlockAchievement('dodge');
  // Tabs tick at the end of each Run after the one they arrived in (§5)
  p.tabs.forEach(t => { if (!t.cleanup && t.arrivedRun < p.runCount) t.dueLeft--; });
  arriveTabsIfDue(); if (D.overdueCount() > 0) p.everOverdue = true;
  saveGame();
  ui.banner.classList.remove('on');
  enterHub();
  showRunOver();
  if (p.tabsArrivedThisRun.length) backerSay(p.tabsArrivedThisRun.length === 1 ? 'Mail for you, mijo.' : 'More mail for you, mijo.', 4);
}
