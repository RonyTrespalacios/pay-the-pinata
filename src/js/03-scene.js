// ---------- THREE.JS SCENE: the Backyard ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ccbf2);
scene.fog = new THREE.Fog(0xa9d8f5, 40, 110);

const camera = new THREE.PerspectiveCamera(BAL.fov_vertical, 1, 0.05, 160);   // 103° horizontal on 16:9, like Valorant
const FIRING_LINE = new THREE.Vector3(0, 1.6, 2.2);       // where the Host stands during a Run
const EYE = 1.6;
camera.position.set(0, EYE, 3.4);
const look = { yaw: 0, pitch: 0.1, tYaw: 0, tPitch: 0.1 };

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// ---- lights ----
const hemi = new THREE.HemisphereLight(0xfff4dc, 0x4f8a34, 0.55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1cf, 1.05);
sun.position.set(-10, 18, 8); sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -24; sun.shadow.camera.right = 24; sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 60; sun.shadow.bias = -0.0012;
scene.add(sun);

// ---- helpers ----
const _c = new THREE.Color();
function shade(hex, f) { _c.setHex(hex); _c.offsetHSL(0, 0, f); return _c.getHex(); }
const hexStr = h => '#' + h.toString(16).padStart(6, '0');
const texCache = {};
function canvasTex(key, w, h, draw, repeat) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  texCache[key] = t; return t;
}
// crepe-paper fringe: rows of scallops in two shades
function crepeTexture(hex) {
  return canvasTex('crepe' + hex, 64, 64, (g) => {
    const a = hexStr(hex), b = hexStr(shade(hex, 0.12)), d = hexStr(shade(hex, -0.2));
    for (let y = 0; y < 64; y += 8) {
      g.fillStyle = (y / 8) % 2 ? a : b; g.fillRect(0, y, 64, 8);
      g.fillStyle = d; g.fillRect(0, y + 6, 64, 2);
      g.fillStyle = (y / 8) % 2 ? b : a;
      for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, y + 7, 3, 0, Math.PI); g.fill(); }
    }
  }, [3, 3]);
}
const grassTex = canvasTex('grass', 128, 128, (g) => {
  g.fillStyle = '#5da449'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = ['#4f9a3d', '#69b453', '#579f45', '#78bd5c'][i % 4]; const x = Math.random() * 128, y = Math.random() * 128; g.fillRect(x, y, 2, 4 + Math.random() * 4); }
}, [40, 40]);
const slabTex = canvasTex('slab', 128, 128, (g) => {
  g.fillStyle = '#d9c7a8'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#bfae8f'; g.lineWidth = 3; g.strokeRect(1, 1, 126, 126);
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3); }
}, [4, 3]);
const woodTex = canvasTex('wood', 64, 64, (g) => { g.fillStyle = '#b8865b'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#a9784f' : '#c2916a'; g.fillRect(0, i * 6, 64, 3); } }, [1, 4]);
const wallTex = canvasTex('wall', 64, 64, (g) => { g.fillStyle = '#f6e3c8'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#e8d1b0'; g.lineWidth = 2; for (let y = 0; y < 64; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); } }, [6, 3]);
const polkaTexture = (hex, dot) => canvasTex('polka' + hex + dot, 64, 64, (g) => { g.fillStyle = hexStr(hex); g.fillRect(0, 0, 64, 64); g.fillStyle = hexStr(dot); [[16, 16], [48, 16], [32, 40], [0, 48], [64, 48]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }); }, [4, 3]);
const stripeTexture = (a, b) => canvasTex('stripe' + a + b, 64, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = hexStr(i % 2 ? a : b); g.fillRect(i * 8, 0, 8, 64); } }, [4, 1]);

function crepeMat(hex, opts) { return new THREE.MeshStandardMaterial(Object.assign({ map: crepeTexture(hex), roughness: 0.9, metalness: 0 }, opts || {})); }
function flatMat(hex, opts) { return new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.85, metalness: 0 }, opts || {})); }
function sweetMat(hex) { return new THREE.MeshStandardMaterial({ color: hex || 0xff2d78, emissive: hex || 0xff2d78, emissiveIntensity: 0.6, roughness: 0.35 }); }
function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; return m; }
function sphere(r, mat, x, y, z, seg) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 18, seg || 14), mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; return m; }
function cyl(rt, rb, h, mat, x, y, z, seg) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; return m; }
function cone(r, h, mat, x, y, z, seg) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 10), mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; return m; }
function torus(r, t, mat, x, y, z) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 24), mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; return m; }
// a stack of slightly offset crepe bands: reads as layered fringe paper
function fringedBox(w, h, d, hex, rows) {
  const g = new THREE.Group(); rows = rows || 5; const rh = h / rows;
  for (let i = 0; i < rows; i++) { const col = i % 2 ? shade(hex, 0.1) : hex; const m = box(w + (i % 2 ? 0.02 : 0), rh + 0.015, d + (i % 2 ? 0.02 : 0), crepeMat(col), 0, -h / 2 + rh / 2 + i * rh, 0); g.add(m); }
  return g;
}
function fringedCyl(r, h, hex, rows) {
  const g = new THREE.Group(); rows = rows || 5; const rh = h / rows;
  for (let i = 0; i < rows; i++) { const col = i % 2 ? shade(hex, 0.1) : hex; g.add(cyl(r + (i % 2 ? 0.015 : 0), r + (i % 2 ? 0.015 : 0), rh + 0.012, crepeMat(col), 0, -h / 2 + rh / 2 + i * rh, 0, 16)); }
  return g;
}
function tassel(hex, len) { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = box(0.03, len, 0.01, flatMat(hex), (i - 2) * 0.03, -len / 2, 0); s.rotation.z = (i - 2) * 0.12; g.add(s); } return g; }

// ---- The Backyard ----
const yard = new THREE.Group(); scene.add(yard);
const decor = { tier: 0, groups: [] };
const HANG = [];            // hang slots for piñatas: { x, y, z, line, taken }
const OBSTACLES = [];       // walking collision: { x, z, r } circles or { x0, z0, x1, z1 } rects
const WORLD = { minX: -13.2, maxX: 13.2, minZ: -22.8, maxZ: 5.6 };
function blockCircle(x, z, r) { OBSTACLES.push({ x, z, r }); }
function blockRect(x0, z0, x1, z1) { OBSTACLES.push({ x0, z0, x1, z1 }); }

