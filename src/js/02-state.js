// ---------- STATE, SAVE/LOAD, DERIVED STATS ----------
const SAVE_KEY = 'paythepinata.save.v1';
const SAVE_KEY_VIEJA = 'partytab.save.v1';   // el juego se llamaba Party Tab: las partidas de entonces se migran al cargar

function freshParty() {
  return {
    candy: 0, tabs: [], tabsPaid: 0, nodes: {}, favors: {}, runCount: 0,
    backerTaken: 0, weapon: 'pea', nextTabId: 1, guestCursor: 0, wup: {},
    centerpieceBroken: false, centerpieceCandy: 0, cleanupPaid: false,
    lastRun: null, tabsArrivedThisRun: [], firstMail: true, tabsEverPaid: 0,
  };
}
// Si el sistema pide menos movimiento, el juego arranca ya calmado: sin sacudida de camara
// y con los destellos suavizados. Es un ajuste del jugador, asi que solo decide el valor
// INICIAL de una partida nueva; a partir de ahi manda lo que el jugador elija en Ajustes.
function prefiereCalma() {
  try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function freshPerm() {
  const calma = prefiereCalma();
  return { keepsakes: 0, charms: {}, weaponsUnlocked: ['pea'], seenWeapons: ['pea'], party: 1, credits: 0, aimMode: 'lock', muted: false, keepsakesEver: 0, v: 3, bestTier: 1, sensV: BAL.sens_default, dpi: 800,
    // ---- accesibilidad y comodidad ----
    invertY: false, fovH: BAL.fov_h_default, holdToStart: true, assist: 0, activeReload: 1, arHits: 0,
    shake: calma ? 0 : 1, flashSafe: calma, xhColor: '', xhScale: 1, bigUI: false };
}

const S = { perm: freshPerm(), party: freshParty() };

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: play on */ }
}
function loadGame() {
  try {
    // Una partida guardada cuando el juego se llamaba Party Tab vive en la clave vieja.
    // Se lee, se reescribe en la nueva y se borra la anterior: el jugador no pierde nada.
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      raw = localStorage.getItem(SAVE_KEY_VIEJA);
      if (raw) { localStorage.setItem(SAVE_KEY, raw); localStorage.removeItem(SAVE_KEY_VIEJA); }
    }
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || !d.perm || !d.party) return false;
    S.perm = Object.assign(freshPerm(), d.perm);
    S.party = Object.assign(freshParty(), d.party);
    if (!(d.perm.v >= 2)) {   // older saves: the free pistol becomes the Peashooter; the Repeater is a Tier 4 purchase now
      S.perm.weaponsUnlocked = S.perm.weaponsUnlocked.filter(w => w !== 'pistol'); if (!S.perm.weaponsUnlocked.includes('pea')) S.perm.weaponsUnlocked.unshift('pea');
      S.perm.seenWeapons = (S.perm.seenWeapons || []).filter(w => w !== 'pistol').concat(['pea']); if (S.party.weapon === 'pistol') S.party.weapon = 'pea'; S.perm.v = 2;
    }
    if (!S.party.wup) S.party.wup = {};
    if (d.perm.sensV == null) { S.perm.sensV = d.perm.sens ? Math.min(BAL.sens_max, Math.max(BAL.sens_min, +(S.perm.sens * 0.0022 / (BAL.sens_deg_per_count * Math.PI / 180)).toFixed(2))) : BAL.sens_default; }   // old multiplier → Valorant units
    if (!(d.perm.v >= 3)) {   // piñatas are invited through the Tree now: seed the invitations an older Party had earned by Tier
      const t = D.tier(); const grant = ['p_donkey', 'p_burro']; if (t >= 2) grant.push('p_sun', 'p_bull', 'p_cluster', 'p_nest'); if (t >= 3) grant.push('p_cactus', 'p_armored', 'p_glass', 'p_comet'); if (t >= 4) grant.push('p_skull', 'p_llama');
      grant.forEach(id => { S.party.nodes[id] = Math.max(1, S.party.nodes[id] || 0); }); S.perm.v = 3;
    }
    return true;
  } catch (e) { return false; }
}
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_KEY_VIEJA); } catch (e) {} S.perm = freshPerm(); S.party = freshParty(); }

