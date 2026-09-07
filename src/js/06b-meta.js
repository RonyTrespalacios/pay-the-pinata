// ---------- META: achievements, records, the Party summary ----------
// Achievements pay Keepsakes, so side goals feed the Charm shop. Records live in perm and survive every Party's Over.
const ACHIEVEMENTS = [
  { id: 'first_sweet', icon: 'target', name: 'Sweet Spot', desc: 'Land your first Sweet Hit.', ks: 1 },
  { id: 'streak10', icon: 'flame', name: 'On a roll', desc: 'Reach a Streak of 10.', ks: 1 },
  { id: 'streak20', icon: 'flame', name: 'Untouchable', desc: 'Reach a Streak of 20.', ks: 2 },
  { id: 'streak30', icon: 'flame', name: 'Perfect party', desc: 'Reach a Streak of 30.', ks: 3 },
  { id: 'golden', icon: 'star', name: 'Gold leaf', desc: 'Break a Golden Piñata.', ks: 1 },
  { id: 'comet', icon: 'sparkle', name: 'Caught a comet', desc: 'Break a Sugar Comet.', ks: 1 },
  { id: 'llama', icon: 'clover', name: 'Lucky you', desc: 'Catch a Lucky Llama.', ks: 2 },
  { id: 'tinbull', icon: 'shield', name: 'Can opener', desc: 'Crack a Tin Bull.', ks: 1 },
  { id: 'blast3', icon: 'boom', name: 'Fireworks', desc: 'Shatter 3+ piñatas with one Candy Cannon shell.', ks: 1 },
  { id: 'dodge', icon: 'eye', name: 'Trigger discipline', desc: 'Let 3 Spikers fizzle in one Run without popping any.', ks: 1 },
  { id: 'rich_run', icon: 'coin', name: 'Big night', desc: 'Bank 1,000 Candy in a single Run.', ks: 2 },
  { id: 'rich_run2', icon: 'coin', name: 'Sugar baron', desc: 'Bank 10,000 Candy in a single Run.', ks: 3 },
  { id: 'grace', icon: 'clock', name: 'Early bird', desc: 'Pay a Tab with 2 Runs still on the clock.', ks: 1 },
  { id: 'tier5', icon: 'medal', name: 'Pillar of the party', desc: 'Reach Tier 5.', ks: 3 },
  { id: 'all_weapons', icon: 'gun', name: 'Full rack', desc: 'Own all six weapons in one Party.', ks: 3 },
  { id: 'tree20', icon: 'tree', name: 'Green thumb', desc: 'Own 20 Nodes.', ks: 2 },
  { id: 'tree40', icon: 'tree', name: 'Orchard', desc: 'Own 40 Nodes.', ks: 3 },
  { id: 'boss', icon: 'trophy', name: 'Boss down', desc: 'Break a Tier boss.', ks: 2 },
  { id: 'no_cut', icon: 'shield', name: 'Never late', desc: "Call Party's Over after 6+ Tabs with no Tab ever overdue.", ks: 3 },
  { id: 'lore_all', icon: 'book', name: 'Family history', desc: "Hear all of Tía Chelo's story.", ks: 2 },
  { id: 'centerpiece', icon: 'crown', name: 'Square', desc: 'Break The Centerpiece.', ks: 5 },
];
const ACH_BY_ID = {}; ACHIEVEMENTS.forEach(a => ACH_BY_ID[a.id] = a);
function unlockAchievement(id) {
  const a = ACH_BY_ID[id]; if (!a) return false; S.perm.ach = S.perm.ach || {}; if (S.perm.ach[id]) return false;
  S.perm.ach[id] = Date.now(); S.perm.keepsakes += a.ks; S.perm.keepsakesEver += a.ks; saveGame();
  const el = $('achv'); if (el) { el.innerHTML = `<span class="a-ic">${ico(a.icon, 26)}</span><div><div class="a-l">${T('Achievement')}</div><div class="a-n">${T(a.name)}</div><div class="a-d">${T(a.desc)} · +${a.ks} Keepsake${a.ks === 1 ? '' : 's'}</div></div>`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(unlockAchievement.t); unlockAchievement.t = setTimeout(() => el.classList.remove('on'), 4200); }
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'triangle', 0.08), i * 70));
  if (typeof refreshHub === 'function' && HUB.mode !== 'run') refreshHub();
  return true;
}
function achCount() { return Object.keys(S.perm.ach || {}).length; }
// lifetime stats, bumped from endRun
function bumpStats(r) {
  const st = S.perm.stats || (S.perm.stats = { candy: 0, runs: 0, breaks: 0, sweet: 0, shots: 0, parties: 0 });
  st.candy += r.banked; st.runs++; st.breaks += r.breaks; st.sweet += r.sweetHits; st.shots += r.shots;
  const h = S.party.history || (S.party.history = []); h.push(r.banked); if (h.length > 80) h.shift();
  S.party.candyEarned = (S.party.candyEarned || 0) + r.banked;
}
// a small bar chart, inline SVG, one bar per Run
function historyChart(hist, w, h) {
  w = w || 520; h = h || 120; if (!hist || !hist.length) return `<div class="empty">${T('No Runs yet.')}</div>`;
  const max = Math.max(1, ...hist); const n = hist.length; const bw = Math.max(3, Math.min(22, (w - 40) / n - 2)); const x0 = 34;
  const bars = hist.map((v, i) => { const bh = Math.max(2, (h - 26) * v / max); return `<rect x="${x0 + i * (bw + 2)}" y="${h - 18 - bh}" width="${bw}" height="${bh}" rx="2" fill="${i === n - 1 ? '#ff5ea8' : '#2ec4b6'}"><title>Run ${i + 1}: ${fmt(v)} Candy</title></rect>`; }).join('');
  return `<svg class="hist" viewBox="0 0 ${Math.max(w, x0 + n * (bw + 2) + 8)} ${h}" preserveAspectRatio="none"><text x="0" y="12" class="axis">${fmt(max)}</text><text x="0" y="${h - 20}" class="axis">0</text><line x1="${x0 - 4}" y1="${h - 18}" x2="${x0 + n * (bw + 2)}" y2="${h - 18}" stroke="#cdbba0"/>${bars}<text x="${x0}" y="${h - 4}" class="axis">Run 1</text><text x="${x0 + n * (bw + 2)}" y="${h - 4}" class="axis" text-anchor="end">Run ${n}</text></svg>`;
}
function renderRecordsHTML() {
  const st = S.perm.stats || { candy: 0, runs: 0, breaks: 0, sweet: 0, shots: 0, parties: 0 }, rec = S.perm.records || { run: 0, streak: 0, breaks: 0 };
  const acc = st.shots ? Math.round(100 * st.sweet / st.shots) : 0;
  const stat = (l, v) => `<div class="stat"><div class="l">${T(l)}</div><div class="v">${v}</div></div>`;
  const achs = ACHIEVEMENTS.map(a => { const got = S.perm.ach && S.perm.ach[a.id]; return `<div class="ach ${got ? 'got' : ''}"><span class="a-ic">${ico(a.icon, 22)}</span><div><div class="a-n">${T(a.name)}</div><div class="a-d">${T(a.desc)}</div></div><b>+${a.ks}</b></div>`; }).join('');
  return `<div class="rec-cols"><div>
    <h3>${T('This Party')}</h3><div class="recap-grid four">${stat('Party', S.perm.party)}${stat('Runs', S.party.runCount)}${stat('Candy earned', fmt(S.party.candyEarned || 0))}${stat('Tabs paid', S.party.tabsPaid)}${stat('Tier', D.tier())}${stat('Nodes', D.nodesPurchased())}${stat('Bosses', S.party.bossesBeaten || 0)}${stat('Weapons', S.perm.weaponsUnlocked.length + '/' + WEAPONS.length)}</div>
    <h3 style="margin-top:14px">${T('Candy per Run')}</h3>${historyChart(S.party.history)}
    <h3 style="margin-top:14px">${T('All time')}</h3><div class="recap-grid four">${stat('Parties', S.perm.party)}${stat('Runs', st.runs)}${stat('Candy', fmt(st.candy))}${stat('Piñatas', fmt(st.breaks))}${stat('Sweet Hits', fmt(st.sweet) + ' <small>(' + acc + '%)</small>')}${stat('Best Run', fmt(rec.run))}${stat('Best Streak', rec.streak)}${stat('Keepsakes ever', S.perm.keepsakesEver)}</div>
  </div><div><h3>${T('Achievements')} <span class="badge">${achCount()}/${ACHIEVEMENTS.length}</span></h3><div class="achs">${achs}</div></div></div>`;
}
// Party's Over: the Party is summarised before it is swept away
function renderSummaryHTML() {
  const L = S.perm.lastParty; if (!L) return `<div class="empty">${es('Nothing to show yet.', 'Nada que mostrar aún.')}</div>`;
  const stat = (l, v, c) => `<div class="stat ${c || ''}"><div class="l">${T(l)}</div><div class="v">${v}</div></div>`;
  return `<div class="sum-head"><div class="sum-title">${es(`Party ${L.party} is over.`, `La Fiesta ${L.party} terminó.`)}</div><div class="small">${es(`${L.runs} Runs · Tier ${L.tier} · ${L.tabsPaid} Tabs paid`, `${L.runs} Runs · Tier ${L.tier} · ${L.tabsPaid} Tabs pagadas`)}</div></div>
    <div class="recap-grid four">${stat('Candy earned', fmt(L.candy), 'pink')}${stat('Best Run', fmt(L.bestRun))}${stat('Best Streak', L.bestStreak)}${stat('Piñatas broken', fmt(L.breaks))}${stat('Keepsakes minted', '+' + L.minted, 'purple')}${stat('Bosses beaten', L.bosses)}${stat('Nodes owned', L.nodes)}${stat('Never overdue', L.clean ? es('yes', 'sí') : es('no', 'no'))}</div>
    <h3 style="margin-top:14px">${T('Candy per Run')}</h3>${historyChart(L.history, 760, 130)}
    <div class="note decision" style="margin-top:14px"><div class="from">${es('Party', 'Fiesta')} ${L.party + 1}</div>${es(`Everything pays <b>+${BAL.prestige_candy_pct * L.party}%</b> now. You hold <b>${S.perm.keepsakes} Keepsakes</b> — the Charms table is where a Party's Over turns into a head start.`, `Todo paga <b>+${BAL.prestige_candy_pct * L.party}%</b> ahora. Tienes <b>${S.perm.keepsakes} Keepsakes</b> — la mesa de Charms es donde un Party's Over se vuelve una ventaja inicial.`)}</div>
    <div style="text-align:center"><button class="big-btn" id="btn-summary-go">${T('Throw Party')} ${L.party + 1}</button></div>`;
}
function snapshotParty(minted) {
  const h = S.party.history || []; const r = S.perm.records || { run: 0, streak: 0 };
  S.perm.lastParty = { party: S.perm.party, runs: S.party.runCount, tier: D.tier(), tabsPaid: S.party.tabsPaid, candy: S.party.candyEarned || h.reduce((a, b) => a + b, 0), bestRun: Math.max(0, ...h), bestStreak: S.party.bestStreak || 0, breaks: S.party.breaksThisParty || 0, minted, bosses: S.party.bossesBeaten || 0, nodes: D.nodesPurchased(), clean: !S.party.everOverdue, history: h.slice() };
}