function makeTable(x, z, clothHex, w, d) {
  w = w || 1.9; d = d || 0.95;
  const t = new THREE.Group();
  t.add(box(w, 0.06, d, new THREE.MeshStandardMaterial({ map: stripeTexture(clothHex, 0xffffff), roughness: 0.9 }), 0, 0.78, 0));
  // cloth hanging edges
  t.add(box(w + 0.04, 0.22, 0.02, flatMat(clothHex), 0, 0.66, d / 2)); t.add(box(w + 0.04, 0.22, 0.02, flatMat(clothHex), 0, 0.66, -d / 2));
  t.add(box(0.02, 0.22, d, flatMat(clothHex), -w / 2, 0.66, 0)); t.add(box(0.02, 0.22, d, flatMat(clothHex), w / 2, 0.66, 0));
  const legMat = flatMat(0x6f6f6f, { metalness: 0.4, roughness: 0.5 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => t.add(box(0.05, 0.75, 0.05, legMat, sx * (w / 2 - 0.12), 0.37, sz * (d / 2 - 0.1))));
  t.position.set(x, 0, z); blockCircle(x, z, Math.max(w, d) / 2 + 0.25); return t;
}
function makeTree(x, z, s) {
  s = s || 1; const tr = new THREE.Group();
  tr.add(cyl(0.2 * s, 0.32 * s, 2.6 * s, new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8d6a45, roughness: 1 }), 0, 1.3 * s, 0));
  [[0, 3.4, 0, 1.7], [1.1, 2.9, 0.5, 1.2], [-1.0, 3.0, -0.4, 1.15], [0.2, 4.4, -0.3, 1.1], [-0.4, 2.6, 0.9, 0.9]].forEach(([dx, dy, dz, r], i) => tr.add(sphere(r * s, flatMat([0x4e9339, 0x5ea548, 0x468a33, 0x67b04f, 0x529c3f][i]), dx * s, dy * s, dz * s, 12)));
  tr.position.set(x, 0, z); blockCircle(x, z, 0.5 * s); return tr;
}
function makeBush(x, z, s) { const g = new THREE.Group(); [[0, 0.45, 0, 0.55], [0.4, 0.35, 0.2, 0.4], [-0.35, 0.35, -0.2, 0.42]].forEach(([dx, dy, dz, r]) => g.add(sphere(r * s, flatMat(0x5aa645), dx * s, dy * s, dz * s, 10))); g.position.set(x, 0, z); return g; }
function makeCloud(x, y, z, s) { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }); [[0, 0, 0, 1.6], [1.6, 0.2, 0, 1.2], [-1.5, 0.1, 0.2, 1.1], [0.6, 0.8, -0.2, 1.0], [-0.6, 0.7, 0.1, 0.9]].forEach(([dx, dy, dz, r]) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r * s, 10, 8), m); c.position.set(dx * s, dy * s, dz * s); g.add(c); }); g.position.set(x, y, z); return g; }

