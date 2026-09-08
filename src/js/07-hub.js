// ---------- THE HUB: walking the Backyard between Runs ----------
// Stations are physical things in the yard. Walk up (WASD), press E. Signs above them carry the
// notifications; a golden marker bobs over whatever the game suggests you do next.
const HUB = { mode: 'title', pos: new THREE.Vector3(0, 0, 4.6), keys: {}, moving: false, near: null, bob: 0, stepT: 0, sprint: false, y: 0, vy: 0, ground: 0 };
const STATIONS = [];
const stationById = {};
function addStation(st) {
  STATIONS.push(st); stationById[st.id] = st; st.group = new THREE.Group(); st.group.position.copy(st.pos); yard.add(st.group); st.build(st.group); st.signKey = '';
  // floor marker: a glowing ring where you stand to use the station
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 });
  st.ring = new THREE.Mesh(new THREE.RingGeometry(st.radius * 0.42, st.radius * 0.5, 40), ringMat); st.ring.rotation.x = -Math.PI / 2; st.ring.position.set(st.pos.x, 0.02, st.pos.z); st.ring.receiveShadow = false; yard.add(st.ring);
  st.ringInner = new THREE.Mesh(new THREE.CircleGeometry(st.radius * 0.42, 40), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.08 })); st.ringInner.rotation.x = -Math.PI / 2; st.ringInner.position.set(st.pos.x, 0.015, st.pos.z); yard.add(st.ringInner);
  return st;
}
// Gating: the Backyard opens up over the first Runs (§ onboarding). Returns null when open, else a reason.
function stationLocked(st) {
  const p = S.party, n = p.runCount;
  if (st.id === 'tree' && n < 1) return 'Opens after Run 1';
  if (st.id === 'weapons' && n < 2) return 'Opens after Run 2';
  if (st.id === 'charms' && n < 3 && S.perm.keepsakes === 0) return 'Opens after Run 3';
  if (st.id === 'partyover' && n < 3) return 'Opens after Run 3';
  return null;
}

// ---- The Mailbox post ----
addStation({
  id: 'mailbox', name: 'The Mailbox', pos: new THREE.Vector3(3.4, 0, 1.0), radius: 2.4, signY: 2.5, facing: Math.PI / 2,
  build(g) {
    g.add(cyl(0.06, 0.08, 1.15, new THREE.MeshStandardMaterial({ map: woodTex, color: 0xa0704a }), 0, 0.57, 0));
    const bodyMat = flatMat(0x2a6fdb, { metalness: 0.3, roughness: 0.5 });
    g.add(box(0.36, 0.3, 0.6, bodyMat, 0, 1.3, 0)); const top = cyl(0.18, 0.18, 0.6, bodyMat, 0, 1.45, 0, 16); top.rotation.x = Math.PI / 2; g.add(top);
    const door = box(0.34, 0.3, 0.03, flatMat(0x1d54a8), 0, 1.3, 0.3); g.add(door); const doorTop = cyl(0.17, 0.17, 0.03, flatMat(0x1d54a8), 0, 1.45, 0.3, 16); doorTop.rotation.x = Math.PI / 2; g.add(doorTop);
    g.add(sphere(0.03, flatMat(0xffd23f, { metalness: 0.7 }), 0, 1.3, 0.33, 8));
    this.flag = new THREE.Group(); this.flag.add(box(0.04, 0.22, 0.12, flatMat(0xe63946), 0, 0.11, 0)); this.flag.position.set(0.2, 1.35, -0.1); this.flag.rotation.z = Math.PI / 2; g.add(this.flag);
    const tagT = canvasTex('mailtag', 128, 64, c => { c.fillStyle = '#fff4e0'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#3a2418'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.fillText('TABS', 64, 42); });
    g.add(box(0.5, 0.24, 0.03, new THREE.MeshStandardMaterial({ map: tagT }), 0, 0.85, 0.06));
    // a little pile of envelopes at the foot
    for (let i = 0; i < 3; i++) g.add(box(0.28, 0.02, 0.18, flatMat(i % 2 ? 0xfff4e0 : 0xffe9c4), 0.25 + i * 0.05, 0.02 + i * 0.022, 0.2 - i * 0.04));
    g.rotation.y = this.facing; blockCircle(this.pos.x, this.pos.z, 0.45);
  },
  update(dt, t) { const p = S.party; const up = p.tabs.some(x => p.tabsArrivedThisRun.includes(x)) || D.overdueCount() > 0; const target = up ? 0 : Math.PI / 2; this.flag.rotation.z += (target - this.flag.rotation.z) * Math.min(1, dt * 6); },
  sign() { const p = S.party, od = D.overdueCount(); const lines = [{ text: 'The Mailbox' }]; if (p.tabs.length) lines.push({ text: `${p.tabs.length} Tab${p.tabs.length === 1 ? '' : 's'} open`, color: '#ffd23f' }); if (od) lines.push({ text: `${od} OVERDUE · Backer takes ${D.cutPct()}%`, color: '#ff8a8a' }); const pay = p.tabs.filter(x => p.candy >= x.amount).length; if (pay) lines.push({ text: `You can pay ${pay} now`, color: '#7bd389' }); return lines; },
  prompt() { return 'Open the Mailbox'; },
  open() { S.party.mailSeenRun = S.party.runCount; openPanel('mailbox'); },
});

// ---- The Candy Tree (the Skill Tree) ----
// The chalkboard leaning on the trunk, drawn in the current language.
function treeSignTex() {
  return canvasTex('treesign_' + LANG.cur, 256, 200, c => {
    c.fillStyle = '#2f3b2f'; c.fillRect(0, 0, 256, 200); c.fillStyle = '#fff'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center';
    if (LANG.cur === 'es') { c.fillText('ÁRBOL', 128, 78); c.fillText('DE DULCES', 128, 124); c.font = '19px sans-serif'; c.fillText('Dulces entran, mejoras salen', 128, 170); }
    else { c.fillText('SKILL', 128, 80); c.fillText('TREE', 128, 130); c.font = '22px sans-serif'; c.fillText('candy in, skills out', 128, 172); }
  });
}
function updateTreeSign() { const m = stationById.tree && stationById.tree.signMat; if (m) { m.map = treeSignTex(); m.needsUpdate = true; } }
addStation({
  id: 'tree', name: 'The Candy Tree', pos: new THREE.Vector3(-5.6, 0, -1.6), radius: 2.9, signY: 5.4,
  build(g) {
    g.add(cyl(0.28, 0.42, 2.2, new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8d6a45 }), 0, 1.1, 0));
    [[0, 3.1, 0, 1.6, 0xff9ecb], [1.1, 2.7, 0.4, 1.15, 0x8fe3d8], [-1.05, 2.8, -0.3, 1.1, 0xffe38a], [0.3, 4.1, -0.2, 1.05, 0xc9b3ef], [-0.5, 2.4, 0.9, 0.85, 0xffb27d]].forEach(([x, y, z, r, c]) => g.add(sphere(r, flatMat(c, { roughness: 0.7 }), x, y, z, 14)));
    // lollipops
    for (let i = 0; i < 5; i++) { const a = i * 1.26; const x = Math.cos(a) * 1.6, z = Math.sin(a) * 1.2, y = 2.6 + (i % 2) * 0.7; g.add(cyl(0.015, 0.015, 0.5, flatMat(0xffffff), x, y - 0.25, z)); const lp = cyl(0.14, 0.14, 0.05, new THREE.MeshStandardMaterial({ map: stripeTexture([0xff5ea8, 0x2ec4b6, 0xffd23f][i % 3], 0xffffff) }), x, y, z, 16); lp.rotation.x = Math.PI / 2; g.add(lp); }
    // ornaments: one per Skill Tree Node, lit when owned
    this.orn = []; const all = BRANCHES.flatMap(b => b.nodes);
    all.forEach((n, i) => { const a = i / all.length * Math.PI * 2, r = 1.3 + (i % 3) * 0.35, y = 2.2 + ((i * 7) % 5) * 0.45; const bcol = BRANCHES.find(b => b.id === n.branch).color; const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshStandardMaterial({ color: bcol, emissive: bcol, emissiveIntensity: 0 })); m.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.8); m.userData.node = n.id; g.add(m); this.orn.push(m); g.add(cyl(0.005, 0.005, 0.2, flatMat(0xffffff), m.position.x, y + 0.15, m.position.z, 4)); });
    // a chalkboard sign leaning on the trunk
    const board = new THREE.Group(); board.add(box(0.9, 0.7, 0.05, flatMat(0x2f3b2f), 0, 0.9, 0)); board.add(box(0.98, 0.78, 0.03, new THREE.MeshStandardMaterial({ map: woodTex, color: 0xb07a4c }), 0, 0.9, -0.02));
    const signMat = new THREE.MeshStandardMaterial({ map: treeSignTex() }); this.signMat = signMat;
    board.add(box(0.86, 0.66, 0.02, signMat, 0, 0.9, 0.03)); board.position.set(0.9, 0, 1.1); board.rotation.y = -0.5; board.rotation.x = -0.15; g.add(board);
    blockCircle(this.pos.x, this.pos.z, 0.7);
  },
  update(dt, t) { this.orn.forEach((m, i) => { const on = rank(m.userData.node) > 0; const target = on ? 0.9 + Math.sin(t * 3 + i) * 0.3 : 0; m.material.emissiveIntensity += (target - m.material.emissiveIntensity) * Math.min(1, dt * 4); }); },
  sign() { const all = BRANCHES.flatMap(b => b.nodes); const can = all.filter(n => nodeState(n) === 'can').length; const lines = [{ text: 'Skill Tree' }, { text: `${D.nodesPurchased()} Nodes owned`, color: '#c9b3ef' }]; if (can) lines.push({ text: `${can} affordable now`, color: '#7bd389' }); return lines; },
  prompt() { return 'Open the Skill Tree'; },
  open() { openPanel('tree'); },
});

