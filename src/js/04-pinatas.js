// ---------- PIÑATAS: Families A–D, rares, The Centerpiece ----------
const pinatas = [];
let pinataSeq = 0;

class Pinata {
  constructor(kindId, opts) {
    opts = opts || {};
    this.id = ++pinataSeq;
    this.kindId = kindId; this.k = KINDS[kindId];
    this.family = this.k.family; this.health = this.k.health;
    this.damage = 0; this.alive = true; this.age = 0;
    this.behavior = opts.behavior || this.k.behavior;
    this.moving = this.behavior !== 'still';
    this.speed = D.speedForTier() * (opts.speed || 1);
    this.phase = Math.random() * Math.PI * 2;
    this.sweetScale = (opts.sweetScale || 1) * (this.k.family === 'R' ? 1 : D.sweetScaleForTier());
    this.parts = []; this.sweetMeshes = [];
    this.open = true;            // Clockwork / Toss: whether the Sweet Spot is currently open
    this.clockwork = !!this.k.clockwork;
    this.layers = this.k.layers || 0; this.layerIndex = 0; this.layered = kindId === 'centerpiece' || kindId === 'boss';
    this.repoHeld = opts.repoHeld || 0;
    this.life = this.k.life || 0;
    this.candyBase = opts.candyBase || this.k.candy;
    if (this.k.hazard || this.k.decoy) { this.fuse = BAL.bad_fuse[0] + Math.random() * (BAL.bad_fuse[1] - BAL.bad_fuse[0]); this.fuseTick = 0; }
    // pendulum / spring state: swings are real now, and a Body Hit kicks the piñata away
    this.ang = 0; this.angVel = 0; this.bounceY = 0; this.bounceV = 0; this.zipT = Math.random() * 6; this.spinVel = 0;

    this.pivot = new THREE.Group();           // sits on the line (or the launcher)
    this.body = new THREE.Group();            // hangs below the pivot
    this.pivot.add(this.body);
    this.slot = opts.slot || null;
    if (this.slot) { this.slot.taken = this; this.pivot.position.set(this.slot.x, this.slot.y, this.slot.z); }
    else if (opts.position) this.pivot.position.copy(opts.position);
    this.stringLen = opts.stringLen != null ? opts.stringLen : 0.9;
    this.body.position.y = -this.stringLen;
    if (this.slot || opts.string) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, this.stringLen, 5), flatMat(0xe8d8b0)); s.position.y = -this.stringLen / 2; this.pivot.add(s); this.stringMesh = s;
    }
    this.build(opts);
    this.baseScale = opts.bodyScale || this.k.scale || ((this.layered || this.kindId === 'boss') ? 1 : this.kindId === 'nestlet' ? 1.15 : 1.3);
    this.body.scale.setScalar(this.baseScale);
    this.sweetMeshes.forEach(m => m.scale.setScalar(this.sweetScale));
    scene.add(this.pivot);
    pinatas.push(this);
  }

  tag(mesh, part, extra) { mesh.userData.pinata = this; mesh.userData.part = part; if (extra) Object.assign(mesh.userData, extra); this.parts.push(mesh); if (part === 'sweet') this.sweetMeshes.push(mesh); return mesh; }

  build(opts) {
    const b = this.body, k = this.k, col = k.color;
    const bm = crepeMat(col);
    const eye = (x, y, z, s) => { const g = new THREE.Group(); g.add(sphere(0.05 * s, flatMat(0xffffff), 0, 0, 0, 8)); g.add(sphere(0.026 * s, flatMat(0x1a1020), 0, 0, 0.035 * s, 6)); g.position.set(x, y, z); return g; };
    switch (this.kindId) {
      case 'donkey': case 'burro': case 'bull': case 'repo': {
        const big = this.kindId === 'bull' ? 1.2 : 1;
        if (this.kindId === 'repo') {
          const bodyMesh = box(0.8, 0.7, 0.6, flatMat(0x2a2a2a, { roughness: 0.6 }), 0, 0, 0); b.add(this.tag(bodyMesh, 'body'));
          [[0, 0.12], [0, -0.16]].forEach(([x, y]) => b.add(this.tag(box(0.82, 0.08, 0.62, flatMat(0xbdbdbd), 0, y, 0), 'body')));
          b.add(this.tag(box(0.08, 0.72, 0.62, flatMat(0xbdbdbd), 0, 0, 0), 'body'));
          const tagT = canvasTex('repotag', 128, 64, g => { g.fillStyle = '#e63946'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('REPO', 64, 44); });
          const tagm = box(0.34, 0.18, 0.02, new THREE.MeshStandardMaterial({ map: tagT }), -0.2, 0.22, 0.31); b.add(this.tag(tagm, 'body'));
          b.add(this.tag(sphere(k.sweet, sweetMat(0xff2d2d), 0.1, 0, 0.26), 'sweet'));
          break;
        }
        const accent = this.kindId === 'donkey' ? 0x2ec4b6 : this.kindId === 'burro' ? 0xff5ea8 : 0xffd23f;
        const bodyG = fringedBox(0.95 * big, 0.5 * big, 0.42 * big, col, 5); bodyG.children.forEach(m => this.tag(m, 'body')); b.add(bodyG);
        const blanket = box(0.5 * big, 0.06, 0.48 * big, new THREE.MeshStandardMaterial({ map: stripeTexture(accent, 0xffffff), roughness: 0.9 }), -0.05 * big, 0.27 * big, 0); b.add(this.tag(blanket, 'body'));
        const neck = box(0.22 * big, 0.3 * big, 0.26 * big, bm, 0.45 * big, 0.28 * big, 0); neck.rotation.z = -0.5; b.add(this.tag(neck, 'body'));
        const headG = fringedBox(0.36 * big, 0.3 * big, 0.28 * big, col, 3); headG.position.set(0.62 * big, 0.36 * big, 0); headG.children.forEach(m => this.tag(m, 'body')); b.add(headG);
        const snout = box(0.16 * big, 0.18 * big, 0.22 * big, crepeMat(shade(col, 0.15)), 0.84 * big, 0.3 * big, 0); b.add(this.tag(snout, 'body'));
        [[0.08], [-0.08]].forEach(([dz]) => { const ear = box(0.06, 0.24 * big, 0.08, bm, 0.6 * big, 0.6 * big, dz * big); ear.rotation.x = dz > 0 ? 0.35 : -0.35; b.add(this.tag(ear, 'body')); b.add(box(0.02, 0.16 * big, 0.04, flatMat(0xffb3d1), 0.63 * big, 0.6 * big, dz * big)); });
        for (let i = 0; i < 5; i++) b.add(this.tag(cone(0.05 * big, 0.14 * big, flatMat(accent), (0.2 + i * 0.09) * big, (0.4 + i * 0.01) * big, 0), 'body'));   // mane
        b.add(eye(0.72 * big, 0.42 * big, 0.15 * big, big)); b.add(eye(0.72 * big, 0.42 * big, -0.15 * big, big));
        if (this.kindId === 'bull') { [[0.14], [-0.14]].forEach(([dz]) => { const h = cyl(0.02, 0.05, 0.34, flatMat(0xfff5d6), 0.66 * big, 0.62 * big, dz * big); h.rotation.x = dz > 0 ? 0.8 : -0.8; h.rotation.z = -0.3; b.add(this.tag(h, 'body')); }); b.add(torus(0.05, 0.012, flatMat(0xffd23f, { metalness: 0.8 }), 0.93 * big, 0.24 * big, 0)); }
        for (let i = 0; i < 4; i++) { const lx = (i < 2 ? -0.32 : 0.32) * big, lz = (i % 2 ? 0.13 : -0.13) * big; const leg = fringedBox(0.12 * big, 0.36 * big, 0.12 * big, col, 3); leg.position.set(lx, -0.4 * big, lz); leg.children.forEach(m => this.tag(m, 'body')); b.add(leg); b.add(this.tag(box(0.13 * big, 0.06, 0.13 * big, flatMat(0x3a2418), lx, -0.6 * big, lz), 'body')); }
        const tail = tassel(accent, 0.3 * big); tail.position.set(-0.5 * big, 0.12 * big, 0); tail.rotation.z = 0.9; b.add(tail);
        let sw;
        if (k.where === 'front') sw = sphere(k.sweet, sweetMat(), 0.05, 0, 0.21 * big);
        else if (k.where === 'belly') sw = sphere(k.sweet, sweetMat(), 0, -0.25 * big, 0);
        else sw = sphere(k.sweet, sweetMat(), 0.86 * big, 0.36 * big, 0);
        b.add(this.tag(sw, 'sweet'));
        break;
      }
      case 'star': case 'golden': case 'toss': {
        // the classic seven-point piñata: a crepe core with seven cones and tassels
        const gold = this.kindId === 'golden';
        const coreR = gold ? 0.22 : 0.32, coneL = gold ? 0.34 : 0.5, coneR = gold ? 0.09 : 0.14;
        const coreMat = gold ? new THREE.MeshStandardMaterial({ color: 0xffc300, metalness: 0.85, roughness: 0.25, emissive: 0x553300, emissiveIntensity: 0.4 }) : crepeMat(col);
        b.add(this.tag(sphere(coreR, coreMat, 0, 0, 0, 20), 'body'));
        const palette = gold ? [0xffc300, 0xffe28a, 0xffb000] : (this.kindId === 'toss' ? [0xff5ea8, 0xffd23f, 0x2ec4b6] : [0xffd23f, 0xff5ea8, 0x2ec4b6, 0xff8c42]);
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2 + Math.PI / 2; const c = cone(coneR, coneL, gold ? coreMat : crepeMat(palette[i % palette.length]), Math.cos(a) * (coreR + coneL / 2 - 0.02), Math.sin(a) * (coreR + coneL / 2 - 0.02), 0, 10);
          c.rotation.z = a - Math.PI / 2; b.add(this.tag(c, 'body'));
          const t = tassel(palette[(i + 1) % palette.length], gold ? 0.14 : 0.22); t.position.set(Math.cos(a) * (coreR + coneL), Math.sin(a) * (coreR + coneL), 0); b.add(t);
        }
        // the Sweet Spot is the core's face, protruding front and back
        b.add(this.tag(sphere(k.sweet, sweetMat(gold ? 0xffffff : undefined), 0, 0, coreR * 0.55), 'sweet'));
        b.add(this.tag(sphere(k.sweet, sweetMat(gold ? 0xffffff : undefined), 0, 0, -coreR * 0.55), 'sweet'));
        if (this.kindId !== 'toss') b.rotation.y = Math.random() * 6;
        break;
      }
      case 'cactus': {
        // a saguaro in green crepe with two arms, paper flowers and a little clay pot
        const green = col, dark = shade(col, -0.12);
        const trunk = fringedCyl(0.2, 0.95, green, 6); trunk.children.forEach(m => this.tag(m, 'body')); b.add(trunk);
        [[-1, 0.12], [1, -0.02]].forEach(([s, dy]) => { const arm = fringedCyl(0.11, 0.42, dark, 4); arm.position.set(s * 0.26, dy, 0); arm.children.forEach(m => this.tag(m, 'body')); b.add(arm); const el = fringedCyl(0.11, 0.3, green, 3); el.rotation.z = -s * Math.PI / 2; el.position.set(s * 0.2, dy - 0.2, 0); el.children.forEach(m => this.tag(m, 'body')); b.add(el); });
        for (let i = 0; i < 14; i++) b.add(cone(0.012, 0.06, flatMat(0xfff4e0), Math.cos(i * 1.7) * 0.2, -0.4 + i * 0.06, Math.sin(i * 1.7) * 0.2, 4).rotateX(Math.PI / 2));   // spines
        [[0, 0.52, 0xff5ea8], [-0.26, 0.36, 0xffd23f], [0.26, 0.2, 0xff8c42]].forEach(([x, y, c]) => { b.add(sphere(0.07, flatMat(c), x, y, 0.05, 8)); b.add(sphere(0.035, flatMat(0xfff4e0), x, y, 0.11, 6)); });
        b.add(this.tag(cyl(0.22, 0.17, 0.2, flatMat(0xc2603a), 0, -0.56, 0, 12), 'body')); b.add(this.tag(torus(0.22, 0.03, flatMat(0xd97b52), 0, -0.47, 0).rotateX(Math.PI / 2), 'body'));
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, -0.05, 0.22), 'sweet'));
        break;
      }
      case 'sun': {
        // a smiling sun: a warm disc, twelve crepe rays, rosy cheeks
        const disc = cyl(0.42, 0.42, 0.16, crepeMat(col), 0, 0, 0, 24); disc.rotation.x = Math.PI / 2; b.add(this.tag(disc, 'body'));
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const ray = cone(0.09, 0.32, crepeMat(i % 2 ? 0xff8c42 : 0xffd23f), Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0, 6); ray.rotation.z = a - Math.PI / 2; b.add(this.tag(ray, 'body')); }
        b.add(eye(-0.14, 0.1, 0.09, 1)); b.add(eye(0.14, 0.1, 0.09, 1));
        [[-0.22], [0.22]].forEach(([x]) => b.add(sphere(0.06, flatMat(0xff8fa3), x, -0.06, 0.09, 8)));
        const smile = torus(0.14, 0.02, flatMat(0x3a2418), 0, -0.1, 0.09); smile.rotation.z = Math.PI; smile.scale.y = 0.6; b.add(smile);
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, -0.02, 0.1), 'sweet')); b.add(this.tag(sphere(k.sweet, sweetMat(), 0, -0.02, -0.1), 'sweet'));
        break;
      }
      case 'llama': {
        // the Lucky Llama: a long-necked crepe sprinter in party stripes, saddle blanket and pom-poms — our own design
        const wool = crepeMat(0xfff4e0), pink = crepeMat(0xff5ea8), teal = crepeMat(0x2ec4b6);
        const body = fringedBox(0.9, 0.5, 0.42, 0xfff4e0, 5); body.children.forEach(m => this.tag(m, 'body')); b.add(body);
        b.add(this.tag(box(0.5, 0.08, 0.5, new THREE.MeshStandardMaterial({ map: stripeTexture(0xff5ea8, 0x2ec4b6), roughness: 0.9 }), -0.05, 0.28, 0), 'body'));
        for (let i = 0; i < 6; i++) { const t = tassel([0xffd23f, 0xff5ea8, 0x2ec4b6][i % 3], 0.12); t.position.set(-0.28 + i * 0.11, 0.26, 0.26); b.add(t); const t2 = tassel([0xffd23f, 0xff5ea8, 0x2ec4b6][i % 3], 0.12); t2.position.set(-0.28 + i * 0.11, 0.26, -0.26); b.add(t2); }
        const neck = fringedBox(0.2, 0.6, 0.2, 0xfff4e0, 4); neck.position.set(0.42, 0.5, 0); neck.rotation.z = -0.25; neck.children.forEach(m => this.tag(m, 'body')); b.add(neck);
        const head = fringedBox(0.34, 0.2, 0.2, 0xfff4e0, 2); head.position.set(0.6, 0.86, 0); head.children.forEach(m => this.tag(m, 'body')); b.add(head);
        b.add(this.tag(box(0.14, 0.14, 0.16, pink, 0.78, 0.83, 0), 'body'));
        [[0.07], [-0.07]].forEach(([dz]) => { const ear = box(0.05, 0.16, 0.05, teal, 0.52, 1.02, dz); b.add(this.tag(ear, 'body')); });
        b.add(eye(0.66, 0.9, 0.11, 0.9)); b.add(eye(0.66, 0.9, -0.11, 0.9));
        [[0.14, 0.1], [0.14, -0.1], [-0.02, 0.1], [-0.02, -0.1]].forEach(([x, y]) => b.add(sphere(0.045, flatMat([0xffd23f, 0xff5ea8, 0x2ec4b6, 0xff8c42][Math.round(x * 10 + y * 10 + 3) % 4]), 0.52 + x * 0.6, 0.96 + y * 0.6, 0.11, 6)));   // pom-poms on the head
        for (let i = 0; i < 4; i++) { const lx = i < 2 ? -0.3 : 0.3, lz = i % 2 ? 0.13 : -0.13; const leg = fringedBox(0.11, 0.4, 0.11, 0xfff4e0, 3); leg.position.set(lx, -0.42, lz); leg.children.forEach(m => this.tag(m, 'body')); b.add(leg); leg.userData.leg = i; this.legs = this.legs || []; this.legs.push(leg); b.add(this.tag(box(0.12, 0.06, 0.12, flatMat(0x3a2418), lx, -0.64, lz), 'body')); }
        const tail = tassel(0xff5ea8, 0.2); tail.position.set(-0.48, 0.2, 0); tail.rotation.z = 1.1; b.add(tail);
        b.add(this.tag(sphere(k.sweet, sweetMat(0xffd23f), 0.05, 0.02, 0.24), 'sweet')); b.add(this.tag(sphere(k.sweet, sweetMat(0xffd23f), 0.05, 0.02, -0.24), 'sweet'));
        this.stringMesh && (this.stringMesh.visible = false);
        break;
      }
      case 'armored': {
        // the Tin Bull: a bull piñata plated in riveted tin — three Sweet Hits to crack it, and it barely swings when kicked
        const tin = flatMat(0xd3dae2, { metalness: 0.35, roughness: 0.4 }), rivet = flatMat(0x6b7580, { metalness: 0.5, roughness: 0.4 });
        b.add(this.tag(box(1.0, 0.54, 0.46, tin, 0, 0, 0), 'body'));
        b.add(this.tag(box(0.5, 0.06, 0.5, new THREE.MeshStandardMaterial({ map: stripeTexture(0xe63946, 0xffd23f), roughness: 0.9 }), -0.05, 0.28, 0), 'body'));   // a saddle blanket over the tin
        [[0, 0.2], [0, -0.2]].forEach(([x, y]) => b.add(this.tag(box(1.02, 0.06, 0.48, rivet, 0, y, 0), 'body')));
        for (let i = 0; i < 8; i++) { const x = -0.4 + i * 0.115; b.add(sphere(0.025, rivet, x, 0.27, 0.24, 5)); b.add(sphere(0.025, rivet, x, -0.27, 0.24, 5)); b.add(sphere(0.025, rivet, x, 0.27, -0.24, 5)); b.add(sphere(0.025, rivet, x, -0.27, -0.24, 5)); }
        const neck = box(0.26, 0.32, 0.3, tin, 0.5, 0.28, 0); neck.rotation.z = -0.5; b.add(this.tag(neck, 'body'));
        b.add(this.tag(box(0.4, 0.32, 0.32, tin, 0.7, 0.38, 0), 'body')); b.add(this.tag(box(0.18, 0.2, 0.26, rivet, 0.94, 0.3, 0), 'body'));
        [[0.16], [-0.16]].forEach(([dz]) => { const h = cyl(0.025, 0.06, 0.4, flatMat(0xfff5d6), 0.72, 0.66, dz); h.rotation.x = dz > 0 ? 0.9 : -0.9; h.rotation.z = -0.3; b.add(this.tag(h, 'body')); });
        b.add(eye(0.82, 0.46, 0.17, 1.1)); b.add(eye(0.82, 0.46, -0.17, 1.1)); b.add(torus(0.05, 0.012, flatMat(0xffd23f, { metalness: 0.8 }), 1.03, 0.24, 0));
        for (let i = 0; i < 4; i++) { const lx = i < 2 ? -0.34 : 0.34, lz = i % 2 ? 0.14 : -0.14; b.add(this.tag(box(0.14, 0.38, 0.14, tin, lx, -0.44, lz), 'body')); b.add(this.tag(box(0.15, 0.06, 0.15, rivet, lx, -0.64, lz), 'body')); }
        this.cracks = []; for (let i = 0; i < 3; i++) { const c = box(0.02, 0.3, 0.02, flatMat(0x2b2230), 0.2 + i * 0.25 - 0.4, 0.05, 0.24); c.rotation.z = 0.5 - i * 0.4; c.visible = false; b.add(c); this.cracks.push(c); }
        const tail = tassel(0xe63946, 0.28); tail.position.set(-0.52, 0.12, 0); tail.rotation.z = 0.9; b.add(tail);
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0.96, 0.4, 0), 'sweet'));
        this.armor = k.armored; this.armorHits = 0;
        break;
      }
      case 'glitter': {
        // the Glitter Bomb: a mirror ball on a chain. Pretty. Shoot it and it goes off in your face.
        const mirror = new THREE.MeshStandardMaterial({ color: 0xf0f0ff, metalness: 0.95, roughness: 0.15, emissive: 0x9090ff, emissiveIntensity: 0.25 });
        b.add(this.tag(sphere(0.4, mirror, 0, 0, 0, 12), 'body'));
        const _n = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1);
        for (let i = 0; i < 60; i++) { const th = Math.acos(1 - 2 * (i + 0.5) / 60), ph = i * 2.399; _n.set(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); const m = box(0.1, 0.1, 0.02, new THREE.MeshStandardMaterial({ color: [0xffffff, 0xffd6f6, 0xd6f6ff, 0xffffc8][i % 4], metalness: 0.6, roughness: 0.1, emissive: 0x333344 }), _n.x * 0.41, _n.y * 0.41, _n.z * 0.41); m.quaternion.setFromUnitVectors(_z, _n); b.add(this.tag(m, 'body')); }
        b.add(this.tag(sphere(k.sweet, sweetMat(0xffffff), 0, 0, 0.36), 'sweet'));
        const sign = box(0.5, 0.16, 0.02, new THREE.MeshStandardMaterial({ map: canvasTex('glittertag', 128, 40, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 40); g.fillStyle = '#7b5ea7'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('DO NOT SHOOT', 64, 28); }) }), 0, -0.55, 0); b.add(sign);
        break;
      }
      case 'comet': {
        // the Sugar Comet: a small golden star trailing tinsel, streaking along the line for a few seconds
        const gm = new THREE.MeshStandardMaterial({ color: 0xffc300, metalness: 0.8, roughness: 0.25, emissive: 0x805000, emissiveIntensity: 0.5 });
        b.add(this.tag(sphere(0.2, gm, 0, 0, 0, 16), 'body'));
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; const c = cone(0.08, 0.3, gm, Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0, 8); c.rotation.z = a - Math.PI / 2; b.add(this.tag(c, 'body')); }
        this.tail = []; for (let i = 0; i < 8; i++) { const s = sphere(0.075 - i * 0.007, new THREE.MeshBasicMaterial({ color: [0xffc300, 0xffe28a, 0xff8c42][i % 3], transparent: true, opacity: 0.7 - i * 0.075 }), 0, 0, 0, 6); this.pivot.add(s); this.tail.push(s); }
        b.add(this.tag(sphere(k.sweet, sweetMat(0xffffff), 0, 0, 0.16), 'sweet')); b.add(this.tag(sphere(k.sweet, sweetMat(0xffffff), 0, 0, -0.16), 'sweet'));
        this.stringMesh && (this.stringMesh.visible = false);
        break;
      }
      case 'cluster': {
        // the Cluster Ball: four mini stars strapped together with ribbon; break it and they scatter, hopping
        const shellMat = new THREE.MeshStandardMaterial({ map: polkaTexture(col, 0xffffff), roughness: 0.9 });
        [[0, 0.22, 0], [0.24, -0.12, 0.14], [-0.24, -0.12, 0.14], [0, -0.12, -0.26]].forEach(([x, y, z]) => b.add(this.tag(sphere(0.28, shellMat, x, y, z, 14), 'body')));
        const rib = torus(0.42, 0.035, flatMat(0xff5ea8), 0, 0, 0); rib.rotation.x = Math.PI / 2; b.add(this.tag(rib, 'body')); const rib2 = torus(0.42, 0.035, flatMat(0xffd23f), 0, 0, 0); rib2.rotation.y = Math.PI / 2; b.add(this.tag(rib2, 'body'));
        b.add(sphere(0.1, flatMat(0xff5ea8), 0, 0.48, 0, 8));
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, 0.02, 0.4), 'sweet'));
        break;
      }
      case 'mini': {
        const gm = crepeMat(col); b.add(this.tag(sphere(0.14, gm, 0, 0, 0, 12), 'body'));
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; const c = cone(0.06, 0.2, crepeMat([0xff5ea8, 0x2ec4b6, 0xff8c42][i % 3]), Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0, 6); c.rotation.z = a - Math.PI / 2; b.add(this.tag(c, 'body')); }
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, 0, 0.11), 'sweet')); b.add(this.tag(sphere(k.sweet, sweetMat(), 0, 0, -0.11), 'sweet'));
        this.hopV = 4 + Math.random() * 2; this.hopDir = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 1.2).normalize().multiplyScalar(1.4 + Math.random()); this.hopY = 0; this.hops = 0;
        this.stringMesh && (this.stringMesh.visible = false);
        break;
      }
      case 'spiker': {
        // the Spiker: a black spiked ball with a warning stripe. Popping it costs time.
        const blk = flatMat(0x1a1a1a, { roughness: 0.5, metalness: 0.3 }), spike = flatMat(0x3a3a3a, { roughness: 0.4, metalness: 0.5 });
        b.add(this.tag(sphere(0.34, blk, 0, 0, 0, 16), 'body'));
        for (let i = 0; i < 26; i++) { const th = Math.acos(1 - 2 * (i + 0.5) / 26), ph = i * 2.399; const n = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); const c = cone(0.06, 0.26, spike, n.x * 0.42, n.y * 0.42, n.z * 0.42, 6); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); b.add(this.tag(c, 'body')); }
        const stripe = torus(0.35, 0.03, new THREE.MeshStandardMaterial({ map: stripeTexture(0xffd23f, 0x1a1a1a), emissive: 0x332200 }), 0, 0, 0); stripe.rotation.x = Math.PI / 2; b.add(this.tag(stripe, 'body'));
        b.add(eye(-0.12, 0.05, 0.3, 0.8)); b.add(eye(0.12, 0.05, 0.3, 0.8));
        b.add(this.tag(sphere(k.sweet, sweetMat(0xff2d2d), 0, -0.08, 0.3), 'sweet'));
        break;
      }
      case 'luchador': {
        // El Luchador: a barrel-chested masked wrestler in cape and boots — our own hero, in classic red-and-blue lucha colours
        const skin = crepeMat(0xd9a071), red = crepeMat(0xe63946), blue = crepeMat(0x2d6cdf), gold = flatMat(0xffd23f, { metalness: 0.5, roughness: 0.4 });
        const torso = fringedBox(0.6, 0.6, 0.4, 0xd9a071, 5); torso.children.forEach(m => this.tag(m, 'body')); b.add(torso);
        b.add(this.tag(box(0.5, 0.24, 0.42, red, 0, 0.02, 0.01), 'body'));   // a bold red singlet band across the chest
        b.add(this.tag(box(0.64, 0.14, 0.44, gold, 0, -0.26, 0), 'body'));   // championship belt
        b.add(this.tag(box(0.44, 0.34, 0.44, blue, 0, -0.5, 0), 'body'));   // blue trunks
        const head = sphere(0.24, red, 0, 0.56, 0, 14); b.add(this.tag(head, 'body'));   // the red mask
        b.add(this.tag(box(0.5, 0.12, 0.5, blue, 0, 0.7, 0), 'body'));   // blue crown stripe on the mask
        [[-0.09], [0.09]].forEach(([x]) => { b.add(sphere(0.07, flatMat(0x2d6cdf), x, 0.6, 0.19, 8)); b.add(sphere(0.055, flatMat(0xfff4e0), x, 0.61, 0.22, 8)); b.add(sphere(0.028, flatMat(0x1a1020), x, 0.61, 0.26, 6)); });   // blue-rimmed eyes
        b.add(box(0.12, 0.05, 0.02, flatMat(0xfff4e0), 0, 0.46, 0.24)); b.add(box(0.04, 0.3, 0.02, gold, 0, 0.62, 0.24).rotateX(0.3));   // mouth + mask flame
        [[-1], [1]].forEach(([s]) => { const arm = fringedBox(0.16, 0.5, 0.16, 0xd9a071, 3); arm.position.set(s * 0.42, 0.12, 0.05); arm.rotation.z = -s * 0.6; arm.children.forEach(m => this.tag(m, 'body')); b.add(arm); b.add(sphere(0.1, flatMat(0x2d6cdf), s * 0.58, -0.02, 0.1, 8)); });   // blue wristbands
        [[-0.15], [0.15]].forEach(([x]) => { const leg = fringedBox(0.16, 0.42, 0.16, 0xd9a071, 3); leg.position.set(x, -0.85, 0); leg.children.forEach(m => this.tag(m, 'body')); b.add(leg); b.add(this.tag(box(0.18, 0.16, 0.24, red, x, -1.08, 0.03), 'body')); });   // red boots
        const cape = box(0.7, 0.9, 0.03, new THREE.MeshStandardMaterial({ map: stripeTexture(0xe63946, 0x2d6cdf), side: THREE.DoubleSide }), 0, -0.05, -0.24); cape.rotation.x = 0.15; b.add(this.tag(cape, 'body'));
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, 0.05, 0.22), 'sweet'));
        break;
      }
      case 'chili': {
        // Chile Bravo: a fat red chilli with a green stem, sweat drops and an angry brow — Body Hits make it hotter
        const red = crepeMat(0xd62828); const body = fringedCyl(0.26, 0.9, 0xd62828, 6); body.rotation.z = 0.15; body.children.forEach(m => this.tag(m, 'body')); b.add(body);
        b.add(this.tag(sphere(0.26, red, 0.06, 0.45, 0, 14), 'body')); b.add(this.tag(cone(0.1, 0.5, red, -0.1, -0.65, 0, 10).rotateZ(Math.PI), 'body'));
        b.add(this.tag(cyl(0.05, 0.08, 0.2, flatMat(0x4e9339), 0.06, 0.78, 0, 8), 'body')); b.add(this.tag(cone(0.16, 0.14, flatMat(0x5ea548), 0.06, 0.66, 0, 8), 'body'));
        b.add(eye(-0.1, 0.25, 0.24, 1)); b.add(eye(0.12, 0.25, 0.24, 1)); b.add(box(0.28, 0.04, 0.02, flatMat(0x3a2418), 0.01, 0.34, 0.26).rotateZ(0.25));
        for (let i = 0; i < 3; i++) b.add(sphere(0.035, new THREE.MeshStandardMaterial({ color: 0x9ed6ee, transparent: true, opacity: 0.85 }), -0.22 + i * 0.05, 0.42 - i * 0.1, 0.18, 6));
        this.flames = []; for (let i = 0; i < 4; i++) { const f = cone(0.06, 0.2, new THREE.MeshBasicMaterial({ color: [0xff8c42, 0xffd23f][i % 2], transparent: true, opacity: 0 }), -0.1 + i * 0.07, 0.95, 0, 6); b.add(f); this.flames.push(f); }
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0.02, 0.0, 0.26), 'sweet'));
        this.heatLevel = 0;
        break;
      }
      case 'nest': {
        const r = 0.62;
        b.add(this.tag(sphere(r, new THREE.MeshStandardMaterial({ map: polkaTexture(col, 0xffd23f), roughness: 0.9 }), 0, 0, 0, 24), 'body'));
        const belt = torus(r * 0.98, 0.05, flatMat(0xff5ea8), 0, 0, 0); belt.rotation.x = Math.PI / 2; b.add(this.tag(belt, 'body'));
        const bow = new THREE.Group(); bow.add(sphere(0.16, flatMat(0xff5ea8), -0.16, 0, 0, 10)); bow.add(sphere(0.16, flatMat(0xff5ea8), 0.16, 0, 0, 10)); bow.add(sphere(0.08, flatMat(0xe63946), 0, 0, 0, 8)); bow.scale.set(1, 0.7, 0.6); bow.position.y = r + 0.05; bow.children.forEach(m => this.tag(m, 'body')); b.add(bow);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const c = cone(0.1, 0.3, crepeMat([0xff5ea8, 0xffd23f, 0x2ec4b6][i % 3]), Math.cos(a) * r, Math.sin(a) * r, 0, 8); c.rotation.z = a - Math.PI / 2; b.add(this.tag(c, 'body')); }
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, -0.05, r * 0.82), 'sweet'));
        break;
      }
      case 'nestlet': {
        const r = 0.24;
        b.add(this.tag(sphere(r, new THREE.MeshStandardMaterial({ map: polkaTexture(col, 0xffffff), roughness: 0.9 }), 0, 0, 0, 14), 'body'));
        for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.PI / 2; const c = cone(0.05, 0.14, flatMat(0xffd23f), Math.cos(a) * r, Math.sin(a) * r, 0, 6); c.rotation.z = a - Math.PI / 2; b.add(this.tag(c, 'body')); }
        b.add(this.tag(sphere(k.sweet, sweetMat(), 0, 0, r * 0.85), 'sweet'));
        this.center = opts.center ? opts.center.clone() : this.pivot.position.clone();
        this.orbit = 0.9 + Math.random() * 0.6; this.orbitTilt = Math.random() * 1.2 - 0.6;
        break;
      }
      case 'glass': {
        const R = 0.62, glassMat = (c, op) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: op, roughness: 0.12, metalness: 0.15, emissive: c, emissiveIntensity: 0.18, side: THREE.DoubleSide });
        const frame = torus(R + 0.03, 0.035, flatMat(0xffd23f, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0); b.add(this.tag(frame, 'body'));
        const rim = cyl(R, R, 0.05, glassMat(0xbfefff, 0.5), 0, 0, 0, 32); rim.rotation.x = Math.PI / 2; b.add(this.tag(rim, 'rim'));
        const mid = cyl(R * 0.6, R * 0.6, 0.06, glassMat(0x8fd9ff, 0.7), 0, 0, 0.03, 28); mid.rotation.x = Math.PI / 2; b.add(this.tag(mid, 'mid'));
        const midRing = torus(R * 0.6, 0.02, flatMat(0xffffff), 0, 0, 0.06); b.add(this.tag(midRing, 'mid'));
        const cen = cyl(k.sweet, k.sweet, 0.08, sweetMat(0xffffff), 0, 0, 0.06, 20); cen.rotation.x = Math.PI / 2; b.add(this.tag(cen, 'sweet'));
        this.sweetMeshes = [cen]; cen.userData.zone = 'center';
        [[-0.3, 0.42], [0.3, 0.42]].forEach(([x, y]) => { const ch = cyl(0.012, 0.012, 0.5, flatMat(0xdddddd, { metalness: 0.7 }), x, y + 0.2, 0); ch.rotation.z = x < 0 ? 0.55 : -0.55; b.add(ch); });
        for (let i = 0; i < 5; i++) b.add(sphere(0.03, new THREE.MeshBasicMaterial({ color: 0xffffff }), Math.cos(i * 1.3) * R * 0.8, Math.sin(i * 1.3) * R * 0.8, 0.08, 6));
        this.slideAmp = D.tier() >= 2 ? 1.3 : 0; if (!this.slideAmp) this.moving = false;
        break;
      }
      case 'skull': {
        // a sugar skull: flowers on the eyes, marigold crown, tin jaw that drops during the Open Window
        const cream = flatMat(0xf6efdc, { roughness: 0.6 });
        b.add(this.tag(sphere(0.42, cream, 0, 0.08, 0, 22), 'body'));
        b.add(this.tag(box(0.5, 0.28, 0.4, cream, 0, -0.3, 0.02), 'body'));
        [[-0.3], [0.3]].forEach(([x]) => b.add(this.tag(sphere(0.12, cream, x, -0.1, 0.2, 10), 'body')));
        [[-0.16, 0.16], [0.16, 0.16]].forEach(([x, y]) => {
          const e = cyl(0.1, 0.1, 0.05, flatMat(0x1a1020), x, y, 0.4, 14); e.rotation.x = Math.PI / 2; b.add(this.tag(e, 'body'));
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.add(sphere(0.045, flatMat(i % 2 ? 0xff5ea8 : 0xffd23f), x + Math.cos(a) * 0.14, y + Math.sin(a) * 0.14, 0.42, 6)); }
        });
        const nose = cone(0.05, 0.1, flatMat(0x1a1020), 0, -0.02, 0.44); nose.rotation.x = Math.PI; b.add(nose);
        for (let i = 0; i < 7; i++) b.add(sphere(0.06, flatMat(i % 2 ? 0xff8c42 : 0xffb000), -0.36 + i * 0.12, 0.42 - Math.abs(i - 3) * 0.03, 0.18, 8));   // marigolds
        b.add(this.tag(torus(0.44, 0.03, flatMat(0x2ec4b6, { metalness: 0.5, roughness: 0.4 }), 0, 0.08, 0), 'body'));
        const sw = sphere(k.sweet, sweetMat(0xff2d78), 0, -0.24, 0.3); b.add(this.tag(sw, 'sweet'));
        const jaw = box(0.42, 0.26, 0.08, flatMat(0xd9d2c0, { metalness: 0.6, roughness: 0.3 }), 0, -0.26, 0.42); b.add(this.tag(jaw, 'body')); this.jaw = jaw; this.jawY = -0.26;
        for (let i = 0; i < 5; i++) b.add(box(0.05, 0.08, 0.02, flatMat(0xffffff), -0.16 + i * 0.08, -0.18, 0.47));
        this.open = false; this.cycleT = Math.random() * BAL.open_cycle;
        break;
      }
      case 'centerpiece': case 'boss': {
        const isBoss = this.kindId === 'boss';
        this.layerRadii = isBoss ? [1.55, 1.25, 0.95] : [2.5, 2.1, 1.7, 1.35, 1.0];
        this.layerGroups = [];
        this.layerCols = isBoss ? [[0xff5ea8, 0x2ec4b6, 0xffd23f], [0xe63946, 0x1a1a1a, 0xffd23f], [0xffd23f, 0xff5ea8, 0xfff4e0], [0x2a1e3a, 0xff8c42, 0xffd23f], [0xffb000, 0xff5ea8, 0x7b5ea7], [0x7b5ea7, 0xffd23f, 0xff5ea8]][Math.min(5, Math.max(0, (S.party.bossDue || 2) - 2))] : [0xffd23f, 0x7b5ea7, 0xff5ea8, 0x2ec4b6, 0xff8c42];
        for (let L = 0; L < this.layerRadii.length; L++) {
          const g = new THREE.Group(); const r = this.layerRadii[L];
          const shell = sphere(r, new THREE.MeshStandardMaterial({ map: polkaTexture(this.layerCols[L], 0xffffff), roughness: 0.9 }), 0, 0, 0, 30); g.add(this.tag(shell, 'body', { layer: L }));
          const belt = torus(r, 0.06, flatMat(shade(this.layerCols[L], -0.2)), 0, 0, 0); belt.rotation.x = Math.PI / 2; g.add(this.tag(belt, 'body', { layer: L }));
          for (let i = 0; i < 9; i++) { const c = cone(r * 0.16, r * 0.6, crepeMat(this.layerCols[(L + 1 + i) % this.layerCols.length]), Math.cos(i / 9 * Math.PI * 2) * r * 0.98, Math.sin(i / 9 * Math.PI * 2) * r * 0.98, 0, 8); c.rotation.z = i / 9 * Math.PI * 2 - Math.PI / 2; g.add(this.tag(c, 'body', { layer: L })); const t = tassel(this.layerCols[(L + 2 + i) % this.layerCols.length], r * 0.25); t.position.set(Math.cos(i / 9 * Math.PI * 2) * r * 1.28, Math.sin(i / 9 * Math.PI * 2) * r * 1.28, 0); g.add(t); }
          g.userData.doors = [];
          for (let d = 0; d < 3; d++) {
            const a = (d - 1) * 0.75; const px = Math.sin(a) * r * 0.85, pz = Math.cos(a) * r * 0.85;
            const door = sphere(k.sweet, sweetMat(0xff2d78), px, -0.1, pz); door.userData.door = d; g.add(this.tag(door, 'sweet', { layer: L })); g.userData.doors.push(door);
            const plate = box(0.9, 0.9, 0.12, flatMat(shade(this.layerCols[L], -0.25)), px * 1.12, -0.1, pz * 1.12); plate.lookAt(new THREE.Vector3(px * 3, -0.1, pz * 3)); g.add(this.tag(plate, 'body', { layer: L, plateOf: d })); door.userData.plate = plate; plate.userData.basePos = plate.position.clone();
          }
          g.visible = L === 0; b.add(g); this.layerGroups.push(g);
        }
        this.layerHealth = this.layerRadii.map(() => isBoss ? 2 : 3); this.layerDamage = this.layerRadii.map(() => 0); this.layers = this.layerRadii.length;
        this.doorIndex = 0; this.doorT = 0; this.doorCycle = 2.2;
        this.stringMesh && (this.stringMesh.visible = false);
        this.activeParts(); break;
      }
    }
  }

  // The Centerpiece exposes only the current Layer's parts
  activeParts() {
    if (!this.layered) return this.parts;
    return this.parts.filter(m => m.userData.layer === this.layerIndex);
  }
  hittable() {
    const list = this.layered ? this.activeParts() : this.parts;
    return list.filter(m => !(m.userData.part === 'sweet' && !this.open && !this.layered) && !(this.layered && m.userData.part === 'sweet' && m.userData.door !== this.doorIndex));
  }
  worldPos(out) { return this.body.getWorldPosition(out || new THREE.Vector3()); }

  setOpen(open) {
    if (this.open === open) return; this.open = open;
    const s = open ? 1 : 0.001;
    if (!this.layered) this.sweetMeshes.forEach(m => m.scale.setScalar(this.sweetScale * s * RUN.burstScale));
    if (this.jaw) this.jaw.position.y = open ? this.jawY - 0.3 : this.jawY;
  }

  update(dt, t) {
    this.age += dt;
    // Una piñata mala es una prueba de reflejos: parpadea, se apaga sola y deja el sitio a una buena.
    // El Spiker ademas hace tic-tac en rojo, porque conviene que se note desde la otra punta del patio;
    // la Bomba de Brillantina solo late, que ya lleva su cartel de DO NOT SHOOT encima.
    if (this.fuse != null) {
      this.fuse -= dt; this.fuseTick -= dt;
      const rapido = this.fuse < 0.6, blink = Math.sin(t * (rapido ? 40 : 18)) > 0;
      this.body.scale.setScalar(this.baseScale * (blink ? 1.08 : 0.94));
      if (this.k.hazard) {
        this.parts.forEach(m => { if (m.material && m.material.emissive) { m.material.emissive.setHex(blink ? 0xff2020 : 0x000000); m.material.emissiveIntensity = blink ? 0.9 : 0.05; } });
        if (this.fuseTick <= 0) { this.fuseTick = rapido ? 0.12 : 0.25; if (HUB.mode === 'run') beep(rapido ? 1400 : 900, 0.03, 'square', 0.03); }
      }
      if (this.fuse <= 0) {
        const slot = this.slot, wp = this.worldPos();
        burst(wp, this.k.hazard ? 0x444444 : 0xe6e6fa, 10, 0, null); this.remove();
        if (this.k.hazard) RUN.spikersFizzled = (RUN.spikersFizzled || 0) + 1;
        if (slot && RUN.active) spawnPinata(pickKind({ buenas: true }), { slot });   // el relevo nunca es otra mala
        return;
      }
    }
    if (this.stunUntil && t < this.stunUntil) { this.body.position.y = -this.stringLen + Math.sin(t * 40) * 0.01; return; }   // stunned: frozen mid-swing
    const sp = this.speed;
    const p = this.pivot, b = this.body;
    switch (this.behavior) {
      case 'still': b.position.y = -this.stringLen + Math.sin(t * 1.3 + this.phase) * 0.03; p.rotation.z = Math.sin(t * 0.9 + this.phase) * 0.04; break;
      case 'spin': b.rotation.y += 1.4 * sp * dt; break;
      case 'spinFast': b.rotation.y += 4.5 * sp * dt; break;
      case 'spinSlow': b.rotation.y = Math.sin(t * 0.4) * 0.5; break;
      case 'swing': case 'swingFast': case 'swingSlow': case 'zip': case 'bounce': {
        // driven pendulum: gravity + light damping + a nudge that keeps the natural swing alive
        const L = Math.max(0.6, this.stringLen + 0.5); const amp = (this.behavior === 'swingFast' ? 0.7 : this.behavior === 'swingSlow' ? 0.35 : 0.5) * (1 + 0.5 * (this.heatLevel || 0));
        if (this.k.hazard) { this.zipT += dt * 2.2 * sp; if (this.slot) p.position.x = this.slot.x + Math.sin(this.zipT) * 2.6; b.position.y = -this.stringLen + Math.abs(Math.sin(this.zipT * 2)) * 0.5; b.rotation.y += 4 * dt; }
        if (this.flames) this.flames.forEach((f, i) => { f.material.opacity = Math.min(1, (this.heatLevel || 0) * 0.5) * (0.6 + Math.sin(t * 12 + i) * 0.3); f.scale.setScalar(1 + (this.heatLevel || 0) * 0.3); });
        const drive = Math.cos(t * 1.6 * sp + this.phase) * amp * 1.2 * (this.behavior === 'swingFast' ? 1.8 : 1);
        this.angVel += (-(9.8 / L) * Math.sin(this.ang) - 0.35 * this.angVel + drive) * dt;
        this.ang += this.angVel * dt; p.rotation.z = this.ang;
        if (this.behavior === 'swingFast') b.rotation.y = Math.sin(t * 1.5 + this.phase) * 0.5;
        if (this.behavior === 'swingSlow') b.rotation.y += 0.3 * dt;
        if (this.spinVel) { b.rotation.y += this.spinVel * dt; this.spinVel *= Math.max(0, 1 - 1.5 * dt); }
        if (this.behavior === 'zip' && this.slot) { this.zipT += dt * 1.3 * sp; p.position.x = this.slot.x + Math.sin(this.zipT) * 2.2; }   // darts along the line
        if (this.behavior === 'bounce') { this.bounceV += (-14 * this.bounceY - 1.2 * this.bounceV) * dt + Math.sin(t * 2.3 + this.phase) * 0.6 * dt * 14; this.bounceY += this.bounceV * dt; b.position.y = -this.stringLen + this.bounceY; }
        break;
      }
      case 'slide': if (this.slideAmp) p.position.x = this.slot.x + Math.sin(t * 1.4 * sp + this.phase) * this.slideAmp; break;
      case 'gallop': {   // sprinters (Lucky Llama, Sugar Comet) cross the yard and leave through the far fence
        p.position.x += this.dir * this.gallopSpeed * dt;
        if (this.kindId === 'comet') { p.position.y = this.baseY + Math.sin(t * 5 + this.phase) * 0.5; b.rotation.z += 6 * dt; this.tail.forEach((s, i) => { s.position.set(-this.dir * (0.25 + i * 0.22), Math.sin((t - i * 0.05) * 5 + this.phase) * 0.5 - Math.sin(t * 5 + this.phase) * 0.5 + i * 0.03, 0); }); }
        else { p.position.y = 1.35 + Math.abs(Math.sin(t * 9)) * 0.35; b.rotation.z = Math.sin(t * 9) * 0.12; if (this.legs) this.legs.forEach((l, i) => { l.rotation.z = Math.sin(t * 18 + i * 1.6) * 0.5; }); }
        if (Math.abs(p.position.x) > 15.5) this.remove();
        break;
      }
      case 'hop': {   // Mini Stars bounce across the grass and tire out after a few hops
        this.hopV -= BAL.gravity * 0.6 * dt; this.hopY += this.hopV * dt; p.position.addScaledVector(this.hopDir, dt);
        if (this.hopY <= 0) { this.hopY = 0; this.hops++; this.hopV = Math.max(1.5, 4.5 - this.hops * 0.5); this.hopDir.multiplyScalar(0.85); if (Math.abs(p.position.x) > 13 || p.position.z < -23 || p.position.z > 1) this.hopDir.negate(); }
        p.position.y = 0.25 + this.hopY; b.rotation.y += 3 * dt; b.rotation.z = Math.sin(t * 8) * 0.2;
        if (this.hops > 9) this.remove();
        break;
      }
      case 'dart': {
        const a = t * 2.6 * sp + this.phase;
        p.position.set(this.center.x + Math.cos(a) * this.orbit, this.center.y + Math.sin(a * 2) * 0.4 + 0.1, this.center.z + Math.sin(a) * this.orbit * 0.6);
        b.rotation.y = Math.sin(a) * 0.6; b.position.y = -0.1; break;
      }
      case 'toss': {
        this.vel.y -= 9.8 * dt; p.position.addScaledVector(this.vel, dt); b.rotation.y += 5 * dt; b.rotation.z += 2 * dt;
        this.setOpen(Math.abs(this.vel.y) < 2.6);  // the short Open Window around the apex (§8)
        if (p.position.y < -1) this.remove();
        break;
      }
    }
    if (this.clockwork && this.kindId === 'skull') {
      this.cycleT += dt; const win = D.openWindow(); const cyc = BAL.open_cycle;
      if (this.cycleT > cyc) this.cycleT -= cyc;
      this.setOpen(this.cycleT < win);
    }
    if (this.layered) {
      const streak = RUN.streak; this.doorCycle = Math.max(0.9, 2.2 / (1 + 0.08 * streak));  // holding a Streak speeds the cycle (§7)
      this.doorT += dt;
      if (this.doorT > this.doorCycle) { this.doorT = 0; this.doorIndex = (this.doorIndex + 1) % 3; }
      const g = this.layerGroups[this.layerIndex];
      g.userData.doors.forEach((d, i) => { const on = i === this.doorIndex; d.scale.setScalar(on ? this.sweetScale * RUN.burstScale : 0.001); const pl = d.userData.plate; pl.position.copy(pl.userData.basePos); if (on) pl.position.y -= 1.0; });
    }
    if (this.open && this.sweetMeshes.length && !this.layered) { const e = 0.5 + 0.4 * Math.sin(t * 6 + this.phase); for (const m of this.sweetMeshes) if (m.material.emissiveIntensity !== undefined) m.material.emissiveIntensity = e; }
    if (this.life) { this.life -= dt; const s = this.life < 1 ? 0.6 + 0.4 * Math.abs(Math.sin(this.life * 20)) : 1; this.body.scale.setScalar(s * this.baseScale); if (this.life <= 0) this.remove(); }
  }

  // a Body Hit shoves the piñata: it swings off, spins, and (for bouncers) hops
  kick(point, mult) {
    mult = (mult || 1) * (this.armor ? 0.25 : 1);   // the Tin Bull barely budges
    if (this.k.spicy) { this.heatLevel = (this.heatLevel || 0) + 1; this.speed *= 1.35; this.candyBase = Math.round(this.candyBase * 1.4); }   // Chile Bravo: angrier and richer with every Body Hit
    if (this.kindId === 'luchador' && this.slot && !this.dropped) { this.dropped = true; this.stringLen += 0.9; this.body.position.y = -this.stringLen; if (this.stringMesh) { this.stringMesh.scale.y = this.stringLen / 0.9; this.stringMesh.position.y = -this.stringLen / 2; } }   // El Luchador drops from the rope
    const w = this.worldPos(); const side = point && point.x < w.x ? 1 : -1;
    this.angVel += side * (1.6 + Math.random() * 0.8) * mult; this.spinVel += (Math.random() - 0.5) * 8 * mult;
    if (this.behavior === 'bounce') this.bounceV += 3.5 * mult;
    if (this.behavior === 'zip' && mult > 1) this.zipT += 0.6 * (mult - 1);
    if (this.behavior === 'still') { this.behavior = 'swing'; this.moving = true; }
    if (this.behavior === 'dart') this.orbit = Math.min(2.2, this.orbit + 0.4);
  }

  remove() {
    if (!this.alive) return; this.alive = false;
    if (this.slot) this.slot.taken = null;
    scene.remove(this.pivot);
    const i = pinatas.indexOf(this); if (i >= 0) pinatas.splice(i, 1);
  }
}