(function buildYard() {
  // ground + hills + clouds
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; yard.add(grass);
  [[-30, -60, 26], [10, -70, 30], [45, -55, 22], [-60, -40, 20], [70, -20, 18]].forEach(([x, z, r]) => { const h = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), flatMat(0x79b463)); h.scale.y = 0.35; h.position.set(x, -2, z); yard.add(h); });
  [[-20, 22, -50, 2.2], [15, 26, -60, 2.8], [40, 20, -30, 1.8], [-45, 24, -20, 2.4], [5, 30, -90, 3.5]].forEach(([x, y, z, s]) => yard.add(makeCloud(x, y, z, s)));
  // patio slab + firing line (chalk)
  const slab = box(7, 0.12, 5.2, new THREE.MeshStandardMaterial({ map: slabTex, roughness: 0.95 }), 0, 0.06, 3.2); yard.add(slab);
  const chalk = box(3, 0.01, 0.08, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0.125, FIRING_LINE.z); yard.add(chalk);
  [[-1.5], [1.5]].forEach(([x]) => { const c = cone(0.16, 0.42, flatMat(0xff8c42), x, 0.33, FIRING_LINE.z); yard.add(c); yard.add(box(0.36, 0.02, 0.36, flatMat(0xff8c42), x, 0.13, FIRING_LINE.z)); yard.add(box(0.28, 0.06, 0.28, flatMat(0xffffff), x, 0.28, FIRING_LINE.z)); });
  // fence (three sides) + gate at the back
  const fenceMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xc9a071, roughness: 1 });
  const picket = (x, z, rot) => { const p = box(0.16, 1.5, 0.05, fenceMat, x, 0.75, z); p.rotation.y = rot; yard.add(p); const tip = cone(0.1, 0.16, fenceMat, x, 1.58, z); tip.rotation.y = rot; tip.scale.set(1.2, 1, 0.5); yard.add(tip); };
  for (let x = -14; x <= 14; x += 0.55) if (Math.abs(x) > 1.2) picket(x, -24, 0);
  [-24].forEach(z => { yard.add(box(28.5, 0.12, 0.06, fenceMat, 0, 1.15, z - 0.04)); yard.add(box(28.5, 0.12, 0.06, fenceMat, 0, 0.45, z - 0.04)); });
  for (let z = -24; z <= 6; z += 0.55) { picket(-14.2, z, Math.PI / 2); picket(14.2, z, Math.PI / 2); }
  [-14.24, 14.24].forEach(x => { yard.add(box(0.06, 0.12, 30.5, fenceMat, x, 1.15, -9)); yard.add(box(0.06, 0.12, 30.5, fenceMat, x, 0.45, -9)); });
  const gate = new THREE.Group(); gate.add(box(2.3, 1.4, 0.06, fenceMat, 0, 0.75, 0)); gate.add(torus(0.5, 0.05, flatMat(0xffd23f), 0, 0.9, 0.05)); gate.position.set(0, 0, -24); yard.add(gate);
  // the house with a porch, door, windows and a porch light
  const house = new THREE.Group();
  house.add(box(10, 3.4, 6, new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }), 0, 1.7, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.6, 4), flatMat(0xb5462e)); roof.rotation.y = Math.PI / 4; roof.position.y = 4.65; roof.castShadow = true; house.add(roof);
  house.add(box(0.9, 1.4, 0.9, flatMat(0x8f5a3c), 2.2, 5.2, -1.2)); // chimney
  house.add(box(0.1, 2.1, 1.0, flatMat(0x8a4b2b), -5.02, 1.05, 0.6));          // door on the yard-facing wall
  house.add(sphere(0.06, flatMat(0xffd23f, { metalness: 0.6 }), -5.08, 1.05, 0.95));
  [[-5.02, 2.0, -1.6], [-5.02, 2.0, 2.2], [-2, 2.0, 3.02], [2, 2.0, 3.02]].forEach(([x, y, z]) => { const w = box(x < -5 ? 0.1 : 1.1, 1.0, x < -5 ? 1.1 : 0.1, new THREE.MeshStandardMaterial({ color: 0x9ed6ee, emissive: 0x224455, roughness: 0.2, metalness: 0.3 }), x, y, z); house.add(w); const f = box(x < -5 ? 0.14 : 1.24, 1.14, x < -5 ? 1.24 : 0.14, flatMat(0xffffff), x + (x < -5 ? 0.01 : 0), y, z + (x < -5 ? 0 : 0.01)); f.scale.multiplyScalar(0.98); house.add(f); });
  // porch: deck + posts + rail + porch light + switch plate
  house.add(box(2.6, 0.25, 6.2, new THREE.MeshStandardMaterial({ map: woodTex, color: 0xd6a878 }), -6.3, 0.125, 0));
  [[-7.5, -2.9], [-7.5, 2.9]].forEach(([x, z]) => house.add(box(0.14, 2.6, 0.14, flatMat(0xffffff), x, 1.55, z)));
  house.add(box(2.8, 0.14, 6.3, flatMat(0xffffff), -6.4, 2.85, 0));
  house.add(box(0.08, 0.9, 2.1, flatMat(0xffffff), -7.5, 0.7, -1.85)); house.add(box(0.08, 0.9, 2.1, flatMat(0xffffff), -7.5, 0.7, 1.85));   // the rail leaves a gap: you can step up onto the porch
  house.add(box(0.9, 0.12, 1.4, new THREE.MeshStandardMaterial({ map: woodTex, color: 0xd6a878 }), -7.9, 0.06, 0));   // a step
  const lamp = new THREE.Group(); lamp.add(box(0.2, 0.3, 0.2, new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffc94a, emissiveIntensity: 0.9 }), 0, 0, 0)); lamp.add(box(0.3, 0.05, 0.3, flatMat(0x333), 0, 0.18, 0)); lamp.position.set(-5.2, 2.45, 0.6); house.add(lamp);
  const porchLight = new THREE.PointLight(0xffd27a, 0.7, 9); porchLight.position.set(-5.6, 2.3, 0.6); house.add(porchLight); window.PORCH_LIGHT = porchLight;
  const plate = box(0.06, 0.34, 0.24, flatMat(0xfff4e0), -5.03, 1.45, -0.6); house.add(plate); const sw = box(0.08, 0.14, 0.06, flatMat(0xe63946), -5.06, 1.45, -0.6); house.add(sw);
  house.position.set(12.2, 0, 0.5); yard.add(house);
  window.HOUSE_SWITCH = new THREE.Vector3(12.2 - 5.06, 1.45, 0.5 - 0.6);
  blockRect(12.2 - 5.0, 0.5 - 3.2, 30, 0.5 + 3.2);   // the house itself; the porch is walkable
  blockRect(12.2 - 7.55, 0.5 - 2.95, 12.2 - 7.45, 0.5 - 0.75); blockRect(12.2 - 7.55, 0.5 + 0.75, 12.2 - 7.45, 0.5 + 2.95);   // rail segments
  blockCircle(12.2 - 7.5, 0.5 - 2.9, 0.15); blockCircle(12.2 - 7.5, 0.5 + 2.9, 0.15);
  window.PORCH = { x0: 12.2 - 7.6, x1: 12.2 - 5.0, z0: 0.5 - 3.1, z1: 0.5 + 3.1, y: 0.25 };
  // La piscina de la fiesta: desmontable, de las de montar sobre el cesped.
  //
  // Aqui habia una piscina HUNDIDA tapada por una losa entera a ras de suelo, y desde fuera era
  // un rectangulo crema y nada mas — un trozo de patio en blanco que ademas cerraba el paso entre
  // la Tia y la valla. Hundida no se puede enseñar: el cesped es un unico plano macizo, asi que
  // por el agujero se ve el propio cesped, no el fondo. Puesta POR ENCIMA se ve entera, tiene
  // bulto, y lo que hay dentro cuenta la fiesta que lleva horas pasando.
  const pool = new THREE.Group();
  const ALTO = 1.15, SUELO = 0.14;                          // pared, y la cara de arriba del fondo
  const paredMat = flatMat(0xcdeef7), fondoMat = flatMat(0x8fd0e6), rimMat = flatMat(0x2a6fdb);
  pool.add(box(7, SUELO, 4, fondoMat, 0, SUELO / 2, 0));
  [[7.44, 0.22, 0, -2.11], [7.44, 0.22, 0, 2.11]].forEach(([w, d, x, z]) => pool.add(box(w, ALTO, d, paredMat, x, ALTO / 2, z)));
  [[0.22, 4.0, -3.61, 0], [0.22, 4.0, 3.61, 0]].forEach(([w, d, x, z]) => pool.add(box(w, ALTO, d, paredMat, x, ALTO / 2, z)));
  [[7.6, 0.32, 0, -2.11], [7.6, 0.32, 0, 2.11]].forEach(([w, d, x, z]) => pool.add(box(w, 0.12, d, rimMat, x, ALTO + 0.06, z)));
  [[0.32, 4.2, -3.61, 0], [0.32, 4.2, 3.61, 0]].forEach(([w, d, x, z]) => pool.add(box(w, 0.12, d, rimMat, x, ALTO + 0.06, z)));
  // escalerilla por fuera, en el lado que mira al patio
  const lad = flatMat(0xdddddd, { metalness: 0.6, roughness: 0.3 });
  [0.3, -0.3].forEach(z => pool.add(cyl(0.035, 0.035, 1.7, lad, 3.95, 0.85, z)));
  [0.35, 0.75, 1.15].forEach(y => pool.add(box(0.66, 0.05, 0.05, lad, 3.95, y, 0)));
  // Lo que queda en una piscina vacia a media fiesta: flotadores, churros, la pelota, vasos,
  // un cubo, y una piñata que ya reventó y nadie ha recogido.
  const suelo = SUELO + 0.02;
  const ring = torus(0.5, 0.18, new THREE.MeshStandardMaterial({ map: stripeTexture(0xff5ea8, 0xffffff) }), -1.1, suelo + 0.16, 0.5); ring.rotation.x = Math.PI / 2; pool.add(ring);
  const ring2 = torus(0.42, 0.15, new THREE.MeshStandardMaterial({ map: stripeTexture(0xffd23f, 0x2ec4b6) }), 1.9, suelo + 0.4, -1.15); ring2.rotation.set(Math.PI / 2, 0, 0.35); pool.add(ring2);
  [[-2.5, 0.9, 0.5, 0xff8c42], [-2.2, -0.8, 1.9, 0x7b5ea7], [0.7, 1.2, -0.4, 0x2ec4b6]].forEach(([x, z, rot, c]) => {
    const n = cyl(0.09, 0.09, 2.2, flatMat(c), x, suelo + 0.09, z, 10); n.rotation.set(Math.PI / 2, 0, rot); pool.add(n);
  });
  pool.add(sphere(0.24, new THREE.MeshStandardMaterial({ map: stripeTexture(0xff5ea8, 0xffffff) }), 2.7, suelo + 0.24, 1.2, 14));
  pool.add(cyl(0.22, 0.17, 0.34, flatMat(0xffd23f), -3.0, suelo + 0.17, -1.35, 12));
  [[-0.5, -1.5], [0.2, -1.7], [1.5, 0.6], [-1.7, 1.5]].forEach(([x, z]) => pool.add(cyl(0.07, 0.05, 0.13, flatMat(0xff5ea8), x, suelo + 0.065, z, 8)));
  const rota = new THREE.Group();
  rota.add(sphere(0.26, crepeMat(0x7b5ea7), 0, 0, 0, 12));
  [0, 2.1, 4.2].forEach(a => { const c = cone(0.11, 0.34, crepeMat(0xffd23f), Math.cos(a) * 0.3, Math.sin(a) * 0.18, 0, 8); c.rotation.z = a - Math.PI / 2; rota.add(c); });
  rota.position.set(1.2, suelo + 0.22, 1.6); rota.rotation.set(1.4, 0.7, 0.3); pool.add(rota);
  // el letrero de "no bucear", clavado fuera y torcido
  const letrero = new THREE.Group();
  letrero.add(cyl(0.03, 0.03, 1.5, flatMat(0xdddddd), 0, 0.75, 0));
  letrero.add(box(0.5, 0.34, 0.03, flatMat(0xfff4e0), 0, 1.55, 0));
  letrero.add(box(0.42, 0.06, 0.04, flatMat(0xe63946), 0, 1.55, 0.02));
  letrero.position.set(3.3, 0, 2.6); letrero.rotation.set(0, 0.4, 0.1); pool.add(letrero);
  // Pegada a la valla oeste, y el bloqueo ajustado al bulto: entre la piscina y la Tia queda un
  // paso de sobra, que antes eran diez centimetros y no cabia nadie.
  pool.position.set(-9.6, 0, -5.2); yard.add(pool); blockRect(-13.2, -7.4, -5.9, -3.0);
  // picnic set, grill, cooler, chairs
  yard.add(makeTable(7, -9, 0x2ec4b6)); yard.add(makeTable(-7, -12.5, 0x7b5ea7));
  const grill = new THREE.Group(); grill.add(sphere(0.42, flatMat(0x222, { metalness: 0.5, roughness: 0.4 }), 0, 0.9, 0)); grill.add(cyl(0.02, 0.02, 0.8, flatMat(0x333), -0.25, 0.4, 0.2)); grill.add(cyl(0.02, 0.02, 0.8, flatMat(0x333), 0.25, 0.4, 0.2)); grill.add(cyl(0.02, 0.02, 0.8, flatMat(0x333), 0, 0.4, -0.3)); grill.position.set(9.5, 0, -4); yard.add(grill); blockCircle(9.5, -4, 0.6);
  const cooler = box(0.7, 0.5, 0.45, flatMat(0x2a6fdb), 5.2, 0.25, 4.5); yard.add(cooler); yard.add(box(0.74, 0.08, 0.49, flatMat(0xffffff), 5.2, 0.52, 4.5)); blockCircle(5.2, 4.5, 0.5);
  [[-2.6, 4.6, 0.3], [2.4, 4.7, -0.4]].forEach(([x, z, rot]) => { const ch = new THREE.Group(); ch.add(box(0.5, 0.05, 0.5, flatMat(0xff8c42), 0, 0.45, 0)); ch.add(box(0.5, 0.5, 0.05, flatMat(0xff8c42), 0, 0.7, -0.24)); [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(([a, b]) => ch.add(box(0.04, 0.45, 0.04, flatMat(0xeee), a, 0.22, b))); ch.position.set(x, 0, z); ch.rotation.y = rot; yard.add(ch); blockCircle(x, z, 0.4); });
  // trees & bushes
  yard.add(makeTree(-12, -18, 1.1)); yard.add(makeTree(12.5, -17, 1)); yard.add(makeTree(-12.5, -10.5, 0.9)); yard.add(makeTree(11, -21, 0.8));
  [[-13, 2], [-11, 4], [13, -8], [-3, -22.5], [4, -22.5], [12.5, -12]].forEach(([x, z]) => yard.add(makeBush(x, z, 1)));
  // piñata lines: posts, rope, wired bulbs, papel picado
  const LINES = [
    { z: -5, y: 2.7, xs: [-3.6, -1.8, 0, 1.8, 3.6], half: 5.5 },
    { z: -10, y: 3.1, xs: [-6, -3, 0, 3, 6], half: 8.5 },
    { z: -16, y: 3.5, xs: [-8, -4, 0, 4, 8], half: 11 },
  ];
  const cols = [0xff5ea8, 0xffd23f, 0x2ec4b6, 0xff8c42, 0x7b5ea7];
  LINES.forEach((L, li) => {
    const postMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xa0704a });
    [-L.half, L.half].forEach(x => { yard.add(cyl(0.1, 0.13, L.y + 0.5, postMat, x, (L.y + 0.5) / 2, L.z)); yard.add(cone(0.16, 0.2, flatMat(0xffd23f), x, L.y + 0.6, L.z)); blockCircle(x, L.z, 0.35); });
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L.half * 2, 6), flatMat(0xe8d8b0)); rope.rotation.z = Math.PI / 2; rope.position.set(0, L.y + 0.15, L.z); yard.add(rope);
    // sagging wire with bulbs
    const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector3(-L.half + t * L.half * 2, L.y + 0.1 - Math.sin(t * Math.PI) * 0.45, L.z + 0.12)); }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 5), flatMat(0x2b2230)); yard.add(wire);
    for (let i = 1; i < 24; i += 2) { const p = pts[i]; const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: cols[i % 5], emissive: cols[i % 5], emissiveIntensity: 0.8 })); b.position.set(p.x, p.y - 0.1, p.z); yard.add(b); yard.add(cyl(0.03, 0.03, 0.06, flatMat(0x2b2230), p.x, p.y - 0.02, p.z, 6)); }
    L.xs.forEach(x => HANG.push({ x, y: L.y, z: L.z, line: li, taken: null }));
    for (let i = 0; i < Math.floor(L.half * 2 / 0.6); i++) { const x = -L.half + 0.3 + i * 0.6; const f = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshStandardMaterial({ color: cols[i % 5], side: THREE.DoubleSide })); f.position.set(x, L.y - 0.05, L.z + 0.42); f.rotation.x = 0.1; yard.add(f); const cut = new THREE.Mesh(new THREE.CircleGeometry(0.07, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })); cut.position.set(x, L.y - 0.05, L.z + 0.425); cut.rotation.x = 0.1; yard.add(cut); }
  });
  // bunting from the house to the first post
  const bpts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; bpts.push(new THREE.Vector3(6.5 - t * 12, 3.2 - Math.sin(t * Math.PI) * 0.6, 1.5 - t * 6.5)); }
  yard.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bpts), 16, 0.01, 4), flatMat(0xffffff)));
  bpts.forEach((p, i) => { if (i % 1 === 0) { const fl = cone(0.14, 0.32, new THREE.MeshStandardMaterial({ color: cols[i % 5], side: THREE.DoubleSide }), p.x, p.y - 0.18, p.z, 3); fl.rotation.x = Math.PI; yard.add(fl); } });
  // launcher (Piñata Toss)
  const launcher = new THREE.Group();
  launcher.add(box(1.3, 0.6, 0.9, flatMat(0x3a3a3a, { metalness: 0.3 }), 0, 0.3, 0));
  const barrel = cyl(0.2, 0.26, 1.5, new THREE.MeshStandardMaterial({ map: stripeTexture(0xff5ea8, 0xffd23f) }), 0, 0.9, 0); barrel.rotation.z = -0.9; barrel.position.set(0.35, 0.95, 0); launcher.add(barrel);
  [[-0.45, 0.4], [0.45, 0.4], [-0.45, -0.4], [0.45, -0.4]].forEach(([x, z]) => { const w = cyl(0.22, 0.22, 0.12, flatMat(0x222), x, 0.22, z, 12); w.rotation.x = Math.PI / 2; launcher.add(w); });
  // Dos lanzadores, uno en cada banda, apuntandose el uno al otro por encima del patio. Uno solo
  // dejaba todo el trafico de piñatas en la mitad izquierda; con los dos, los tiros cruzan por
  // delante desde los dos lados y el patio se lee entero.
  window.LANZADORES = [];
  [[-10, 1], [10, -1]].forEach(([x, dir]) => {
    const l = dir > 0 ? launcher : launcher.clone();
    l.position.set(x, 0, -12); l.rotation.y = dir > 0 ? 0 : Math.PI;
    yard.add(l); blockCircle(x, -12, 1);
    window.LANZADORES.push({ boca: new THREE.Vector3(x + dir * 0.6, 1.5, -12), dir });
  });
  window.LAUNCHER_POS = window.LANZADORES[0].boca;
})();