// ---- Weapons table ----
addStation({
  id: 'weapons', name: 'Weapons table', pos: new THREE.Vector3(4.8, 0, -3.0), radius: 2.3, signY: 2.2,
  build(g) {
    yard.add(makeTable(this.pos.x, this.pos.z, 0xffd23f, 3.0, 1.0));
    this.models = {}; this.rings = {};
    WEAPONS.forEach((w, i) => { const m = buildGunModel(w, true); m.scale.setScalar(0.6); m.position.set(-1.1 + i * 0.55, 0.9, 0); m.rotation.y = Math.PI / 2 + 0.2; g.add(m); this.models[w.id] = m; const ring = torus(0.2, 0.02, new THREE.MeshStandardMaterial({ color: 0xff5ea8, emissive: 0xff5ea8, emissiveIntensity: 0.8 }), m.position.x, 0.83, 0); ring.rotation.x = Math.PI / 2; g.add(ring); this.rings[w.id] = ring; });
    // ammo crate under the table
    g.add(box(0.6, 0.4, 0.4, new THREE.MeshStandardMaterial({ map: woodTex, color: 0xc9a071 }), 0.7, 0.2, 0.1)); g.add(box(0.62, 0.06, 0.1, flatMat(0x3a2418), 0.7, 0.2, 0.1));
  },
  update(dt, t) { WEAPONS.forEach(w => { const m = this.models[w.id]; const un = D.weaponUnlocked(w.id); m.traverse(o => { if (o.isMesh && !o.userData.origMat) o.userData.origMat = o.material; if (o.isMesh) o.material = un ? o.userData.origMat : lockedMat; }); const sel = S.party.weapon === w.id; this.rings[w.id].visible = sel; m.position.y = 0.9 + (sel ? 0.08 + Math.sin(t * 2) * 0.02 : 0); if (sel) m.rotation.y += dt * 0.6; }); },
  sign() { const lines = [{ text: 'Weapons' }, { text: T(D.weapon().name), color: '#8fe3d8' }]; const sale = WEAPONS.filter(w => weaponOnSale(w)); if (sale.length) { const w = sale[0]; lines.push({ text: `${w.name} · ${fmt(w.price)} Candy${S.party.candy >= w.price ? ' — affordable!' : ''}`, color: S.party.candy >= w.price ? '#7bd389' : '#ffd23f', size: 34 }); } return lines; },
  prompt() { return 'Browse weapons'; },
  open() { openPanel('weapons'); },
});
const lockedMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9, transparent: true, opacity: 0.45 });

