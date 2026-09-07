// ---------- TUTORIAL: contextual, in the world, skippable ----------
// No walls of text. A small card names the one thing to do next; the world shows where: a glowing ring on the first
// Sweet Spot, a pulsing clock, a trail of light from your feet to the Mailbox. Every step completes by doing it.
const TUT = { step: null, moved: 0, lastPos: null, timer: 0, ring: null, trail: null, active: false };
const TUT_STEPS = {
  move:   { icon: 'walk', text: 'Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · look with the mouse' },
  firing: { icon: 'target', text: 'Walk to the chalk line (the golden marker) and <b>hold E</b> to start Run 1' },
  aim:    { icon: 'sparkle', text: 'Shoot the <b>glowing Sweet Spot</b> — that ring on the piñata' },
  sweet:  { icon: 'clock', text: '<b>Sweet Hit!</b> You got the Round back <i>and</i> time on the clock. Body hits don\'t.' },
  streak: { icon: 'flame', text: 'Land Sweet Hits <b>in a row</b>: the Streak multiplies Candy. A miss resets it.' },
  clock:  { icon: 'hourglass', text: 'When the clock hits zero the Run ends and the Candy banks. Squeeze in what you can.' },
  mail:   { icon: 'mail', text: 'Follow the trail to the <b>Mailbox</b>. The Tabs are due — that is the whole game.' },
  pay:    { icon: 'coin', text: 'Pay a Tab when you can. Candy you keep goes to the <b>Candy Tree</b> after Run 1.' },
  tree:   { icon: 'tree', text: 'The <b>Candy Tree</b> is open: invite new piñatas and buy Nodes. You choose: pay or grow.' },
};
function tutEnabled() { return !S.perm.tutDone && !S.perm.tutOff && S.perm.party === 1; }
function tutStart() { if (!tutEnabled() || S.party.runCount > 1) return; TUT.active = true; tutSet(S.party.runCount === 0 ? 'move' : 'tree'); }
function tutSet(step) {
  TUT.step = step; TUT.timer = 0; const el = $('tut'); if (!el) return;
  if (!step) { el.classList.remove('on'); tutClearWorld(); return; }
  const s = TUT_STEPS[step]; el.innerHTML = `<span class="t-ico">${ico(s.icon, 26)}</span><span class="t-text">${T(s.text)}</span><button class="link-btn" id="tut-skip">${T('skip tutorial')}</button>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  $('tut-skip').onclick = e => { e.stopPropagation(); tutSkip(); };
  tutClearWorld();
  if (step === 'mail') tutBuildTrail();
  if (step === 'aim') tutBuildRing();
  if (step === 'sweet') { const tw = $('timer-wrap'); if (tw) { tw.classList.add('tut-pulse'); setTimeout(() => tw.classList.remove('tut-pulse'), 3500); } }
}
function tutSkip() { TUT.active = false; S.perm.tutDone = true; saveGame(); tutSet(null); }
function tutDone() { TUT.active = false; S.perm.tutDone = true; saveGame(); tutSet(null); toast('That is the loop: Run → Candy → pay or grow. Have fun.', 3500); }
function tutClearWorld() {
  if (TUT.ring) { scene.remove(TUT.ring); TUT.ring = null; }
  if (TUT.trail) { scene.remove(TUT.trail); TUT.trail = null; }
  $('objective') && $('objective').classList.remove('tut-pulse');
}
// a soft ring that sits on the first live Sweet Spot
function tutBuildRing() {
  const tex = canvasTex('tutring', 128, 128, g => { g.clearRect(0, 0, 128, 128); g.strokeStyle = '#ffd23f'; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 38, 0, 7); g.stroke(); });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.repeat.set(1, 1);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0.95 })); sp.renderOrder = 20; sp.scale.set(1, 1, 1); scene.add(sp); TUT.ring = sp;
}
// a trail of light discs from your feet to the Mailbox
function tutBuildTrail() {
  const g = new THREE.Group(); const geo = new THREE.CircleGeometry(0.16, 16);
  for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.6, depthWrite: false })); m.rotation.x = -Math.PI / 2; g.add(m); }
  scene.add(g); TUT.trail = g;
}
const _tp = new THREE.Vector3();
function updateTutorial(dt, t) {
  if (!TUT.active || !TUT.step) return;
  TUT.timer += dt; const st = TUT.step;
  if (st === 'move') {
    if (HUB.mode === 'run') { tutSet('aim'); return; }
    if (HUB.mode === 'hub') { if (TUT.lastPos) TUT.moved += HUB.pos.distanceTo(TUT.lastPos); TUT.lastPos = TUT.lastPos || new THREE.Vector3(); TUT.lastPos.copy(HUB.pos); if (TUT.moved > 1.5) tutSet('firing'); }
  } else if (st === 'firing') {
    if (HUB.mode === 'run') tutSet('aim');
  } else if (st === 'aim') {
    if (HUB.mode !== 'run') { tutSet('firing'); return; }
    // ring follows the nearest open Sweet Spot
    let best = null, bd = 1e9; pinatas.forEach(P => { if (!P.alive || !P.open || !P.sweetMeshes.length) return; P.sweetMeshes[0].getWorldPosition(_tp); const d = _tp.distanceTo(camera.position); if (d < bd) { bd = d; best = P; } });
    if (TUT.ring && best) { best.sweetMeshes[0].getWorldPosition(TUT.ring.position); const s = 0.9 + Math.sin(t * 5) * 0.15; TUT.ring.scale.set(s, s, 1); TUT.ring.visible = true; } else if (TUT.ring) TUT.ring.visible = false;
    if (RUN.sweetHits > 0) tutSet('sweet');
  } else if (st === 'sweet') {
    if (TUT.timer > 3.5 || RUN.sweetHits >= 3) tutSet('streak');
    if (HUB.mode !== 'run') tutSet('clock');
  } else if (st === 'streak') {
    if (RUN.streak >= 3 || RUN.timeLeft < 15) tutSet('clock');
    if (HUB.mode !== 'run') tutSet('clock');
  } else if (st === 'clock') {
    if (HUB.mode === 'hub' && S.party.runCount >= 1) tutSet('mail');
  } else if (st === 'mail') {
    if (TUT.trail && HUB.mode === 'hub') {
      const mb = stationById.mailbox.pos; const n = TUT.trail.children.length;
      TUT.trail.children.forEach((m, i) => { const k = (i + 1) / (n + 1); m.position.set(HUB.pos.x + (mb.x - HUB.pos.x) * k, 0.03 + i * 0.001, HUB.pos.z + (mb.z - HUB.pos.z) * k); m.material.opacity = 0.25 + 0.6 * Math.max(0, Math.sin(t * 3 - i * 0.45)); m.scale.setScalar(0.8 + 0.3 * Math.max(0, Math.sin(t * 3 - i * 0.45))); });
      TUT.trail.visible = !PANEL.kind;
    }
    if (PANEL.kind === 'mailbox') tutSet('pay');
  } else if (st === 'pay') {
    if (S.party.tabsPaid > 0 || (PANEL.kind !== 'mailbox' && TUT.timer > 2 && HUB.mode === 'hub')) tutSet('tree');
  } else if (st === 'tree') {
    const ob = $('objective'); if (ob && !stationLocked(stationById.tree)) ob.classList.add('tut-pulse');
    if (PANEL.kind === 'tree') tutDone();
    if (S.party.runCount >= 3) tutDone();
  }
}