// The Backyard grows with the party (§1): more decoration per Tier
function growBackyard(tier) {
  if (tier <= decor.tier) return;
  const cols = [0xff5ea8, 0x2ec4b6, 0xffd23f, 0xff8c42, 0x7b5ea7];
  for (let t = decor.tier + 1; t <= tier; t++) {
    const g = new THREE.Group();
    if (t >= 2) { const neon = torus(1.0 + t * 0.15, 0.06, new THREE.MeshStandardMaterial({ color: cols[t % 5], emissive: cols[t % 5], emissiveIntensity: 0.6 }), -9 + t * 3.6, 6.2 + (t % 2) * 0.8, -23.5); g.add(neon); }
    if (t >= 3) for (let i = 0; i < 6; i++) { const x = -12 + i * 4.8 + (t % 2) * 1.5, y = 6.5 + (i % 3) * 0.6 + t * 0.3, z = -21 + (i % 2) * 1.5; g.add(sphere(0.38, flatMat(cols[(i + t) % 5], { roughness: 0.4 }), x, y, z, 12)); g.add(cyl(0.006, 0.006, 3, flatMat(0xffffff), x, y - 1.9, z, 4)); }
    if (t >= 4) { const light = new THREE.PointLight(cols[t % 5], 1.0, 25); light.position.set((t % 2 ? -1 : 1) * 6, 5, -12); g.add(light); }
    yard.add(g); decor.groups.push(g);
  }
  decor.tier = tier;
}
function freeSlot(preferFar) {
  // with only the Peashooter, nothing hangs beyond its reach: the near line, and the middle of the second
  const reach = D.starterOnly() ? (h => h.line === 0 || (h.line === 1 && Math.abs(h.x) <= 3.1)) : (() => true);
  let free = HANG.filter(h => !h.taken && reach(h)); if (!free.length && !D.starterOnly()) free = HANG.filter(h => !h.taken);
  if (!free.length) return null;
  const weights = free.map(h => preferFar ? [1, 2.2, 3.2][h.line] : [3, 1.8, 0.7][h.line]);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < free.length; i++) { r -= weights[i]; if (r <= 0) return free[i]; }
  return free[free.length - 1];
}