// ---- Keepsakes gift table (Charms) ----
addStation({
  id: 'charms', name: 'Keepsakes table', pos: new THREE.Vector3(-4.6, 0, -3.4), radius: 2.3, signY: 2.2,
  build(g) {
    yard.add(makeTable(this.pos.x, this.pos.z, 0xff5ea8, 2.0, 1.0));
    const gift = (x, z, s, c1, c2) => { const gg = new THREE.Group(); gg.add(box(s, s * 0.8, s, flatMat(c1), 0, s * 0.4, 0)); gg.add(box(s * 1.04, s * 0.2, s * 0.22, flatMat(c2), 0, s * 0.4, 0)); gg.add(box(s * 0.22, s * 0.2, s * 1.04, flatMat(c2), 0, s * 0.4, 0)); gg.add(torus(s * 0.12, s * 0.04, flatMat(c2), 0, s * 0.85, 0)); gg.position.set(x, 0.81, z); return gg; };
    g.add(gift(-0.6, 0.1, 0.36, 0x7b5ea7, 0xffd23f)); g.add(gift(0.05, -0.15, 0.28, 0x2ec4b6, 0xff5ea8)); g.add(gift(0.55, 0.15, 0.32, 0xffd23f, 0xe63946));
    // jewelry stand with rings
    g.add(cone(0.12, 0.5, flatMat(0xf6efdc), 0.85, 1.06, -0.2, 10)); [0.95, 1.1, 1.22].forEach((y, i) => { const r = torus(0.08 - i * 0.015, 0.015, flatMat([0xffd23f, 0xff5ea8, 0x2ec4b6][i], { metalness: 0.7 }), 0.85, y, -0.2); r.rotation.x = Math.PI / 2; g.add(r); });
    this.glow = new THREE.PointLight(0xc9b3ef, 0, 4); this.glow.position.set(0, 1.4, 0); g.add(this.glow);
  },
  update(dt, t) { const can = CHARMS.some(c => charm(c.id) < c.max && S.perm.keepsakes >= c.cost); this.glow.intensity = can ? 0.8 + Math.sin(t * 3) * 0.3 : 0; },
  sign() { const lines = [{ text: 'Charms' }, { text: `${S.perm.keepsakes} Keepsakes`, color: '#c9b3ef' }]; const can = CHARMS.filter(c => charm(c.id) < c.max && S.perm.keepsakes >= c.cost).length; if (can) lines.push({ text: `${can} Charm${can === 1 ? '' : 's'} affordable`, color: '#7bd389' }); return lines; },
  prompt() { return 'Browse the Charms'; },
  open() { openPanel('charms'); },
});

// ---- Porch light switch (Party's Over) ----
addStation({
  id: 'partyover', name: "Porch light", pos: new THREE.Vector3(window.HOUSE_SWITCH.x - 1.1, 0, window.HOUSE_SWITCH.z), radius: 2.2, signY: 2.6,
  build(g) { /* the switch itself is part of the house */ },
  update() {},
  sign() { return [{ text: "Party's Over" }, { text: 'flip the porch light', color: '#ffb3b3', size: 34 }]; },
  prompt() { return "Call Party's Over"; },
  open() { openPanel('partyover'); },
});

// ---- The firing line ----
addStation({
  id: 'firing', name: 'The firing line', pos: new THREE.Vector3(FIRING_LINE.x, 0, FIRING_LINE.z), radius: 1.8, signY: 2.0,
  build(g) { this.arrow = cone(0.11, 0.26, new THREE.MeshStandardMaterial({ color: 0x2ec4b6, emissive: 0x2ec4b6, emissiveIntensity: 0.5 }), 0, 1.0, 0); this.arrow.rotation.x = Math.PI; g.add(this.arrow); },
  update(dt, t) { this.arrow.position.y = 0.95 + Math.sin(t * 3) * 0.08; this.arrow.rotation.y += dt; this.arrow.visible = HUB.mode !== 'run'; },
  sign() { const p = S.party; if (D.centerpieceDue()) return [{ text: 'The Centerpiece', color: '#ffd23f' }, { text: 'stand here to face it', size: 34 }]; if (p.bossDue && !p.centerpieceBroken) return [{ text: 'Tier ' + p.bossDue + ' Boss', color: '#ff8a8a' }, { text: bossName(p.bossDue) + ' is waiting', size: 34 }]; const lines = [{ text: `Run ${p.runCount + 1}` }, { text: `Mag ${D.magCapacity()} · ${D.weapon().name}`, color: '#8fe3d8', size: 34 }]; if (D.tier() >= BAL.launcher_from_tier || p.runCount >= 5) lines.push({ text: 'The launcher is loaded', color: '#ffd23f', size: 34 }); return lines; },
  prompt() { const p = S.party; return D.centerpieceDue() ? 'Face The Centerpiece' : p.bossDue ? 'Face ' + bossName(p.bossDue) : `Start Run ${p.runCount + 1}`; },
  open() { startRun({}); },
});

