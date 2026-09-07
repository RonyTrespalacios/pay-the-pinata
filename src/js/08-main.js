// ---------- INPUT, LOOK, MAIN LOOP, BOOT ----------
const YAW_MAX_RUN = 1.35, PITCH_MIN = -0.6, PITCH_MAX = 1.0;
let pointerLockSupported = 'pointerLockElement' in document && typeof canvas.requestPointerLock === 'function';
const inWorld = () => HUB.mode === 'hub' || HUB.mode === 'run';

// Captured mouse is the only look mode. `aim.mouseMode` is now purely an emergency fallback
// for browsers/frames that refuse pointer lock (cursor position drives the camera, no smoothing, no edge-turn).
function tryPointerLock() {
  if (!pointerLockSupported) { setMouseMode(true); return; }
  try {
    // raw input: ask the browser to skip OS acceleration (unadjustedMovement); fall back to a plain lock where unsupported
    let r = null; try { r = canvas.requestPointerLock({ unadjustedMovement: true }); } catch (e) { r = canvas.requestPointerLock(); }
    if (r && r.catch) r.catch(() => { try { const r2 = canvas.requestPointerLock(); if (r2 && r2.catch) r2.catch(() => setMouseMode(true)); } catch (e) { setMouseMode(true); } });
  } catch (e) { setMouseMode(true); }
}
function setMouseMode(on) {
  aim.mouseMode = on; document.body.classList.toggle('mouse-aim', on); aim.x = 0; aim.y = 0;
  if (on) ui.hint.textContent = T(HUB.mode === 'run' ? 'Move the mouse to look · click to shoot · 1–6 weapons' : 'WASD walk · move the mouse to look · E use');
}
// The browser always drops pointer lock on Esc; we turn that into a proper pause instead of a dead cursor.
const PAUSE = { on: false };
function setPaused(on) {
  PAUSE.on = on; $('pause').classList.toggle('on', on); document.body.classList.toggle('menu', on); if (on) holdStop();
  if (on) { $('settings').hidden = true; document.querySelector('.pause-menu').hidden = false; $('btn-to-title').hidden = HUB.mode === 'title'; $('btn-resume').textContent = T(HUB.mode === 'title' ? 'Close' : 'Resume'); $('btn-to-yard').hidden = HUB.mode !== 'run'; $('btn-to-yard').textContent = es('End the Run early (bank ' + fmt(RUN.runCandy) + ' Candy)', 'Terminar la Ronda ya (guardar ' + fmt(RUN.runCandy) + ' Dulces)'); syncSettingsUI(); }
}
function resumeGame() { if (aim.mouseMode || HUB.mode === 'title') setPaused(false); else tryPointerLock(); }
function syncSettingsUI() {
  const s = sensV(); $('set-sens').value = s; $('set-sens-v').textContent = s.toFixed(2); $('set-sens-num').value = s.toFixed(2); $('set-dpi').value = S.perm.dpi || 800; updateSensInfo();
  $('set-sound').checked = !S.perm.muted; $('set-sound-v').textContent = S.perm.muted ? es('off', 'no') : es('on', 'sí');
  const mv = S.perm.musicVol == null ? 0.5 : S.perm.musicVol, sv = S.perm.sfxVol == null ? 0.8 : S.perm.sfxVol; $('set-music').value = mv; $('set-music-v').textContent = Math.round(mv * 100) + '%'; $('set-sfx').value = sv; $('set-sfx-v').textContent = Math.round(sv * 100) + '%';
  $('set-tut').checked = !S.perm.tutOff; $('set-tut-v').textContent = S.perm.tutOff ? es('off', 'no') : es('on', 'sí');
}
$('btn-resume').onclick = e => { e.stopPropagation(); resumeGame(); };
$('btn-records').onclick = e => { e.stopPropagation(); setPaused(false); if (HUB.mode === 'run') return; openPanel('records'); };
$('btn-title-records').onclick = () => openPanel('records');
$('btn-title-how').onclick = () => { $('how-to').hidden = false; };
$('how-close').onclick = () => { $('how-to').hidden = true; };
$('how-to').addEventListener('click', e => { if (e.target === $('how-to')) $('how-to').hidden = true; });
// menu-button icons (SVG, not emoji)
document.querySelectorAll('.mb-ic[data-icon]').forEach(e => { e.innerHTML = ico(e.dataset.icon, 16); });
$('btn-settings').onclick = e => { e.stopPropagation(); $('settings').hidden = false; document.querySelector('.pause-menu').hidden = true; };
$('btn-settings-back').onclick = e => { e.stopPropagation(); $('settings').hidden = true; document.querySelector('.pause-menu').hidden = false; };
function sensV() { const v = S.perm.sensV; return (typeof v === 'number' && v > 0) ? v : BAL.sens_default; }
function radPerCount() { return sensV() * BAL.sens_deg_per_count * Math.PI / 180; }
function setSens(v) { v = Math.min(BAL.sens_max, Math.max(BAL.sens_min, Math.round(v * 100) / 100)); S.perm.sensV = v; $('set-sens').value = v; $('set-sens-v').textContent = v.toFixed(2); $('set-sens-num').value = v.toFixed(2); updateSensInfo(); saveGame(); }
function updateSensInfo() { const dpi = S.perm.dpi || 800; const cm = 360 / (sensV() * BAL.sens_deg_per_count * dpi) * 2.54; $('set-sens-info').textContent = `eDPI ${Math.round(sensV() * dpi)} · ${cm.toFixed(1)} cm / 360° ${es('at','a')} ${dpi} DPI · ${es('103° horizontal FOV','103° FOV horizontal')}`; }
function setLang(l) { LANG.cur = l; S.perm.lang = l; saveGame(); applyLang(); $('set-lang').value = l; $('lang-label').textContent = l === 'es' ? 'English' : 'Español'; STATIONS.forEach(st => st.signKey = ''); refreshSigns(); if (typeof updateTreeSign === 'function') updateTreeSign(); if (HUB.mode !== 'title') refreshHub(); if (PANEL.kind) renderPanel(); if (typeof TUT !== 'undefined' && TUT.step) tutSet(TUT.step); boot.refreshTitle && boot.refreshTitle(); updateHubHUD(); }
$('set-lang').onchange = e => setLang(e.target.value);
$('btn-lang').onclick = () => setLang(LANG.cur === 'es' ? 'en' : 'es');
$('set-sens').oninput = e => setSens(parseFloat(e.target.value));
$('set-sens-num').onchange = e => setSens(parseFloat(e.target.value) || BAL.sens_default);
$('set-dpi').onchange = e => { S.perm.dpi = Math.max(100, Math.min(32000, parseInt(e.target.value, 10) || 800)); e.target.value = S.perm.dpi; updateSensInfo(); saveGame(); };
$('set-sound').onchange = e => { S.perm.muted = !e.target.checked; $('set-sound-v').textContent = S.perm.muted ? es('off', 'no') : es('on', 'sí'); applyMusicVolume(); saveGame(); };
$('set-music').oninput = e => { S.perm.musicVol = parseFloat(e.target.value); $('set-music-v').textContent = Math.round(S.perm.musicVol * 100) + '%'; applyMusicVolume(); saveGame(); };
$('set-sfx').oninput = e => { S.perm.sfxVol = parseFloat(e.target.value); $('set-sfx-v').textContent = Math.round(S.perm.sfxVol * 100) + '%'; if (AUDIO.sfx) AUDIO.sfx.gain.value = S.perm.sfxVol; beep(660, 0.05, 'triangle', 0.08); saveGame(); };
$('set-tut').onchange = e => { S.perm.tutOff = !e.target.checked; $('set-tut-v').textContent = S.perm.tutOff ? es('off', 'no') : es('on', 'sí'); if (S.perm.tutOff) tutSkip(); saveGame(); };
$('btn-to-yard').onclick = e => { e.stopPropagation(); if (HUB.mode !== 'run') return; setPaused(false); RUN.timeLeft = 0; RUN.endingAt = RUN.timeInRun + 0.01; RUN.encoreUsed = true; };
$('btn-to-title').onclick = e => {
  e.stopPropagation(); setPaused(false);
  if (HUB.mode === 'run') { RUN.active = false; RUN.endingAt = 0; S.party.candy += Math.floor(RUN.runCandy); S.party.runCount++; saveGame(); clearPinatas(); clearGroundCandy(); }   // leaving mid-Run banks what you had
  closePanel(); $('runover').classList.remove('on'); ui.banner.classList.remove('on');
  HUB.mode = 'title'; document.body.classList.remove('playing', 'hub'); document.body.classList.add('menu'); showScreen('title'); boot.refreshTitle();
};
document.addEventListener('pointerlockchange', () => {
  aim.locked = document.pointerLockElement === canvas;
  if (aim.locked) { setMouseMode(false); aim.x = 0; aim.y = 0; setPaused(false); ui.hint.textContent = T(HUB.mode === 'run' ? 'Click to shoot · 1–6 weapons · Esc pauses' : 'WASD walk · E use · Esc pauses'); }
  else if (inWorld() && !aim.mouseMode) setPaused(true);
});
$('pause').addEventListener('click', e => { if (e.target === $('pause')) resumeGame(); });
document.addEventListener('pointerlockerror', () => { setMouseMode(true); toast('This page blocks mouse capture — the camera follows the cursor instead. Open the downloaded party-tab.html for the real thing.', 6000); });