// ---- Weapons view models (the Host is hands and gun only, §1) ----
const gunRig = new THREE.Group(); camera.add(gunRig); scene.add(camera);
const gunParts = {};
function buildGunModel(weapon, forDisplay) {
  const g = new THREE.Group();
  const col = weapon.color;
  const body = flatMat(col, { roughness: 0.45, metalness: 0.25 }), dark = flatMat(0x2b2230, { roughness: 0.55, metalness: 0.3 }), wood = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xb07a4c, roughness: 0.8 }), brass = flatMat(0xffd23f, { metalness: 0.7, roughness: 0.3 }), white = flatMat(0xfff4e0);
  if (weapon.id === 'pea') {
    // the Peashooter: a charming toy — a tapered green barrel with a flared muzzle, a glass hopper of peas, and a wooden grip
    const litegreen = flatMat(0x9ee07f, { roughness: 0.5 }), pea = flatMat(0x5fb04a), peaLite = flatMat(0x7cc85f);
    // tapered main barrel pointing forward (−z)
    const barrel = cyl(0.058, 0.046, 0.5, body, 0, 0.065, -0.22); barrel.rotation.x = Math.PI / 2; g.add(barrel);
    // flared bell muzzle at the front
    const flare = cyl(0.095, 0.055, 0.1, body, 0, 0.065, -0.5); flare.rotation.x = Math.PI / 2; g.add(flare);
    g.add(torus(0.088, 0.016, brass, 0, 0.065, -0.53, 6, 14)); // muzzle rim
    // brass bands + front sight bead
    g.add(torus(0.052, 0.013, brass, 0, 0.065, -0.34, 6, 14)); g.add(torus(0.056, 0.013, brass, 0, 0.065, -0.12, 6, 14));
    g.add(sphere(0.014, brass, 0, 0.128, -0.5, 8));
    // receiver block under the hopper
    g.add(box(0.085, 0.1, 0.17, body, 0, 0.02, -0.04));
    // glass hopper full of peas, on top
    const hop = sphere(0.08, litegreen, 0, 0.15, -0.08, 14); hop.scale.set(1, 0.92, 1.12); hop.material.transparent = true; hop.material.opacity = 0.55; g.add(hop);
    g.add(cyl(0.045, 0.055, 0.06, body, 0, 0.1, -0.08, 12)); // hopper neck
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.add(sphere(0.021, i % 2 ? pea : peaLite, Math.cos(a) * 0.035, 0.135 + (i % 3) * 0.02, -0.08 + Math.sin(a) * 0.035, 6)); }
    g.add(sphere(0.024, peaLite, 0, 0.2, -0.08, 8)); // a pea peeking out the top
    // wooden grip, angled back, with a rounded cap
    const grip = box(0.062, 0.18, 0.08, wood, 0, -0.08, 0.055); grip.rotation.x = 0.26; g.add(grip);
    g.add(box(0.07, 0.03, 0.09, wood, 0, 0.01, 0.045));
    g.add(sphere(0.04, wood, 0, -0.16, 0.08, 8));
    // trigger guard + trigger
    g.add(torus(0.036, 0.009, dark, 0, -0.02, 0.0, 6, 14)); g.add(box(0.012, 0.038, 0.012, brass, 0, -0.02, -0.02));
  } else if (weapon.id === 'pistol') {
    g.add(box(0.09, 0.1, 0.34, body, 0, 0.05, -0.1)); const bar = cyl(0.03, 0.03, 0.22, dark, 0, 0.07, -0.34); bar.rotation.x = Math.PI / 2; g.add(bar);
    g.add(box(0.02, 0.04, 0.02, brass, 0, 0.13, -0.42)); g.add(box(0.06, 0.03, 0.02, brass, 0, 0.12, 0.05));
    g.add(box(0.07, 0.18, 0.09, wood, 0, -0.08, 0.06)); const tg = torus(0.035, 0.008, dark, 0, -0.03, -0.02); g.add(tg); g.add(box(0.012, 0.04, 0.012, dark, 0, -0.03, -0.03));
    g.add(sphere(0.02, white, 0.05, 0.05, -0.2, 8)); g.add(sphere(0.02, white, -0.05, 0.05, -0.2, 8));
  } else if (weapon.id === 'six') {
    g.add(box(0.07, 0.08, 0.2, dark, 0, 0.05, 0.02)); const cylr = cyl(0.055, 0.055, 0.1, body, 0, 0.055, -0.06, 6); cylr.rotation.x = Math.PI / 2; g.add(cylr);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const h = cyl(0.012, 0.012, 0.11, dark, Math.cos(a) * 0.035, 0.055 + Math.sin(a) * 0.035, -0.06, 6); h.rotation.x = Math.PI / 2; g.add(h); }
    const bar = cyl(0.022, 0.022, 0.4, dark, 0, 0.075, -0.32); bar.rotation.x = Math.PI / 2; g.add(bar); g.add(box(0.02, 0.03, 0.02, brass, 0, 0.11, -0.5));
    g.add(box(0.02, 0.05, 0.04, dark, 0, 0.1, 0.1)); // hammer
    g.add(box(0.065, 0.17, 0.09, wood, 0, -0.07, 0.08)); g.add(torus(0.035, 0.008, brass, 0, -0.03, 0));
  } else if (weapon.id === 'shotgun') {
    const b1 = cyl(0.05, 0.05, 0.6, body, -0.04, 0.06, -0.32); b1.rotation.x = Math.PI / 2; g.add(b1); const b2 = b1.clone(); b2.position.x = 0.04; g.add(b2);
    g.add(box(0.12, 0.05, 0.25, wood, 0, 0.0, -0.3)); g.add(box(0.13, 0.12, 0.26, wood, 0, 0.04, 0.06)); g.add(box(0.09, 0.16, 0.12, wood, 0, -0.06, 0.16));
    g.add(box(0.14, 0.04, 0.05, brass, 0, 0.1, -0.62)); g.add(torus(0.035, 0.008, dark, 0, -0.03, 0.02));
    for (let i = 0; i < 4; i++) g.add(sphere(0.02, flatMat([0xff5ea8, 0xffd23f, 0xff8c42, 0x7b5ea7][i]), 0.07, 0.03, -0.1 + i * 0.05, 6));
  } else if (weapon.id === 'cannon') {
    // a fairground mortar: a fat striped barrel with a funnel mouth, a fuse and a candy ammo drum
    const bar = cyl(0.11, 0.09, 0.7, new THREE.MeshStandardMaterial({ map: stripeTexture(0xe63946, 0xfff4e0), roughness: 0.5, metalness: 0.2 }), 0, 0.08, -0.4); bar.rotation.x = Math.PI / 2; g.add(bar);
    const mouth = cyl(0.17, 0.11, 0.16, dark, 0, 0.08, -0.8); mouth.rotation.x = Math.PI / 2; g.add(mouth); g.add(torus(0.17, 0.02, brass, 0, 0.08, -0.88));
    [-0.15, -0.4, -0.65].forEach(z => g.add(torus(0.115, 0.015, brass, 0, 0.08, z)));
    g.add(box(0.12, 0.14, 0.3, dark, 0, 0.03, 0.02)); g.add(box(0.08, 0.2, 0.12, wood, 0, -0.1, 0.12)); g.add(box(0.06, 0.05, 0.16, wood, 0, 0.02, 0.24));
    const drum = cyl(0.09, 0.09, 0.12, new THREE.MeshStandardMaterial({ map: polkaTexture(0xffd23f, 0xff5ea8), roughness: 0.7 }), 0, 0.2, -0.15, 12); drum.rotation.z = Math.PI / 2; g.add(drum);
    const fuse = cyl(0.008, 0.008, 0.1, flatMat(0xffe28a), 0, 0.2, 0.02, 4); fuse.rotation.x = 0.5; g.add(fuse); g.add(sphere(0.02, new THREE.MeshStandardMaterial({ color: 0xff8c42, emissive: 0xff8c42, emissiveIntensity: 1 }), 0, 0.25, 0.06, 6));
    g.add(torus(0.035, 0.008, dark, 0, -0.03, 0.05)); [[-1], [1]].forEach(([s]) => { const leg = cyl(0.01, 0.01, 0.2, dark, s * 0.09, -0.05, -0.55); leg.rotation.z = s * 0.5; g.add(leg); });
  } else {
    const bar = cyl(0.03, 0.03, 0.95, dark, 0, 0.07, -0.5); bar.rotation.x = Math.PI / 2; g.add(bar);
    g.add(box(0.08, 0.11, 0.42, body, 0, 0.04, -0.05)); g.add(box(0.07, 0.15, 0.12, wood, 0, -0.06, 0.14)); g.add(box(0.06, 0.06, 0.2, wood, 0, 0.0, 0.25));
    const scope = cyl(0.035, 0.035, 0.28, dark, 0, 0.16, -0.18); scope.rotation.x = Math.PI / 2; g.add(scope); g.add(cyl(0.03, 0.03, 0.02, new THREE.MeshStandardMaterial({ color: 0x9ed6ee, emissive: 0x2244aa, metalness: 0.6, roughness: 0.1 }), 0, 0.16, -0.325, 12).rotateX(Math.PI / 2));
    g.add(box(0.02, 0.06, 0.02, dark, 0, 0.11, -0.1)); g.add(box(0.02, 0.06, 0.02, dark, 0, 0.11, -0.28));
    g.add(torus(0.035, 0.008, brass, 0, -0.03, 0.02)); g.add(box(0.1, 0.02, 0.1, flatMat(0xe63946), 0, 0.1, -0.9));
    [[-1], [1]].forEach(([s]) => { const leg = cyl(0.008, 0.008, 0.22, dark, s * 0.05, -0.06, -0.8); leg.rotation.z = s * 0.4; g.add(leg); });
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = forDisplay; o.receiveShadow = false; } });
  return g;
}
function buildGun(weapon) {
  while (gunRig.children.length) gunRig.remove(gunRig.children[0]);
  const g = buildGunModel(weapon, false);
  // glove
  g.add(sphere(0.055, flatMat(0xf2c9a0), 0.0, -0.13, 0.13, 10)); g.add(box(0.08, 0.05, 0.1, flatMat(0xff5ea8), 0, -0.17, 0.16));
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.9 }));
  flash.position.set(0, 0.06, weapon.id === 'rifle' ? -0.98 : weapon.id === 'cannon' ? -0.92 : (weapon.id === 'shotgun' ? -0.64 : -0.48)); flash.visible = false; g.add(flash);
  if (weapon.id === 'cannon') flash.scale.setScalar(2.2);
  gunParts.flash = flash; gunParts.magPos = new THREE.Vector3(0, -0.02, weapon.id === 'cannon' ? -0.15 : 0.02);
  const big = weapon.id === 'cannon'; g.scale.setScalar(big ? 0.26 : 0.32); g.position.set(big ? 0.24 : 0.2, big ? -0.2 : -0.17, -0.4); g.rotation.set(0, -0.1, 0);
  gunRig.add(g); gunParts.group = g; gunParts.recoil = 0;
}
// Reloading: the gun dips and candies get crammed into the magazine one by one.
const RELOAD_FX = { pieces: [], nextT: 0, wasReloading: false };
function updateGun(dt, t, moving) {
  if (!gunParts.group) return;
  gunParts.recoil = Math.max(0, gunParts.recoil - dt * 5);
  const r = gunParts.recoil; const bob = moving ? Math.sin(t * 9) * 0.006 : Math.sin(t * 1.6) * 0.003;
  const reloading = HUB.mode === 'run' && RUN.reloading;
  const dip = reloading ? 0.09 : 0;
  gunParts.group.position.set(0.2 + (moving ? Math.cos(t * 4.5) * 0.004 : 0) + dip * 0.4, -0.17 + bob - dip, -0.4 + r * 0.06 + dip * 0.3);
  gunParts.group.rotation.x = r * 0.35 - dip * 3.2; gunParts.group.rotation.z = -dip * 2.5;
  if (gunParts.flash.visible && t - gunParts.flashT > 0.06) gunParts.flash.visible = false;
  if (reloading) {
    const cap = D.magCapacity(), gap = Math.max(0.08, D.reloadTime() / Math.min(cap, 10));
    if (!RELOAD_FX.wasReloading) RELOAD_FX.nextT = t;
    if (t >= RELOAD_FX.nextT && RELOAD_FX.pieces.length < 6) {
      RELOAD_FX.nextT = t + gap;
      const m = new THREE.Mesh(candyGeo, candyMats[Math.floor(Math.random() * candyMats.length)]); m.scale.setScalar(0.55);
      m.position.set(0.55 + Math.random() * 0.1, -0.5 - Math.random() * 0.1, -0.35); m.userData = { t0: t, from: m.position.clone() };
      gunRig.add(m); RELOAD_FX.pieces.push(m);
    }
  }
  RELOAD_FX.wasReloading = reloading;
  for (let i = RELOAD_FX.pieces.length - 1; i >= 0; i--) {
    const m = RELOAD_FX.pieces[i]; const k = Math.min(1, (t - m.userData.t0) / 0.28);
    gunParts.group.localToWorld(_gm.copy(gunParts.magPos)); gunRig.worldToLocal(_gm);
    m.position.lerpVectors(m.userData.from, _gm, k * k); m.position.y += Math.sin(k * Math.PI) * 0.08; m.rotation.x += 12 * dt; m.rotation.z += 9 * dt;
    if (k >= 1 || !reloading) { gunRig.remove(m); RELOAD_FX.pieces.splice(i, 1); if (k >= 1 && !S.perm.muted) beep(520 + Math.random() * 200, 0.03, 'square', 0.03); }
  }
}
const _gm = new THREE.Vector3();
function gunKick(t) { gunParts.recoil = 1; gunParts.flash.visible = true; gunParts.flashT = t; gunParts.flash.rotation.z = Math.random() * 3; }