// ---- Tía Chelo, the Backer ----
const BACKER = { group: null, bucket: null, bubble: null, bubbleUntil: 0, state: 'relaxed', target: new THREE.Vector3(), targetRot: 0 };
const CHELO_RELAX = new THREE.Vector3(-3.6, 0, -7.6), CHELO_COLLECT = new THREE.Vector3(-4.4, 0, -2.6);   // collecting spot is inside the view from the firing line
(function buildBacker() {
  const g = new THREE.Group();
  const skin = flatMat(0xd9a071), dressMat = new THREE.MeshStandardMaterial({ map: polkaTexture(0x7b5ea7, 0xffd23f), roughness: 0.9 }); BACKER.skinMat = skin; BACKER.dressMat = dressMat;
  const dress = cone(0.42, 1.15, dressMat, 0, 0.58, 0, 16); g.add(dress);
  g.add(sphere(0.3, dressMat, 0, 1.22, 0, 14)); g.add(box(0.44, 0.1, 0.3, flatMat(0xffd23f), 0, 1.02, 0)); // torso + belt
  const head = new THREE.Group(); head.position.set(0, 1.68, 0); g.add(head); BACKER.head = head;
  const hairMat = flatMat(0x5b4a4a); BACKER.hairMat = hairMat;
  head.add(sphere(0.2, skin, 0, 0, 0, 14)); head.add(sphere(0.14, hairMat, 0, 0.18, -0.08, 10)); head.add(sphere(0.21, hairMat, 0, 0.06, -0.06, 12));
  BACKER.eyes = [];
  [[-0.08], [0.08]].forEach(([x]) => { const r = torus(0.055, 0.008, flatMat(0x3a2418), x, 0, 0.19); head.add(r); head.add(sphere(0.02, flatMat(0x1a1020), x, 0, 0.2, 6)); const glow = sphere(0.032, new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 2 }), x, 0, 0.2, 8); glow.visible = false; head.add(glow); BACKER.eyes.push(glow); });
  head.add(box(0.14, 0.02, 0.01, flatMat(0x3a2418), 0, 0, 0.19));
  const smile = sphere(0.03, flatMat(0xe63946), 0, -0.08, 0.2, 6); head.add(smile); BACKER.smile = smile;   // lipstick smile-dot
  const maw = box(0.16, 0.09, 0.03, flatMat(0x050505), 0, -0.09, 0.2); maw.visible = false; head.add(maw); BACKER.maw = maw;   // the other smile
  const teeth = box(0.14, 0.02, 0.01, flatMat(0xfff4e0), 0, -0.06, 0.215); teeth.visible = false; head.add(teeth); BACKER.teeth = teeth;
  BACKER.dreadLight = new THREE.PointLight(0xff2020, 0, 4); BACKER.dreadLight.position.set(0, 1.7, 0.4); g.add(BACKER.dreadLight);
  const flower = sphere(0.05, flatMat(0xff5ea8), 0.16, 0.14, 0.05, 6); head.add(flower); BACKER.flower = flower; // flower in the hair
  // arms hang from the shoulders (pivot groups), hands at the wrist
  const makeArm = (side) => { const a = new THREE.Group(); a.add(sphere(0.07, dressMat, 0, 0, 0, 8)); a.add(cyl(0.05, 0.045, 0.58, skin, 0, -0.3, 0)); a.add(sphere(0.06, skin, 0, -0.6, 0, 8)); a.position.set(side * 0.3, 1.42, 0.02); a.rotation.z = -side * 0.28; return a; };
  const armL = makeArm(-1), armR = makeArm(1); g.add(armL); g.add(armR); BACKER.armL = armL; BACKER.armR = armR;
  [[-0.12], [0.12]].forEach(([x]) => g.add(box(0.14, 0.06, 0.26, flatMat(0xe63946), x, 0.03, 0.06)));
  // bucket (shown while collecting)
  const bucket = new THREE.Group(); bucket.add(cyl(0.2, 0.15, 0.32, flatMat(0xbfbfbf, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, 14)); const handle = torus(0.18, 0.012, flatMat(0x888), 0, 0.14, 0); bucket.add(handle);
  const fill = cyl(0.17, 0.17, 0.02, new THREE.MeshStandardMaterial({ map: polkaTexture(0xff5ea8, 0xffd23f) }), 0, 0.12, 0, 14); bucket.add(fill);
  bucket.position.set(0, -0.78, 0); BACKER.armR.add(bucket); BACKER.bucket = bucket;
  // lemonade (shown while relaxed)
  const drink = new THREE.Group(); drink.add(cyl(0.05, 0.04, 0.16, new THREE.MeshStandardMaterial({ color: 0xffe28a, transparent: true, opacity: 0.85 }), 0, 0, 0, 10)); drink.add(cyl(0.005, 0.005, 0.22, flatMat(0xff5ea8), 0.02, 0.1, 0, 4)); drink.position.set(0, -0.62, 0.06); BACKER.armL.add(drink); BACKER.drink = drink;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.position.copy(CHELO_RELAX); g.rotation.y = 0.3;
  yard.add(g); BACKER.group = g;
  // lawn chair + side table at the relaxing spot
  const ch = new THREE.Group(); ch.add(box(0.7, 0.05, 0.6, new THREE.MeshStandardMaterial({ map: stripeTexture(0x2ec4b6, 0xffffff) }), 0, 0.45, 0)); ch.add(box(0.7, 0.75, 0.05, new THREE.MeshStandardMaterial({ map: stripeTexture(0x2ec4b6, 0xffffff) }), 0, 0.8, -0.3)); [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]].forEach(([a, b]) => ch.add(box(0.04, 0.45, 0.04, flatMat(0xeee), a, 0.22, b))); ch.position.set(CHELO_RELAX.x + 0.9, 0, CHELO_RELAX.z - 0.2); ch.rotation.y = 0.4; yard.add(ch);
  const st = new THREE.Group(); st.add(cyl(0.3, 0.3, 0.04, flatMat(0xffffff), 0, 0.55, 0, 14)); st.add(cyl(0.03, 0.03, 0.55, flatMat(0xffffff), 0, 0.27, 0)); st.add(cyl(0.1, 0.09, 0.2, flatMat(0xffe28a), 0.1, 0.67, 0, 10)); st.position.set(CHELO_RELAX.x - 0.8, 0, CHELO_RELAX.z - 0.1); yard.add(st);
  blockCircle(CHELO_RELAX.x, CHELO_RELAX.z, 1.05);   // 1.4 cerraba el paso entre ella y la piscina
})();
addStation({
  id: 'chelo', name: 'Tía Chelo', pos: CHELO_RELAX.clone(), radius: 2.1, signY: 3.0,
  build(g) { /* she is her own model; the station follows her */ },
  update(dt, t) { if (!BACKER.group) return; this.pos.copy(BACKER.group.position); this.pos.y = 0; this.group.position.copy(this.pos); this.ring.position.set(this.pos.x, 0.02, this.pos.z); this.ringInner.position.set(this.pos.x, 0.015, this.pos.z); },
  sign() { const od = D.overdueCount(); return od ? [{ text: 'Tía Chelo', color: '#ff8a8a' }, { text: 'has words for you', color: '#ff8a8a', size: 34 }] : [{ text: 'Tía Chelo' }, { text: (S.perm.lore || 0) < LORE.length ? 'has a story · E to talk' : 'E to talk', color: '#c9b3ef', size: 34 }]; },
  prompt() { return 'Talk to Tía Chelo'; },
  open() { S.party.cheloTopic = null; openPanel('chelo'); },
});
function backerSay(text, secs, color) {
  text = T(text);
  if (BACKER.bubble) { BACKER.group.remove(BACKER.bubble); BACKER.bubble = null; }
  BACKER.bubble = makeLabelSprite([{ text, color: color || '#3a2418' }], { bg: 'rgba(255,244,224,.96)', border: '#7b5ea7', size: 40, scale: 0.005 });
  BACKER.bubble.position.set(0, 2.45, 0); BACKER.group.add(BACKER.bubble); BACKER.bubbleUntil = performance.now() / 1000 + (secs || 4);
}
function backerSetState(st) {
  if (BACKER.state === st) return; BACKER.state = st;
  BACKER.bucket.visible = st === 'collecting'; BACKER.drink.visible = st !== 'collecting';
  if (st === 'collecting') backerSay(`${D.cutPct()}% handling fee, mijo.`, 5, '#e63946'); else if (BACKER.stateEver) backerSay('Gracias. I knew you were good for it.', 4);
  BACKER.stateEver = true; setDread(st === 'collecting');
}
// ---- the other Tía Chelo: while a Tab is overdue the party goes dim and she is not quite herself ----
const DREAD = { on: false, k: 0, hum: null, humGain: null, lfo: null };
function setDread(on) {
  if (DREAD.on === on) return; DREAD.on = on;
  const b = BACKER;
  b.skinMat.color.setHex(on ? 0xcfd6d8 : 0xd9a071); b.hairMat.color.setHex(on ? 0x111111 : 0x5b4a4a);
  b.eyes.forEach(e => e.visible = on); b.smile.visible = !on; b.maw.visible = on; b.teeth.visible = on; b.flower.material.color.setHex(on ? 0x2a0a0a : 0xff5ea8);
  b.dressMat.color.setHex(on ? 0x6a6a7a : 0xffffff);
  if (on) startHum(); else stopHum();
  if (on) backerSay('You know how this ends, mijo.', 5, '#e63946');
}
function startHum() {
  if (S.perm.muted) return;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)(); const c = AUDIO.ctx; if (c.state === 'suspended') c.resume();
    const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = 41; o2.type = 'sine'; o2.frequency.value = 55.5; f.type = 'lowpass'; f.frequency.value = 160; g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.045, c.currentTime + 2.5);
    lfo.frequency.value = 0.18; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(c.destination); o.start(); o2.start(); lfo.start();
    DREAD.hum = [o, o2, lfo]; DREAD.humGain = g;
  } catch (e) {}
}
function stopHum() {
  if (!DREAD.humGain) return; try { const c = AUDIO.ctx; DREAD.humGain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2); const hs = DREAD.hum; setTimeout(() => hs.forEach(o => { try { o.stop(); } catch (e) {} }), 1400); } catch (e) {}
  DREAD.hum = null; DREAD.humGain = null;
}
function updateDread(dt, t) {
  const target = DREAD.on ? 1 : 0; DREAD.k += (target - DREAD.k) * Math.min(1, dt * 0.8); const k = DREAD.k;
  sun.intensity = 1.05 - 0.75 * k; hemi.intensity = 0.55 - 0.38 * k;
  scene.background.setHex(0x8ccbf2).lerp(new THREE.Color(0x2a1e3a), k); scene.fog.color.setHex(0xa9d8f5).lerp(new THREE.Color(0x1a1224), k); scene.fog.near = 40 - 25 * k; scene.fog.far = 110 - 60 * k;
  if (window.PORCH_LIGHT) { window.PORCH_LIGHT.color.setHex(0xffd27a).lerp(new THREE.Color(0xff2020), k); window.PORCH_LIGHT.intensity = 0.7 + k * (0.6 + Math.sin(t * 23) * 0.4 * (Math.random() < 0.1 ? 1 : 0.2)); }
  BACKER.dreadLight.intensity = k * (0.9 + Math.sin(t * 9) * 0.3);
  if (BACKER.head) { BACKER.head.rotation.z = k * (Math.sin(t * 0.7) * 0.35 + (Math.random() < 0.02 ? (Math.random() - 0.5) * 0.6 : 0)); BACKER.head.rotation.x = k * 0.15; }
  if (k > 0.5 && HUB.mode === 'hub' && Math.random() < dt * 0.05) backerSay(['I counted every candy, mijo.', 'The guests remember. So do I.', 'Pay. Or the party never ends.', 'Such a lovely house. It would be a shame.', 'Tick. Tock.'][Math.floor(Math.random() * 5)], 4, '#e63946');
}
function backerTakes(amount) {
  const b = new THREE.Vector3(); BACKER.bucket.getWorldPosition(b);
  candyToBucket(b, Math.min(5, 1 + Math.round(amount / 10)));
  BACKER.tally = (BACKER.tally || 0) + amount; backerSay(`−${BACKER.tally} Candy`, 1.6, '#e63946'); SFX.cut();
  clearTimeout(BACKER.tallyT); BACKER.tallyT = setTimeout(() => { BACKER.tally = 0; }, 1800);
}
function updateBacker(dt, t) {
  const collecting = D.overdueCount() > 0; backerSetState(collecting ? 'collecting' : 'relaxed');
  const target = collecting ? CHELO_COLLECT : CHELO_RELAX; const g = BACKER.group;
  const d = target.clone().sub(g.position); d.y = 0;
  if (d.length() > 0.05) { const step = Math.min(d.length(), dt * 1.6); g.position.addScaledVector(d.normalize(), step); g.position.y = Math.abs(Math.sin(t * 9)) * 0.03; g.rotation.y = Math.atan2(d.x, d.z); }
  else { // face the Host
    const toHost = HUB.pos.clone().sub(g.position); const want = Math.atan2(toHost.x, toHost.z); let diff = want - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 3); g.position.y = 0;
  }
  BACKER.armR.rotation.z = collecting ? -0.55 + Math.sin(t * 2) * 0.04 : -0.28; BACKER.armL.rotation.z = collecting ? 0.28 : 0.28; BACKER.armL.rotation.x = collecting ? 0 : -1.2;
  updateCheloArrow(collecting); updateDread(dt, t);
  // outside a Run she says why she is here, and the HUD spells it out: pay a Tab at the Mailbox
  const db = $('debt-banner');
  if (collecting && HUB.mode === 'hub') {
    if (!BACKER.bubble && performance.now() / 1000 > (BACKER.nagAt || 0)) { BACKER.nagAt = performance.now() / 1000 + 7; backerSay(LANG.cur === 'es' ? glossES(`Estoy cobrando, mijo — ${D.cutPct()}%. Paga una Tab en el Buzón.`) : `I'm collecting, mijo — ${D.cutPct()}%. Pay a Tab at the Mailbox.`, 4.5); }
    if (db) { const od = D.overdueCount(); db.innerHTML = `${ico('warn', 18)} <b>${T('Debt due.')}</b> ${od} Tab${od === 1 ? '' : 's'} ${T('overdue — Tía Chelo takes')} <b>${D.cutPct()}%</b> ${T('of every Run. Pay at the')} <b>${es('Mailbox', 'Buzón')}</b>.`; db.classList.add('on'); }
  } else if (db) db.classList.remove('on');
  if (BACKER.bubble) { fitSprite(BACKER.bubble, 2, 14, 0.7, 1.5); if (performance.now() / 1000 > BACKER.bubbleUntil) { g.remove(BACKER.bubble); BACKER.bubble = null; } }
}