// In the hub the Host can turn all the way around; on the firing line the yard is in front.
function yawLimit() { return HUB.mode === 'run' ? YAW_MAX_RUN : Infinity; }
canvas.addEventListener('mousemove', e => {
  if (aim.locked) {
    const k = radPerCount();   // Valorant yaw: counts × sens × 0.0705°, straight onto the camera — no smoothing, no lag
    look.tYaw = THREE.MathUtils.clamp(look.tYaw - e.movementX * k, -yawLimit(), yawLimit());
    look.tPitch = THREE.MathUtils.clamp(look.tPitch - e.movementY * k, PITCH_MIN, PITCH_MAX);
    look.yaw = look.tYaw; look.pitch = look.tPitch;
  } else if (aim.mouseMode && inWorld()) {
    // fallback only (capture refused by the page): raw mouse deltas, unbounded — plus a slow auto-turn when the pointer
    // rests against the screen edge, so a full 360° never gets stuck
    const k = radPerCount();
    look.tYaw = THREE.MathUtils.clamp(look.tYaw - e.movementX * k, -yawLimit(), yawLimit());
    look.tPitch = THREE.MathUtils.clamp(look.tPitch - e.movementY * k, PITCH_MIN, PITCH_MAX);
    look.yaw = look.tYaw; look.pitch = look.tPitch;
    const ex = e.clientX / window.innerWidth; HUB.edgeTurn = ex < 0.03 ? 1 : ex > 0.97 ? -1 : 0;
  }
  aim.x = 0; aim.y = 0;
});
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (HUB.mode === 'run') {
    if (!aim.mouseMode && !aim.locked) { tryPointerLock(); return; }   // this click grabs the mouse, doesn't shoot
    aim.firing = true; RUN.holdT = 0; shoot(RUN.timeInRun);
  } else if (HUB.mode === 'hub') {
    if (!aim.mouseMode && !aim.locked) { tryPointerLock(); return; }
    practiceShoot(elapsed);   // the mouse only shoots; the world is used with E
  }
});
window.addEventListener('mouseup', e => { if (e.button === 0) aim.firing = false; });
canvas.addEventListener('wheel', e => { if (PANEL.kind || PAUSE.on || !inWorld()) return; e.preventDefault(); const owned = WEAPONS.map((w, i) => i + 1).filter(n => D.weaponUnlocked(WEAPONS[n - 1].id)); if (owned.length < 2) return; const cur = WEAPONS.findIndex(w => w.id === S.party.weapon) + 1; let i = owned.indexOf(cur); i = (i + (e.deltaY > 0 ? 1 : -1) + owned.length) % owned.length; equipWeapon(owned[i]); }, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (e.code === 'Escape') { if (!$('how-to').hidden) { $('how-to').hidden = true; } else if (PANEL.kind) closePanel(); else if (HUB.mode === 'runover') closeRunOver(); else if (PAUSE.on) resumeGame(); else if (aim.mouseMode && inWorld()) setPaused(true); return; }   // captured mode: the browser itself drops the lock and pointerlockchange pauses
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (PAUSE.on || HUB.mode === 'runover') { if (HUB.mode === 'runover' && (e.code === 'Enter' || e.code === 'KeyE')) closeRunOver(); else if (HUB.mode === 'runover' && e.code === 'KeyR' && !$('btn-runover-again').hidden) $('btn-runover-again').click(); return; }
  HUB.keys[e.code] = true;
  if (e.code === 'KeyE' && !e.repeat) { if (HUB.mode === 'hub') { if (!holdStart()) interact(); e.preventDefault(); } }
  if (e.code === 'Space' && !e.repeat) { if (HUB.mode === 'hub') { jump(); e.preventDefault(); } }
  { const n = parseInt(e.key, 10); if (n >= 1 && n <= WEAPONS.length && (HUB.mode === 'hub' || HUB.mode === 'run')) equipWeapon(n); }
  if (e.code === 'KeyM') { S.perm.muted = !S.perm.muted; applyMusicVolume(); saveGame(); toast(S.perm.muted ? 'Muted' : 'Sound on'); }
  if (e.code === 'KeyR' && HUB.mode === 'run') manualReload();
  if (HUB.mode === 'run') {
    if (e.code === 'KeyQ') confettiBurst(RUN.timeInRun);
  }
});
window.addEventListener('keyup', e => { HUB.keys[e.code] = false; if (e.code === 'KeyE') holdStop(); });
window.addEventListener('blur', () => { HUB.keys = {}; });
// touch: tap to shoot at the tap point during a Run; tap a station prompt in the hub
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0]; if (!t) return;
  if (HUB.mode === 'run') { e.preventDefault(); setMouseMode(true); aim.x = (t.clientX / window.innerWidth) * 2 - 1; aim.y = -(t.clientY / window.innerHeight) * 2 + 1; shoot(RUN.timeInRun); aim.x = 0; aim.y = 0; }
  else if (HUB.mode === 'hub') { setMouseMode(true); if (HUB.near && HUB.near.id === 'firing' && !stationLocked(HUB.near)) HUB.near.open(); else interact(); }
}, { passive: false });