// ---- Particles: confetti burst + Candy pieces on the ground ----
const particles = []; const groundCandy = []; const _feet = new THREE.Vector3();
const confettiGeo = new THREE.PlaneGeometry(0.09, 0.05);
const candyGeo = new THREE.SphereGeometry(0.065, 7, 5); candyGeo.scale(1.5, 1, 1);
const confMats = [0xff5ea8, 0xffd23f, 0x2ec4b6, 0xff8c42, 0x7b5ea7, 0xffffff].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
const candyMats = [0xff2d78, 0xffd23f, 0x2ec4b6, 0xff8c42, 0x9b5de5, 0xff5ea8].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.1 }));
function burst(pos, color, count, candyCount, dir) {
  for (let i = 0; i < count; i++) {
    if (particles.length > 320) break;
    const m = new THREE.Mesh(confettiGeo, color !== undefined && i % 3 === 0 ? new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }) : confMats[i % confMats.length]);
    m.position.copy(pos); m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4.5 + 1, (Math.random() - 0.5) * 6); if (dir) m.userData.v.addScaledVector(dir, 3 + Math.random() * 3);   // shreds fly away from the shot
    m.userData.spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6); m.userData.life = 1.6 + Math.random();
    m.userData.kind = 'confetti'; scene.add(m); particles.push(m);
  }
  for (let i = 0; i < (candyCount || 0); i++) {
    if (groundCandy.length > 240) break;
    const m = new THREE.Mesh(candyGeo, candyMats[i % candyMats.length]); m.castShadow = true;
    m.position.copy(pos); m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3.5 + 2.5, (Math.random() - 0.5) * 4); if (dir) m.userData.v.addScaledVector(dir, 1.5);
    m.userData.spin = new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0); m.userData.kind = 'candy';
    scene.add(m); particles.push(m); groundCandy.push(m);
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const m = particles[i]; const u = m.userData;
    if (u.kind === 'confetti') {
      u.v.y -= 4.5 * dt; u.v.multiplyScalar(1 - 1.2 * dt); m.position.addScaledVector(u.v, dt);
      m.rotation.x += u.spin.x * dt; m.rotation.y += u.spin.y * dt; m.rotation.z += u.spin.z * dt; u.life -= dt;
      if (u.life <= 0 || m.position.y < 0) { scene.remove(m); particles.splice(i, 1); }
    } else if (u.kind === 'candy') {
      u.v.y -= 9.8 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.spin.x * dt; m.rotation.y += u.spin.y * dt;
      if (m.position.y <= 0.06) { m.position.y = 0.06; u.v.set(u.v.x * 0.5, -u.v.y * 0.25, u.v.z * 0.5); if (Math.abs(u.v.y) < 0.6) { particles.splice(i, 1); } }
    } else if (u.kind === 'pop') {   // the break flash: a sphere that balloons and fades in a blink
      u.t += dt * 6; m.scale.setScalar(0.3 + u.t * 1.6); m.material.opacity = Math.max(0, 0.9 - u.t); if (u.t >= 1) { scene.remove(m); particles.splice(i, 1); }
    } else if (u.kind === 'tohost') {  // Candy Vacuum: pieces roll along the grass to the Host's feet (never up into the camera)
      u.t += dt * 2.0; const k = Math.min(1, u.t); _feet.set(camera.position.x, 0.08, camera.position.z + 0.35);
      m.position.lerpVectors(u.from, _feet, k * k); m.position.y = Math.min(0.35, 0.08 + Math.sin(k * Math.PI) * 0.25); m.rotation.x += 14 * dt; m.rotation.z += 6 * dt;
      if (k >= 1) { scene.remove(m); particles.splice(i, 1); if (u.onArrive) u.onArrive(); }
    } else if (u.kind === 'tobucket') {   // the Backer's take: candy flies to Tía Chelo's bucket
      u.t += dt * 1.6; const k = Math.min(1, u.t); const e = k * k * (3 - 2 * k);
      m.position.lerpVectors(u.from, u.to, e); m.position.y += Math.sin(k * Math.PI) * 1.2; m.rotation.x += 6 * dt;
      if (k >= 1) { scene.remove(m); particles.splice(i, 1); }
    }
  }
}
function clearGroundCandy() { groundCandy.forEach(m => scene.remove(m)); groundCandy.length = 0; for (let i = particles.length - 1; i >= 0; i--) if (particles[i].userData.kind === 'candy') particles.splice(i, 1); }
const popGeo = new THREE.SphereGeometry(0.5, 12, 8);
function popFlash(pos, color) {
  const m = new THREE.Mesh(popGeo, new THREE.MeshBasicMaterial({ color: color || 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); m.position.copy(pos); m.scale.setScalar(0.3); m.userData = { kind: 'pop', t: 0 }; scene.add(m); particles.push(m); return m;
}
function candyToHost(n, onArrive) {
  let sent = 0;
  for (let i = 0; i < n && groundCandy.length; i++) {
    const m = groundCandy.splice(Math.floor(Math.random() * groundCandy.length), 1)[0];
    const pi = particles.indexOf(m); if (pi >= 0) particles.splice(pi, 1);
    m.userData = { kind: 'tohost', from: m.position.clone(), t: -Math.random() * 0.3, onArrive }; particles.push(m); sent++;
  }
  return sent;
}
function candyToBucket(target, n) {
  for (let i = 0; i < n && groundCandy.length; i++) {
    const m = groundCandy.splice(Math.floor(Math.random() * groundCandy.length), 1)[0];
    const pi = particles.indexOf(m); if (pi >= 0) particles.splice(pi, 1);
    m.userData = { kind: 'tobucket', from: m.position.clone(), to: target.clone(), t: 0 }; particles.push(m);
  }
}

// ---- Billboard text sprites (station signs, speech bubbles) ----
function makeLabelSprite(lines, opts) {
  opts = opts || {};
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  const font = (opts.size || 44) + 'px "Baloo 2", "Trebuchet MS", sans-serif';
  g.font = 'bold ' + font; const pad = 28; const lh = (opts.size || 44) * 1.25;
  lines = lines.map(l => Object.assign({}, l, { text: T(l.text) }));
  const widths = lines.map(l => g.measureText(l.text).width); const w = Math.ceil(Math.max(...widths, 40) + pad * 2), h = Math.ceil(lines.length * lh + pad * 1.2);
  c.width = w; c.height = h; g.font = 'bold ' + font; g.textBaseline = 'middle'; g.textAlign = 'center';
  const r = 26; g.fillStyle = opts.bg || 'rgba(58,36,24,.9)'; g.beginPath(); g.moveTo(r, 0); g.lineTo(w - r, 0); g.quadraticCurveTo(w, 0, w, r); g.lineTo(w, h - r); g.quadraticCurveTo(w, h, w - r, h); g.lineTo(r, h); g.quadraticCurveTo(0, h, 0, h - r); g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0); g.fill();
  if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = 6; g.stroke(); }
  lines.forEach((l, i) => { g.fillStyle = l.color || '#fff4e0'; g.font = (l.bold === false ? '' : 'bold ') + ((l.size || opts.size || 44)) + 'px "Baloo 2", "Trebuchet MS", sans-serif'; g.fillText(l.text, w / 2, pad * 0.6 + lh * i + lh / 2); });
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const scale = (opts.scale || 0.0055); sp.scale.set(w * scale, h * scale, 1); sp.renderOrder = 10; sp.userData.base = new THREE.Vector2(w * scale, h * scale);
  return sp;
}
// keep a billboard readable: shrink it as you get close, so it never fills the screen
const _sp = new THREE.Vector3();
function fitSprite(sp, near, far, minF, maxF) {
  sp.getWorldPosition(_sp); const d = _sp.distanceTo(camera.position); const f = THREE.MathUtils.clamp((d - near) / (far - near), 0, 1) * (maxF - minF) + minF;
  sp.scale.set(sp.userData.base.x * f, sp.userData.base.y * f, 1);
}