function spawnPinata(kindId, opts) { return new Pinata(kindId, opts); }

// Which kinds may hang at the current Tier, with weights.
// `opts.buenas` deja fuera al Spiker y a la Bomba de Brillantina: se usa para el relevo de una
// piñata mala que se apago sola, para que el patio no encadene dos "no dispares" en el mismo sitio.
function pickKind(opts) {
  // Only invited piñatas hang (the Piñatas branch of the Tree). The Star is always at the party.
  const tier = D.tier();
  const pool = [['star', tier >= 3 ? 2 : 3], ['donkey', tier >= 3 ? 2 : 4], ['burro', 3], ['sun', 2.5], ['bull', 2], ['cactus', 2.2], ['chili', 2], ['luchador', 1.8], ['cluster', 1.8], ['nest', 2.2], ['armored', 1.4], ['glass', 2.4], ['skull', 2.2]].filter(([k]) => D.kindUnlocked(k));
  if (!(opts && opts.buenas)) {
    if (tier >= 3) pool.push(['glitter', 0.9]);   // the decoy needs no invitation
    if (tier >= 2 || S.party.runCount >= 4) pool.push(['spiker', 1.1]);   // nor does the hazard
  }
  let tot = pool.reduce((a, p) => a + p[1], 0), r = Math.random() * tot;
  for (const [k, w] of pool) { r -= w; if (r <= 0) return k; }
  return 'star';
}
function spawnHanging(kindId) {
  const slot = freeSlot(D.tier() >= 3);
  if (!slot) return null;
  const kind = kindId || pickKind(); const opts = { slot }; const tier = D.tier();
  // livelier piñatas roll in at random as the Party grows (never more Health, §9): a few dart along the line from Tier 2, hop from Tier 3
  if (['donkey', 'star', 'burro', 'bull', 'nest', 'cactus', 'sun', 'cluster', 'chili', 'luchador'].includes(kind)) {
    const r = Math.random(); const zipP = tier >= 3 ? 0.45 : tier >= 2 ? 0.22 : 0, bounceP = tier >= 4 ? 0.3 : tier >= 3 ? 0.15 : 0;
    if (r < bounceP) opts.behavior = 'bounce'; else if (r < bounceP + zipP) opts.behavior = 'zip';
  }
  return spawnPinata(kind, opts);
}
// The Sugar Comet streaks along a line for ~3 s: hit it for ×5 Candy and a fat slice of time
function spawnComet() {
  const dir = Math.random() < 0.5 ? 1 : -1; const L = [-5, -10, -16][Math.floor(Math.random() * 3)];
  const p = spawnPinata('comet', { position: new THREE.Vector3(-dir * 14, 0, L), stringLen: 0, bodyScale: 1.2 });
  p.dir = dir; p.gallopSpeed = 9 + D.tier(); p.baseY = L === -5 ? 2.3 : L === -10 ? 2.7 : 3.1; p.moving = true; p.phase = Math.random() * 6;
  return p;
}
// the Cluster Ball scatters Mini Stars across the grass
function releaseMinis(parent) {
  const c = parent.worldPos(); const out = [];
  for (let i = 0; i < (parent.k.cluster || 4); i++) { const m = spawnPinata('mini', { position: new THREE.Vector3(c.x + (Math.random() - 0.5) * 0.6, c.y, c.z + (Math.random() - 0.5) * 0.4), stringLen: 0, bodyScale: 1 }); m.hopY = c.y - 0.25; m.hopV = 1 + Math.random() * 2; out.push(m); }
  return out;
}
// The Lucky Llama enters from one side fence at line height and sprints to the other
function spawnLlama() {
  const dir = Math.random() < 0.5 ? 1 : -1; const z = [-7.5, -12.5][Math.floor(Math.random() * 2)];
  const p = spawnPinata('llama', { position: new THREE.Vector3(-dir * 15, 1.4, z), stringLen: 0, bodyScale: 1.1 });
  p.dir = dir; p.gallopSpeed = 4.2 + D.tier() * 0.5; p.body.rotation.y = dir > 0 ? 0 : Math.PI; p.moving = true;
  return p;
}
function releaseNestlets(parent) {
  const center = parent.worldPos(); const n = D.nestlets(); const out = [];
  for (let i = 0; i < n; i++) out.push(spawnPinata('nestlet', { position: center, center, behavior: 'dart', speed: 1 + i * 0.1, stringLen: 0.1 }));
  out.forEach((p, i) => { p.phase = i / n * Math.PI * 2; });
  return out;
}
// Un tiro del lanzador. Angulo y fuerza salen a suerte dentro de BAL.toss, asi que no hay dos
// arcos iguales y hay que leer cada uno: es lo que convierte al lanzador en un objetivo y no en
// un adorno. Va alto de verdad — cruza por encima de las lineas de piñatas, y que los banderines
// lo tapen medio segundo es parte de la gracia, no un problema que haya que evitar bajando el tiro.
function spawnToss() {
  const L = window.LANZADORES[Math.floor(Math.random() * window.LANZADORES.length)];
  const p = spawnPinata('toss', { position: L.boca.clone(), stringLen: 0, sweetScale: 1.1 });
  const T = BAL.toss;
  const fuerza = T.speed[0] + Math.random() * (T.speed[1] - T.speed[0]);
  const alza = (T.angle[0] + Math.random() * (T.angle[1] - T.angle[0])) * Math.PI / 180;
  // La componente en z tira hacia la linea de tiro: los tiros cruzan por delante del jugador
  // en vez de morir al fondo del patio, donde no se ven.
  p.vel = new THREE.Vector3(
    Math.cos(alza) * fuerza * L.dir,
    Math.sin(alza) * fuerza,
    T.toward[0] + Math.random() * (T.toward[1] - T.toward[0]));
  p.setOpen(false);
  return p;
}
// the launcher fires a volley: 1–3 piñatas (more with the Eager launcher node), a few frames apart
function launcherVolley() {
  const n = 1 + Math.floor(Math.random() * 2) + (rank('launcher') ? 1 : 0);
  for (let i = 0; i < n; i++) setTimeout(() => { if (RUN.active) spawnToss(); }, i * 260);
  return n;
}
function clearPinatas() { while (pinatas.length) pinatas[pinatas.length - 1].remove(); HANG.forEach(h => h.taken = null); }