// ---- gamepad: left stick walks, right stick looks, RT shoots, A uses (hold for the firing line), X reloads, Y hops, bumpers switch weapons, Start pauses, B closes ----
const PAD = { prev: {}, seen: false, x: 0, y: 0 };
function pollGamepad(dt) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const g of pads) if (g && g.connected) { gp = g; break; }
  if (!gp) { PAD.x = PAD.y = 0; return; }
  if (!PAD.seen) { PAD.seen = true; toast(LANG.cur === 'es' ? 'Mando detectado: stick izq. camina · stick der. mira · RT dispara · A usa · X recarga · Y salta' : 'Gamepad detected: left stick walks · right stick looks · RT shoots · A uses · X reloads · Y hops', 5000); }
  const dz = v => Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82;
  const ax = gp.axes; PAD.x = dz(ax[0] || 0); PAD.y = dz(ax[1] || 0);
  const rx = dz(ax[2] || 0), ry = dz(ax[3] || 0); const sens = 2.6 * (0.6 + sensV());
  if (inWorld() && !PAUSE.on && !PANEL.kind && (rx || ry)) { look.tYaw = THREE.MathUtils.clamp(look.tYaw - rx * Math.abs(rx) * sens * dt, -yawLimit(), yawLimit()); look.tPitch = THREE.MathUtils.clamp(look.tPitch - ry * Math.abs(ry) * sens * 0.8 * dt, PITCH_MIN, PITCH_MAX); look.yaw = look.tYaw; look.pitch = look.tPitch; }
  const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5)); const was = PAD.prev; const now = {};
  [0, 1, 2, 3, 4, 5, 7, 9].forEach(i => now[i] = b(i));
  const pressed = i => now[i] && !was[i], released = i => !now[i] && was[i];
  if (pressed(9)) { if (PAUSE.on) resumeGame(); else if (PANEL.kind) closePanel(); else if (HUB.mode === 'runover') closeRunOver(); else if (inWorld()) setPaused(true); }
  if (pressed(1)) { if (PANEL.kind) closePanel(); else if (HUB.mode === 'runover') closeRunOver(); else if (PAUSE.on) resumeGame(); }
  if (!PAUSE.on && !PANEL.kind) {
    if (HUB.mode === 'run') { if (now[7]) { if (!was[7]) { aim.firing = true; RUN.holdT = 0; } shoot(RUN.timeInRun); } else if (released(7)) aim.firing = false; if (pressed(2)) manualReload(); if (pressed(0)) confettiBurst(RUN.timeInRun); }
    else if (HUB.mode === 'hub') { if (pressed(0)) { if (!holdStart()) interact(); } if (released(0)) holdStop(); if (pressed(3)) jump(); if (now[7] && !was[7]) practiceShoot(elapsed); }
    else if (HUB.mode === 'runover' && pressed(0)) closeRunOver();
    if (pressed(4) || pressed(5)) { const owned = WEAPONS.map((w, i) => i + 1).filter(n => D.weaponUnlocked(WEAPONS[n - 1].id)); if (owned.length > 1 && inWorld()) { const cur = WEAPONS.findIndex(w => w.id === S.party.weapon) + 1; let i = owned.indexOf(cur); i = (i + (pressed(5) ? 1 : -1) + owned.length) % owned.length; equipWeapon(owned[i]); } }
  } else if (PAUSE.on && pressed(0)) resumeGame();
  PAD.prev = now;
}
// ---- main loop ----
const clock = new THREE.Clock(); let elapsed = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()); elapsed += dt;
  pollGamepad(dt);
  if (aim.mouseMode && HUB.mode === 'hub' && HUB.edgeTurn) { look.tYaw += HUB.edgeTurn * dt * 2.4; look.yaw = look.tYaw; }
  camera.rotation.set(look.pitch, look.yaw, 0, 'YXZ');
  if (PAUSE.on) { renderer.render(scene, camera); return; }   // paused: the Backyard holds still
  // juice: a few frames of hit-stop on a Sweet Hit, and a shake that decays
  if (JUICE.hitStop > 0) { JUICE.hitStop -= dt; renderer.render(scene, camera); return; }
  if (JUICE.shake > 0) { const k = JUICE.shake * 0.02; camera.rotation.x += (Math.random() - 0.5) * k; camera.rotation.y += (Math.random() - 0.5) * k; camera.rotation.z += (Math.random() - 0.5) * k * 0.5; JUICE.shake = Math.max(0, JUICE.shake - dt * 3); }
  updateParticles(dt); updateTutorial(dt, elapsed);
  if (HUB.mode === 'run') { updateGun(dt, elapsed, false); updateRun(dt, elapsed); updateBacker(dt, elapsed); }
  else {
    if (HUB.mode === 'hub' || HUB.mode === 'panel' || HUB.mode === 'title' || HUB.mode === 'runover') updateHub(dt, elapsed);
    if (HUB.mode === 'hub') updateReticle(dt, elapsed);
    updateGun(dt, elapsed, HUB.moving);
    for (let i = pinatas.length - 1; i >= 0; i--) pinatas[i].update(dt, elapsed);
  }
  renderer.render(scene, camera);
}