// Edge-of-screen pointer so the Backer is never out of mind while she collects
const _cp = new THREE.Vector3();
function updateCheloArrow(collecting) {
  const el = $('chelo-arrow'); if (!el) return;
  if (!collecting || HUB.mode !== 'run') { el.classList.remove('on'); return; }
  BACKER.group.getWorldPosition(_cp); _cp.y += 1.6; _cp.project(camera);
  const onScreen = _cp.z < 1 && Math.abs(_cp.x) < 0.9 && Math.abs(_cp.y) < 0.85;
  if (onScreen) { el.classList.remove('on'); return; }
  const dir = new THREE.Vector3().subVectors(BACKER.group.position, camera.position); const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)); const side = dir.dot(right) < 0 ? 'left' : 'right';
  el.classList.add('on'); el.dataset.side = side; el.innerHTML = side === 'left' ? `◀ Tía Chelo is collecting (${D.cutPct()}%)` : `Tía Chelo is collecting (${D.cutPct()}%) ▶`;
  el.style.left = side === 'left' ? '18px' : 'auto'; el.style.right = side === 'right' ? '18px' : 'auto';
}

// ---- Signs and the objective marker ----
const marker = new THREE.Group();
(function () { const c = cone(0.22, 0.5, new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb000, emissiveIntensity: 0.7 }), 0, 0, 0, 4); c.rotation.x = Math.PI; marker.add(c); const ring = torus(0.3, 0.03, new THREE.MeshBasicMaterial({ color: 0xffd23f }), 0, -0.4, 0); ring.rotation.x = Math.PI / 2; marker.add(ring); yard.add(marker); })();
function refreshSigns() {
  STATIONS.forEach(st => {
    const lock = stationLocked(st); const lines = lock ? [st.sign()[0], { text: 'Locked · ' + lock, color: '#d9ccb6', size: 34 }] : st.sign(); const key = JSON.stringify(lines);
    if (key === st.signKey) return; st.signKey = key;
    if (st.sprite) st.group.remove(st.sprite);
    st.sprite = makeLabelSprite(lines, { size: 40, scale: 0.0048 }); st.sprite.position.set(0, st.signY, 0); st.group.add(st.sprite);
  });
}
function currentObjective() {
  const p = S.party;
  if (D.centerpieceDue()) return { st: 'firing', text: 'Face The Centerpiece at the firing line' };
  if (p.bossDue && !p.centerpieceBroken && !(p.tabs.length && p.tabsArrivedThisRun.length)) return { st: 'firing', text: `Tier ${p.bossDue}: face ${bossName(p.bossDue)} at the firing line — a Keepsake is inside` };
  if (typeof TUT !== 'undefined' && TUT.active && (TUT.step === 'mail' || TUT.step === 'pay')) return { st: 'mailbox', text: 'Open the Mailbox — the Tabs are waiting' };
  if (typeof TUT !== 'undefined' && TUT.active && TUT.step === 'tree' && !stationLocked(stationById.tree)) return { st: 'tree', text: 'Visit the Candy Tree' };
  if (p.tabs.length && (p.mailSeenRun == null || p.mailSeenRun < p.runCount) && p.tabsArrivedThisRun.length) return { st: 'mailbox', text: `Check the Mailbox — ${p.tabsArrivedThisRun.length === 1 ? 'a new Tab' : p.tabsArrivedThisRun.length + ' new Tabs'}` };
  if (p.cleanupTab && !p.cleanupPaid && p.candy >= p.cleanupTab.amount) return { st: 'mailbox', text: 'Pay the Cleanup Tab' };
  const payable = p.tabs.filter(t => p.candy >= t.amount).sort((a, b) => a.dueLeft - b.dueLeft)[0];
  if (payable) return { st: 'mailbox', text: `Pay ${payable.guest}'s Tab (${fmt(payable.amount)} Candy)${payable.dueLeft <= 0 ? ' — it is OVERDUE' : ''}` };
  const buyable = WEAPONS.filter(w => weaponOnSale(w) && p.candy >= w.price && !stationLocked(stationById.weapons));
  if (buyable.length && !p.tabs.some(t => t.dueLeft <= 1)) return { st: 'weapons', text: `You can afford the ${buyable[0].name} (${fmt(buyable[0].price)} Candy)` };
  const soon = p.tabs.slice().sort((a, b) => a.dueLeft - b.dueLeft)[0];
  if (!soon && D.graceRuns() > 0 && !p.centerpieceBroken) return { st: 'firing', text: `Grace Period — ${D.graceRuns()} free Run${D.graceRuns() === 1 ? '' : 's'} before the next Tab. Start Run ${p.runCount + 1}` };
  if (soon) return { st: 'firing', text: `Start Run ${p.runCount + 1} — ${soon.guest}'s Tab ${soon.dueLeft <= 0 ? 'is overdue' : 'due in ' + soon.dueLeft + ' Run' + (soon.dueLeft === 1 ? '' : 's')}, ${fmt(soon.amount - p.candy)} Candy short` };
  return { st: 'firing', text: p.runCount === 0 ? 'Start your first Run at the firing line' : `Start Run ${p.runCount + 1}` };
}
let objective = null;
function refreshObjective() { objective = currentObjective(); const el = $('objective'); if (el) el.innerHTML = `<span class="l">${T('Next')}</span> ${T(objective.text)}`; }
function refreshHub() { refreshSigns(); refreshObjective(); updateHubHUD(); }
function updateHubHUD() {
  $('hub-candy').textContent = fmt(S.party.candy); $('hub-keep').textContent = S.perm.keepsakes;
  const wb = $('weapon-bar'); if (wb) wb.innerHTML = WEAPONS.map((w, i) => { const un = D.weaponUnlocked(w.id), sel = S.party.weapon === w.id; return `<div class="ws ${sel ? 'sel' : ''} ${un ? '' : 'locked'}" title="${T(w.name)}"><kbd>${i + 1}</kbd><span>${un ? T(w.name) : ico('lock', 14)}</span></div>`; }).join('');
  $('hud-party').textContent = S.perm.party; $('hud-tier').textContent = D.tier(); $('hud-run').textContent = S.party.runCount + 1;
}