// ---- derived values (every formula reads BAL + nodes + Charms + Favors) ----
const rank   = id => S.party.nodes[id] || 0;
const charm  = id => S.perm.charms[id] || 0;
const favor  = id => S.party.favors[id] || 0;
const D = {
  tier: () => 1 + Math.floor(S.party.tabsPaid / BAL.tabs_per_tier),
  nodesPurchased: () => Object.values(S.party.nodes).reduce((a, b) => a + b, 0),
  weapon: () => WEAPONS.find(w => w.id === S.party.weapon) || WEAPONS[0],
  magCapacity: (w) => (w || D.weapon()).mag + rank('mag_cap') + charm('ring') * 2 + favor('mag'),
  refundChance: () => Math.min(1, BAL.refund_base + BAL.refund_per_rank * rank('sweet_refund')),
  critRefundChance: () => Math.min(1, D.refundChance() + BAL.refund_crit_bonus),   // un Crit se cobra mejor que un Sweet Hit
  sweetRefund: () => BAL.sweet_refund,
  critRefund: () => BAL.crit_refund + rank('crit_refund'),
  grace: () => rank('grace') + favor('grace'),
  freeFirst: () => rank('free_first') > 0,
  damageMult: () => 1 + 0.10 * rank('damage') + 0.06 * rank('heavy') + 0.05 * charm('bracelet'),
  breakCandyMult: () => 1 + 0.08 * rank('heavy'),
  spillRate: () => [0.5, 0.75, 1.0][rank('spill')],
  punch: () => 1 + rank('punch'),
  pierce: (w) => rank('pierce') > 0 || !!((w || D.weapon()).pierce),
  globalCandy: () => (1 + 0.10 * rank('yield')) * (1 + 0.08 * charm('sugar')) * (1 + BAL.prestige_candy_pct / 100 * (S.perm.party - 1)),
  candyMult: (family) => (1 + 0.15 * rank('candy_' + family)) * (1 + 0.05 * favor('candy')) * D.globalCandy(),
  kindNode: (kind) => KIND_NODE[kind] || null,
  kindUnlocked: (kind) => { const n = KIND_NODE[kind]; return !n || rank(n.id) > 0; },
  kindCandyMult: (kind) => { const n = KIND_NODE[kind]; return n && rank(n.id) > 1 ? 1 + 0.25 * (rank(n.id) - 1) : 1; },
  weaponPrice: (w) => Math.round(w.price * (1 - 0.15 * charm('coupon')) / 10) * 10,
  charmCost: (c) => c.cost + c.step * charm(c.id),
  prestigeKeepsakes: () => Math.floor(S.party.tabsPaid * BAL.prestige_keepsakes_per_tab + (D.tier() - 1) * BAL.prestige_keepsakes_per_tier),
  goldenChance: () => BAL.golden_chance + 0.01 * rank('golden') + 0.01 * favor('golden') + 0.01 * charm('lucky'),
  startPinatas: () => BAL.start_pinatas + rank('start_pinatas') + favor('start') + (S.party.runCount < 2 ? 1 : 0),   // the first two Runs open with a fuller yard
  openWindow: () => BAL.open_window + 0.3 * rank('open_window') + 0.1 * favor('window'),
  runTime: () => BAL.run_time + 5 * rank('run_time') + 3 * charm('watch'),
  wup: (w, id) => ((S.party.wup[(w || D.weapon()).id] || {})[id] || 0),
  reloadTime: (w) => { w = w || D.weapon(); return (w.reload || BAL.reload_time) * Math.pow(0.75, rank('fast_reload')) * Math.pow(0.8, D.wup(w, 'reload')); },
  cooldown: (w) => (w || D.weapon()).cooldown * (1 - 0.10 * rank('hair_trigger')) * Math.pow(0.88, D.wup(w, 'rof')),
  hitRadius: (w) => { w = w || D.weapon(); return w.hitRadius + 0.006 * D.wup(w, 'margin') + A11Y.assist(); },
  kickMult: (w) => 1,
  wupTracks: (w) => WUP_BY_WEAPON[(w || D.weapon()).id] || [],
  spread: (w) => { w = w || D.weapon(); return w.spread * Math.pow(0.85, D.wup(w, 'cone')); },
  splashRadius: (w) => { w = w || D.weapon(); return (w.splash || 0) + 0.6 * D.wup(w, 'radius'); },
  splashPct: (w) => { w = w || D.weapon(); return (w.splashPct || 0) + 0.2 * D.wup(w, 'splash'); },
  armorCrack: (w) => { w = w || D.weapon(); return 1 + D.wup(w, 'pen') + D.wup(w, 'shred'); },
  doubleDrop: (w) => 0.08 * D.wup(w || D.weapon(), 'double'),
  rampMax: (w) => 0.4 + 0.1 * D.wup(w || D.weapon(), 'ramp'),   // the Repeater's cooldown shrinks by up to this share while held
  projectileSpeed: (w) => { w = w || D.weapon(); return (w.projectile || 16) * (1 + 0.25 * D.wup(w, 'velocity')); },
  clusterBlasts: (w) => 2 * D.wup(w || D.weapon(), 'cluster'),
  candyPull: (w) => D.wup(w || D.weapon(), 'magnet'),
  nodeCost: (n, r) => Math.round(n.cost(r) * BAL.node_cost_mult * Math.pow(BAL.node_inflation, D.nodesPurchased())),
  wupCost: (w, u) => Math.round(Math.max(250, w.price * BAL.wup_cost_base) * Math.pow(BAL.wup_cost_growth, D.wup(w, u.id))),
  heatCool: () => BAL.heat_cool * (1 + 0.35 * rank('steady')) * (1 + 0.35 * D.wup(WEAPONS[4], 'cool')),
  critTime: () => BAL.time_crit + 0.1 * rank('crit_time'),
  sweetTime: (w) => BAL.time_sweet + 0.05 * rank('sweet_tooth') + 0.05 * D.wup(w || D.weapon(), 'sweettime'),
  timeBonusCap: () => BAL.time_bonus_cap + 0.10 * rank('overtime'),
  shock: () => 0.5 * rank('shock'),
  stun: () => rank('stun') > 0,
  aoe: (w) => (((w || D.weapon()).aoe || 0) + 0.4 * D.wup(w, 'radius')) * (1 + 0.25 * rank('boom')),
  rushDuration: () => 3 + 2 * rank('rush_long'),
  llamaChance: () => rank('p_llama') ? (BAL.llama_chance + 0.015 * rank('llama_luck') + 0.01 * charm('lucky')) * (1 + 0.5 * (rank('p_llama') - 1)) : 0,
  cometChance: () => rank('p_comet') ? (0.04 + 0.01 * D.tier()) * (1 + 0.5 * (rank('p_comet') - 1)) : 0,
  jackpotChance: () => 0.04 * rank('jackpot'),
  maxPinatas: () => BAL.max_pinatas + rank('max_pinatas'),
  launcherRate: () => 1 + 0.3 * rank('launcher'),
  hotStart: () => 2 * rank('hot_start'),
  vacuumStreak: () => Math.max(2, 6 - 2 * rank('magnet')),
  vacuumCandy: () => 2 + rank('magnet'),
  coinWin: () => rank('loaded') ? 0.6 : 0.5,
  encore: () => rank('encore') > 0,
  heirloom: () => rank('heirloom') > 0,
  chainChance: () => 0.2 * rank('chain'),
  vacuum: () => rank('vacuum') > 0,
  rush: () => rank('rush') > 0,
  spawnInterval: () => BAL.spawn_interval / Math.pow(1.15, rank('spawn_rate') + favor('spawn')) * (S.party.runCount < 2 ? 0.55 : 1),
  streakStep: () => BAL.streak_step + 0.05 * rank('streak_step'),
  streakCap: () => BAL.streak_cap + 0.5 * rank('streak_cap') + 0.25 * favor('streakcap'),
  nestlets: () => 3 + favor('nest'),
  shotgunPellets: () => 12 + 2 * favor('shotgun') + 2 * D.wup(WEAPONS.find(w => w.id === 'shotgun'), 'pellets'),
  overdueCount: () => S.party.tabs.filter(t => t.dueLeft <= 0).length,
  tabsOpenMax: () => { const t = D.tier(); return t >= 5 ? 3 : t >= 3 ? 2 : 1; },
  nextTabRun: () => S.party.nextTabRun || 0,
  graceRuns: () => Math.max(0, D.nextTabRun() - S.party.runCount),
  starterOnly: () => S.perm.weaponsUnlocked.length <= 1,
  cutPct: () => BAL.cut_steps[Math.min(3, D.overdueCount())],
  sweetScaleForTier: () => Math.max(0.45, 1 - BAL.tier_sweet_shrink * (D.tier() - 1)),
  speedForTier: () => 1 + BAL.tier_speed * (D.tier() - 1),
  centerpieceDue: () => S.party.tabsPaid >= BAL.centerpiece_tabs && !S.party.centerpieceBroken,
  weaponUnlocked: id => S.perm.weaponsUnlocked.includes(id),
};