// ---- Tiny synth audio (no assets) ----
const AUDIO = { ctx: null, sfx: null };
function sfxBus(c) { if (!AUDIO.sfx) { AUDIO.sfx = c.createGain(); AUDIO.sfx.connect(c.destination); } AUDIO.sfx.gain.value = S.perm.sfxVol == null ? 0.8 : S.perm.sfxVol; return AUDIO.sfx; }
function beep(freq, dur, type, vol, slide) {
  if (S.perm.muted) return;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const c = AUDIO.ctx; if (c.state === 'suspended') c.resume();
    const o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(sfxBus(c)); o.start(); o.stop(c.currentTime + dur + 0.02);
  } catch (e) {}
}
let noiseBuf = null;
function crack(vol, dur) {
  if (S.perm.muted) return;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)(); const c = AUDIO.ctx;
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2); }
    const src = c.createBufferSource(); src.buffer = noiseBuf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 800; f.Q.value = 0.7;
    const g = c.createGain(); g.gain.setValueAtTime(vol || 0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.25));
    src.connect(f); f.connect(g); g.connect(sfxBus(c)); src.start(); src.stop(c.currentTime + (dur || 0.25) + 0.02);
  } catch (e) {}
}
const SFX = {
  shot: () => { beep(180, 0.09, 'sawtooth', 0.12, 0.3); beep(900, 0.04, 'square', 0.04, 0.2); },
  sweet: () => { beep(660, 0.12, 'triangle', 0.1); setTimeout(() => beep(990, 0.14, 'triangle', 0.1), 60); },
  crit: () => { [660, 880, 1320].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.12), i * 55)); },
  body: () => beep(220, 0.08, 'square', 0.06, 0.7),
  miss: () => beep(140, 0.12, 'sawtooth', 0.05, 0.6),
  breakP: () => { crack(0.22, 0.28); beep(140, 0.12, 'sine', 0.12, 0.5); beep(300, 0.2, 'square', 0.05, 2.5); },
  tick: () => beep(1200, 0.05, 'square', 0.05),
  timeUp: () => { [440, 330, 220].forEach((f, i) => setTimeout(() => beep(f, 0.25, 'triangle', 0.1), i * 140)); },
  vac: () => beep(700, 0.05, 'triangle', 0.04, 1.5),
  golden: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.12), i * 70)); },
  cut: () => beep(120, 0.3, 'sawtooth', 0.08, 0.5),
  buy: () => { beep(520, 0.08, 'square', 0.06); setTimeout(() => beep(780, 0.1, 'square', 0.06), 70); },
  pay: () => { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'triangle', 0.1), i * 80)); },
  endRun: () => { beep(330, 0.25, 'triangle', 0.08, 0.5); },
  open: () => beep(440, 0.06, 'triangle', 0.05),
  step: () => beep(90, 0.04, 'triangle', 0.02),
  cannon: () => { crack(0.35, 0.5); beep(70, 0.35, 'sine', 0.2, 0.4); beep(160, 0.2, 'sawtooth', 0.1, 0.3); },
  launch: () => { beep(220, 0.25, 'triangle', 0.08, 3.5); setTimeout(() => beep(330, 0.2, 'triangle', 0.06, 2.5), 120); },
};