// ---- Walking ----
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _mv = new THREE.Vector3();
function resolveCollisions(p) {
  p.x = THREE.MathUtils.clamp(p.x, WORLD.minX, WORLD.maxX); p.z = THREE.MathUtils.clamp(p.z, WORLD.minZ, WORLD.maxZ);
  const R = 0.35;
  for (const o of OBSTACLES) {
    if (o.r != null) { const dx = p.x - o.x, dz = p.z - o.z; const d = Math.hypot(dx, dz); const min = o.r + R; if (d < min && d > 1e-4) { p.x = o.x + dx / d * min; p.z = o.z + dz / d * min; } }
    else { if (p.x > o.x0 - R && p.x < o.x1 + R && p.z > o.z0 - R && p.z < o.z1 + R) { const l = p.x - (o.x0 - R), r = (o.x1 + R) - p.x, f = p.z - (o.z0 - R), k = (o.z1 + R) - p.z; const m = Math.min(l, r, f, k); if (m === l) p.x = o.x0 - R; else if (m === r) p.x = o.x1 + R; else if (m === f) p.z = o.z0 - R; else p.z = o.z1 + R; } }
  }
}
function updateHub(dt, t) {
  const k = HUB.keys; let fx = 0, fz = 0;
  if (k.KeyW || k.ArrowUp) fz += 1; if (k.KeyS || k.ArrowDown) fz -= 1; if (k.KeyA || k.ArrowLeft) fx -= 1; if (k.KeyD || k.ArrowRight) fx += 1;
  if (typeof PAD !== 'undefined' && (PAD.x || PAD.y)) { fx += PAD.x; fz -= PAD.y; }
  HUB.moving = (fx || fz) && HUB.mode === 'hub';
  if (HUB.moving) {
    const speed = (k.ShiftLeft || k.ShiftRight ? 6.2 : 4.0);
    _fwd.set(-Math.sin(look.yaw), 0, -Math.cos(look.yaw)); _right.set(Math.cos(look.yaw), 0, -Math.sin(look.yaw));
    _mv.set(0, 0, 0).addScaledVector(_fwd, fz).addScaledVector(_right, fx); if (_mv.length() > 1) _mv.normalize(); _mv.multiplyScalar(speed * dt);
    HUB.pos.add(_mv); resolveCollisions(HUB.pos);
    HUB.bob += dt * (speed > 5 ? 11 : 8); HUB.stepT -= dt; if (HUB.stepT <= 0) { HUB.stepT = speed > 5 ? 0.32 : 0.45; SFX.step(); }
  }
  // the porch is a step up; Space hops
  const P = window.PORCH; HUB.ground = (P && HUB.pos.x > P.x0 && HUB.pos.x < P.x1 && HUB.pos.z > P.z0 && HUB.pos.z < P.z1) ? P.y : 0;
  if (HUB.y > HUB.ground || HUB.vy > 0) { HUB.vy -= BAL.gravity * dt; HUB.y += HUB.vy * dt; if (HUB.y <= HUB.ground) { HUB.y = HUB.ground; if (HUB.vy < -3) SFX.step(); HUB.vy = 0; } }
  else HUB.y += (HUB.ground - HUB.y) * Math.min(1, dt * 10);
  camera.position.set(HUB.pos.x, EYE + HUB.y + (HUB.moving && HUB.vy === 0 ? Math.abs(Math.sin(HUB.bob)) * 0.045 : 0), HUB.pos.z);
  updatePractice(dt, t);
  // nearest station in reach
  let best = null, bestD = 1e9;
  STATIONS.forEach(st => { const d = Math.hypot(st.pos.x - HUB.pos.x, st.pos.z - HUB.pos.z); if (d < st.radius && d < bestD) { best = st; bestD = d; } });
  if (best !== HUB.near) { HUB.near = best; holdStop(); }
  const pr = $('prompt');
  if (best && HUB.mode === 'hub') { const lock = stationLocked(best); pr.innerHTML = lock ? `<span class="lock">${ico('lock', 16)} ${T(best.name)} — ${T(lock)}</span>` : best.id === 'firing' && A11Y.hold() ? `<kbd>E</kbd> ${T('Hold to')} ${T(best.prompt())}<span class="hold"><i id="hold-bar"></i></span>` : `<kbd>E</kbd> ${T(best.prompt())}`; pr.classList.add('on'); }
  else pr.classList.remove('on');
  updateHold(dt);
  // floor rings pulse; the one you're standing in lights up
  STATIONS.forEach(st => { const near = st === best; const lock = stationLocked(st); const m = st.ring.material; m.emissiveIntensity = lock ? 0.05 : (near ? 1.4 : 0.45 + Math.sin(t * 2.2 + st.pos.x) * 0.2); m.color.setHex(lock ? 0x999999 : st === (objective && stationById[objective.st]) ? 0xffd23f : 0x2ec4b6); m.emissive.setHex(m.color.getHex()); st.ring.scale.setScalar(near ? 1.12 : 1); st.ringInner.material.color.setHex(m.color.getHex()); st.ringInner.material.opacity = near ? 0.18 : 0.07; st.ring.visible = st.ringInner.visible = HUB.mode !== 'run'; });
  STATIONS.forEach(st => { if (st.update) st.update(dt, t); if (st.sprite) { fitSprite(st.sprite, 1.5, 9, 0.25, 1); st.sprite.visible = !(PANEL.kind && HUB.near === st) && HUB.mode !== 'run'; } });
  updateBacker(dt, t);
  // objective marker bobbing over its station
  if (objective) { const st = stationById[objective.st]; marker.visible = HUB.mode !== 'run'; marker.position.set(st.pos.x, st.signY + 0.9 + Math.sin(t * 3) * 0.12 + (st.sprite ? st.sprite.scale.y / 2 : 0), st.pos.z); marker.rotation.y += dt * 1.5; }
}
function jump() { if (HUB.mode !== 'hub' || PAUSE.on) return; if (HUB.y <= HUB.ground + 0.01 && HUB.vy === 0) { HUB.vy = BAL.jump_v; SFX.open(); } }
// switching weapons anywhere: the view model swaps at once, in the Backyard or mid-Run
function equipWeapon(n) {
  const w = WEAPONS[n - 1]; if (!w) return;
  if (!D.weaponUnlocked(w.id)) { toast(w.name + ': buy it at the weapons table (' + fmt(w.price) + ' Candy, Tier ' + w.unlockTier + ')'); return; }
  if (S.party.weapon === w.id) return;
  S.party.weapon = w.id; buildGun(w); setReticle(w); saveGame(); toast(w.name); SFX.open();
  if (HUB.mode === 'run') { RUN.mag = Math.min(RUN.mag, D.magCapacity(w)); updateHUD(); } else { updateHubHUD(); refreshSigns(); }
}
// ---- the tin-can range: test any weapon in the Backyard, no Candy, no clock ----
const PRACTICE = { cans: [], lastShot: -9 };
(function buildRange() {
  const g = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xb07a4c });
  g.add(box(2.4, 0.08, 0.3, wood, 0, 1.0, 0)); [[-1.0], [1.0]].forEach(([x]) => { [[-0.12], [0.12]].forEach(([dz]) => { const leg = box(0.06, 1.0, 0.06, wood, x, 0.5, dz); leg.rotation.x = dz * 2.2; g.add(leg); }); });
  const sign = makeLabelSprite([{ text: 'Tin-can range', size: 40 }, { text: 'shoot to test your weapon', size: 32, color: '#8fe3d8' }], { size: 40, scale: 0.0045 }); sign.position.set(0, 2.2, 0); g.add(sign); PRACTICE.sign = sign;
  for (let i = 0; i < 5; i++) {
    const can = new THREE.Group(); const c = cyl(0.1, 0.1, 0.28, new THREE.MeshStandardMaterial({ map: stripeTexture([0xe63946, 0x2ec4b6, 0xffd23f, 0xff5ea8, 0x7b5ea7][i], 0xfff4e0), metalness: 0.5, roughness: 0.4 }), 0, 0.14, 0, 14); can.add(c);
    can.add(cyl(0.1, 0.1, 0.02, flatMat(0xcfcfcf, { metalness: 0.9, roughness: 0.2 }), 0, 0.28, 0, 14)); can.userData.home = new THREE.Vector3(-0.9 + i * 0.45, 1.04, 0); can.position.copy(can.userData.home); c.userData.can = can; g.add(can);
    PRACTICE.cans.push(can); can.userData.mesh = c;
  }
  g.position.set(9.6, 0, -7.6); g.rotation.y = 0.35; yard.add(g); PRACTICE.group = g; blockCircle(9.6, -7.6, 1.0);
})();
function practiceShoot(t) {
  const w = D.weapon(); if (t - PRACTICE.lastShot < D.cooldown(w)) return; PRACTICE.lastShot = t;
  gunKick(t); if (w.aoe) SFX.cannon(); else SFX.shot();
  const meshes = PRACTICE.cans.filter(c => !c.userData.flying).map(c => c.userData.mesh);
  let hits = castRay(0, 0, meshes); const hr = D.hitRadius(w);
  if (!hits.length && hr > 0) for (let k = 0; k < 8 && !hits.length; k++) { const a = k / 8 * Math.PI * 2; hits = castRay(Math.cos(a) * hr, Math.sin(a) * hr * camera.aspect, meshes); }
  if (w.pellets > 1 && !hits.length) for (let k = 0; k < 6 && !hits.length; k++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * w.spread; hits = castRay(Math.cos(a) * r, Math.sin(a) * r * camera.aspect, meshes); }
  if (!hits.length) return;
  const targets = w.aoe ? PRACTICE.cans.filter(c => !c.userData.flying && c.getWorldPosition(_pw).distanceTo(hits[0].point) < D.aoe(w)) : [hits[0].object.userData.can];
  camera.getWorldDirection(_dir);
  targets.forEach(can => { can.userData.flying = true; can.userData.t = 0; can.userData.v = new THREE.Vector3(_dir.x * 3 * D.kickMult(w) + (Math.random() - 0.5), 3 + Math.random() * 1.5, _dir.z * 3 * D.kickMult(w) + (Math.random() - 0.5)); can.userData.spin = new THREE.Vector3(Math.random() * 10, 0, Math.random() * 10); });
  floater(targets.length > 1 ? 'PING ×' + targets.length : 'PING', 'sweet', hits[0].point); SFX.sweet(); JUICE.shake = Math.max(JUICE.shake, 0.2); ui.crosshair.classList.remove('hit'); void ui.crosshair.offsetWidth; ui.crosshair.classList.add('hit');
}
const _pw = new THREE.Vector3();
function updatePractice(dt, t) {
  PRACTICE.cans.forEach(can => {
    const u = can.userData; if (!u.flying) return;
    u.t += dt; u.v.y -= BAL.gravity * 0.5 * dt; can.position.addScaledVector(u.v, dt); can.rotation.x += u.spin.x * dt; can.rotation.z += u.spin.z * dt;
    if (can.position.y < 0.1) { can.position.y = 0.1; u.v.set(u.v.x * 0.4, -u.v.y * 0.3, u.v.z * 0.4); }
    if (u.t > 1.6) { u.flying = false; can.position.copy(u.home); can.rotation.set(0, 0, 0); }
  });
  if (PRACTICE.sign) { fitSprite(PRACTICE.sign, 1.5, 9, 0.25, 1); PRACTICE.sign.visible = HUB.mode !== 'run'; }
}
let interactCooldownUntil = 0;
function interact() {
  if (HUB.mode !== 'hub' || !HUB.near || performance.now() < interactCooldownUntil) return;
  const lock = stationLocked(HUB.near); if (lock) { toast(HUB.near.name + ': ' + lock.toLowerCase() + '.'); SFX.miss(); return; }
  if (HUB.near.id === 'firing' && A11Y.hold()) { toast('Hold E to start the Run.'); return; }   // the firing line only starts on a held E — unless the player turned holding off
  SFX.open(); HUB.near.open();
}
// The firing line needs a held E (1.2 s) so a Run never starts by accident.
const HOLD = { active: false, t: 0, need: 1.2 };
function holdStart() { if (!A11Y.hold() || HUB.mode !== 'hub' || !HUB.near || HUB.near.id !== 'firing' || performance.now() < interactCooldownUntil) return false; HOLD.active = true; HOLD.t = 0; return true; }
function holdStop() { HOLD.active = false; HOLD.t = 0; const bar = $('hold-bar'); if (bar) bar.style.width = '0%'; }
function updateHold(dt) {
  if (!HOLD.active) return;
  if (HUB.mode !== 'hub' || !HUB.near || HUB.near.id !== 'firing') { holdStop(); return; }
  HOLD.t += dt; const bar = $('hold-bar'); if (bar) bar.style.width = Math.min(100, HOLD.t / HOLD.need * 100) + '%';
  if (HOLD.t >= HOLD.need) { holdStop(); SFX.open(); HUB.near.open(); }
}
function enterHub() {
  HUB.mode = 'hub'; setMusicMode('hub'); document.body.classList.remove('playing'); document.body.classList.add('hub'); document.body.classList.remove('menu');
  if (!pointerLockSupported) setMouseMode(true);
  showScreen(null); refreshHub();
  $('hint').textContent = T(aim.mouseMode ? 'WASD walk · move the mouse to look · E use' : 'Click to capture the mouse · WASD walk · E use · Esc releases');
}