// ---- boot ----
function boot() {
  const had = loadGame();
  if (!had) applyStartOfPartyCharms();
  boot.refreshTitle = () => { const has = S.party.runCount > 0 || S.perm.party > 1 || S.party.candy > 0 || D.nodesPurchased() > 0; $('continue-line').textContent = has ? (LANG.cur === 'es' ? glossES(`Partida guardada: Party ${S.perm.party}, Tier ${D.tier()}, ${fmt(S.party.candy)} Candy, ${S.perm.keepsakes} Keepsakes.`) : `Saved game: Party ${S.perm.party}, Tier ${D.tier()}, ${fmt(S.party.candy)} Candy, ${S.perm.keepsakes} Keepsakes.`) : ''; $('btn-start').textContent = T(has ? 'Continue the party' : 'Start the party'); $('wipe-confirm').hidden = true; };
  LANG.cur = S.perm.lang || ((navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en'); applyLang(); $('set-lang').value = LANG.cur; $('lang-label').textContent = LANG.cur === 'es' ? 'English' : 'Español';
  boot.refreshTitle();
  S.perm.aimMode = 'lock';   // free look was removed as an option; old saves that had it on come back to captured mouse
  growBackyard(1); for (let i = 0; i < 6; i++) spawnHanging();
  buildGun(D.weapon()); setReticle(D.weapon());
  HUB.pos.set(0, 0, 4.6); camera.position.set(0, EYE, 4.6);
  refreshSigns(); objective = null; marker.visible = false;
  $('loading').remove();
  document.body.classList.add('menu');
  frame();
}
$('btn-start').onclick = () => {
  beep(660, 0.05, 'triangle', 0.01); startMusic(); setMusicMode('hub');
  if (S.party.runCount === 0 && !S.party.tabs.length) arriveTabsIfDue();
  enterHub();
  if (S.party.runCount === 0) backerSay('Enjoy it, mijo. We talk after.', 5);
  tutStart();
};
$('btn-wipe').onclick = () => { $('wipe-confirm').hidden = false; };
$('btn-wipe-no').onclick = () => { $('wipe-confirm').hidden = true; };
$('btn-wipe-yes').onclick = () => { if (!confirm('Last chance — erase every Party, Charm and Keepsake?')) return; wipeSave(); applyStartOfPartyCharms(); location.reload(); };
$('btn-title-settings').onclick = () => { setPaused(true); $('settings').hidden = false; document.querySelector('.pause-menu').hidden = true; };

boot();