// ---- Tabs (§5) ----
function floorToStep(v, step) { return Math.floor(v / step) * step; }
function tabAmountFor(tier) {
  const tierBase = BAL.tab_base_candy * Math.pow(BAL.tab_tier_growth_percent / 100, tier - 1);
  const nodePct = Math.min(D.nodesPurchased() * BAL.tab_percent_per_node, BAL.tab_node_percent_cap);
  return floorToStep(tierBase * (100 + nodePct) / 100 * (1 - 0.06 * charm('wrapper')), BAL.tab_amount_step);
}
function arriveTab() {
  const p = S.party;
  const tier = D.tier();
  // pick the next Guest not currently holding an open Tab
  let guest = null;
  for (let i = 0; i < GUESTS.length; i++) {
    const g = GUESTS[(p.guestCursor + i) % GUESTS.length];
    if (!p.tabs.some(t => t.guest === g.name)) { guest = g; p.guestCursor = (p.guestCursor + i + 1) % GUESTS.length; break; }
  }
  if (!guest) guest = GUESTS[p.guestCursor % GUESTS.length];
  const tab = { id: p.nextTabId++, guest: guest.name, favor: guest.favor, favorText: guest.favorText,
    amount: tabAmountFor(tier), tier, dueLeft: BAL.tab_due_runs, arrivedRun: p.runCount, fresh: true };
  p.tabs.push(tab);
  p.tabsArrivedThisRun.push(tab);
  return tab;
}
function payTab(tab) {
  const p = S.party;
  if (p.candy < tab.amount) return false;
  p.candy -= tab.amount;
  p.tabs = p.tabs.filter(t => t !== tab);
  // the billing window stays closed until it would have expired: paying early buys a Grace Period, never a fresh bill
  const cycleEnd = tab.arrivedRun + BAL.tab_due_runs; if (cycleEnd > (p.nextTabRun || 0)) p.nextTabRun = cycleEnd; p.paidEarlyRuns = Math.max(0, tab.dueLeft);
  p.favors[tab.favor] = (p.favors[tab.favor] || 0) + 1;
  const ks = BAL.keepsake_per_tab + BAL.keepsake_per_tier * tab.tier;
  S.perm.keepsakes += ks; S.perm.keepsakesEver += ks;
  const tierBefore = D.tier();
  p.tabsPaid++; p.tabsEverPaid++;
  const tierAfter = D.tier();
  const unlocked = [];   // weapons are bought at the weapons table now; a Tier only puts them on sale
  if (tierAfter > tierBefore) { WEAPONS.forEach(w => { if (w.unlockTier === tierAfter && !S.perm.weaponsUnlocked.includes(w.id)) unlocked.push(w); }); p.bossDue = tierAfter; }
  saveGame();
  return { ks, tierBefore, tierAfter, unlocked };
}
// Weapons: bought once with Candy, from the Tier that puts them on sale; kept through every Party's Over.
function weaponOnSale(w) { return !D.weaponUnlocked(w.id) && D.tier() >= w.unlockTier; }
function buyWeapon(w) {
  if (!weaponOnSale(w) || S.party.candy < D.weaponPrice(w)) return false;
  S.party.candy -= D.weaponPrice(w); S.perm.weaponsUnlocked.push(w.id); S.perm.seenWeapons = (S.perm.seenWeapons || []).concat([w.id]); S.party.weapon = w.id;
  saveGame(); if (S.perm.weaponsUnlocked.length >= WEAPONS.length) unlockAchievement('all_weapons'); return true;
}
function buyWup(w, u) {
  const r = D.wup(w, u.id); if (r >= u.ranks || !D.weaponUnlocked(w.id)) return false;
  const cost = D.wupCost(w, u); if (S.party.candy < cost) return false;
  S.party.candy -= cost; S.party.wup[w.id] = S.party.wup[w.id] || {}; S.party.wup[w.id][u.id] = r + 1; saveGame(); return true;
}
function buyNode(node) {
  const r = rank(node.id);
  if (r >= node.ranks) return false;
  if (!nodeAvailable(node)) return false;
  const cost = D.nodeCost(node, r);
  if (S.party.candy < cost) return false;
  S.party.candy -= cost;
  S.party.nodes[node.id] = r + 1;
  saveGame();
  const n = D.nodesPurchased(); if (n >= 40) unlockAchievement('tree40'); else if (n >= 20) unlockAchievement('tree20');
  return true;
}
function nodeAvailable(node) {
  if (!node.prereq) return true;
  for (const k in node.prereq) {
    if (k === 'total') { if (D.nodesPurchased() < node.prereq[k]) return false; }
    else if (k === 'tier') { if (D.tier() < node.prereq[k]) return false; }
    else if (rank(k) < node.prereq[k]) return false;
  }
  return true;
}
function buyCharm(c) {
  const cost = D.charmCost(c); if (charm(c.id) >= c.max || S.perm.keepsakes < cost) return false;
  S.perm.keepsakes -= cost;
  S.perm.charms[c.id] = charm(c.id) + 1;
  saveGame();
  return true;
}
// Party's Over (§7): lose Skill Tree, Candy, Tabs, Tier. Keep Keepsakes, Charms, weapons.
// Party's Over (§7): the Party is converted into Keepsakes; Candy, Tabs, Tier, the Tree, weapons and their upgrades all go. Charms stay.
function partysOver() {
  const minted = D.prestigeKeepsakes(); S.perm.keepsakes += minted; S.perm.keepsakesEver += minted; S.perm.lastMinted = minted;
  S.perm.party++; S.perm.bestTier = Math.max(S.perm.bestTier || 1, D.tier());
  S.perm.weaponsUnlocked = ['pea']; S.perm.seenWeapons = ['pea'];
  S.party = freshParty();
  applyStartOfPartyCharms();
  saveGame();
}
function applyStartOfPartyCharms() {
  const n = charm('necklace');
  if (n >= 1) S.party.nodes.mag_cap = Math.max(1, S.party.nodes.mag_cap || 0);
  if (n >= 2) S.party.nodes.damage = Math.max(1, S.party.nodes.damage || 0);
  if (n >= 3) S.party.nodes.p_donkey = Math.max(1, S.party.nodes.p_donkey || 0);
  const g = charm('guestbook'); ['p_burro', 'p_sun', 'p_bull'].slice(0, g).forEach(id => { if (id !== 'p_donkey') S.party.nodes.p_donkey = Math.max(1, S.party.nodes.p_donkey || 0); S.party.nodes[id] = Math.max(1, S.party.nodes[id] || 0); });
  if (charm('oldfriend') && !S.perm.weaponsUnlocked.includes('six')) { S.perm.weaponsUnlocked.push('six'); S.perm.seenWeapons.push('six'); }
  S.party.candy += 400 * charm('headstart');
  S.party.crownPending = charm('crown') > 0;
}
