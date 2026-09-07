// ---------- PANELS: what opens when you use a station ----------
function arriveTabsIfDue() {
  const p = S.party;
  p.tabsArrivedThisRun = [];
  if (!p.centerpieceBroken) {
    // one Tab at a time early; the window must have closed (nextTabRun) before Tía Chelo sends the next one
    while (p.tabs.length < D.tabsOpenMax() && !D.centerpieceDue() && p.runCount >= D.nextTabRun()) arriveTab();
  } else if (!p.cleanupTab && !p.cleanupPaid) {
    p.cleanupTab = { id: 'cleanup', guest: 'Everyone', favor: 'candy', favorText: 'The credits roll.', amount: floorToStep(Math.max(200, p.centerpieceCandy * 0.7), 10), tier: D.tier(), dueLeft: 99, arrivedRun: p.runCount, cleanup: true };
    p.tabs = [p.cleanupTab]; p.tabsArrivedThisRun = [p.cleanupTab];
  }
  if (p.crownPending && p.tabs.length) { p.crownPending = false; const first = p.tabs[0]; p.candy += first.amount; payTab(first); p.crownNote = first.guest; }
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  document.body.classList.toggle('menu', !!id);
}
const fmt = n => Math.floor(n).toLocaleString();
const FAMILY_NAMES = { B: 'Nesting piñatas', C: 'Sugar Glass piñatas', D: 'Clockwork piñatas' };
function nextTierUnlocks(t) {
  const w = WEAPONS.filter(x => x.unlockTier === t && !D.weaponUnlocked(x.id)).map(x => T(x.name) + es(' on sale', ' a la venta'));
  const f = BRANCHES.find(b => b.id === 'guests').nodes.filter(n => n.prereq && n.prereq.tier === t).map(n => T(n.name) + es(' (Tree)', ' (Árbol)'));
  return [...w, ...f].join(', ');
}
function backerNote() {
  const p = S.party; const od = D.overdueCount();
  if (p.cleanupTab && !p.cleanupPaid) return BACKER_NOTES.cleanup;
  if (D.centerpieceDue()) return BACKER_NOTES.centerpiece;
  if (p.runCount === 0) return BACKER_NOTES.first;
  if (od >= 3) return BACKER_NOTES.overdue3;
  if (od === 2) return BACKER_NOTES.overdue2;
  if (od === 1) return p.backerTaken > 20 && p.runCount % 2 ? BACKER_NOTES.repo : BACKER_NOTES.overdue1;
  return BACKER_NOTES.fine;
}

// ---- panel shell ----
const PANEL = { kind: null };
function openPanel(kind) {
  if (HUB.mode === 'title') { PANEL.returnTo = 'title'; showScreen(null); }
  PANEL.kind = kind; HUB.mode = 'panel';
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.add('menu'); $('prompt').classList.remove('on'); $('recap-card').hidden = true;
  const el = $('panel'); el.hidden = false; el.dataset.kind = kind;
  renderPanel();
}
function closePanel() {
  if (PANEL.kind === null) return;
  PANEL.kind = null; $('panel').hidden = true; selectedNode = null;
  if (PANEL.returnTo === 'title') { PANEL.returnTo = null; HUB.mode = 'title'; showScreen('title'); document.body.classList.add('menu'); return; }
  if (HUB.mode === 'panel') { HUB.mode = 'hub'; document.body.classList.remove('menu'); refreshHub(); interactCooldownUntil = performance.now() + 400; backToWorld(); }
}
function renderPanel() {
  const kind = PANEL.kind; if (!kind) return;
  const box = $('panel-box'); box.className = 'panel-box kind-' + kind;
  const titles = { mailbox: [ 'mail', 'The Mailbox' ], tree: [ 'tree', 'The Skill Tree' ], weapons: [ 'gun', 'Weapons table' ], charms: [ 'gift', 'Keepsakes & Charms' ], partyover: [ 'lamp', "Party's Over" ], toss: [ 'target', 'Piñata Toss' ], chelo: [ 'person', 'Tía Chelo' ], records: [ 'chart', 'Records' ], summary: [ 'trophy', 'Party summary' ] };
  $('panel-title').innerHTML = `<span class="t-ic">${ico(titles[kind][0], 26)}</span>${T(titles[kind][1])}`;
  $('panel-candy').textContent = fmt(S.party.candy); $('panel-keep').textContent = S.perm.keepsakes;
  const body = $('panel-body');
  if (kind === 'mailbox') body.innerHTML = renderMailboxHTML();
  else if (kind === 'tree') { body.innerHTML = `<div class="tree-head"><div class="small" id="tree-sub"></div><div class="tree-legend"><span class="owned">${T('Owned')}</span><span class="can">${T('Can buy now')}</span><span>${T('Too pricey')}</span><span class="locked">${T('Locked')}</span><button class="tree-btn" id="tree-home">${ico('home', 13)} ${T('Centre')}</button><button class="tree-btn" id="tree-fit">${ico('fit', 13)} ${T('Fit all')}</button></div></div><div class="tree-wrap"><svg id="tree-svg" preserveAspectRatio="xMidYMid meet"></svg><div id="node-card" hidden></div><div class="tree-hint small">${T('drag to pan · wheel to zoom')}</div></div>`; VIEW.init = false; renderTree(); renderNodeCard(selectedNode); wireTree(); }
  else if (kind === 'weapons') body.innerHTML = renderWeaponsHTML();
  else if (kind === 'charms') body.innerHTML = renderCharmsHTML();
  else if (kind === 'partyover') body.innerHTML = renderPartyOverHTML();
  else if (kind === 'toss') body.innerHTML = renderTossHTML();
  else if (kind === 'chelo') body.innerHTML = renderCheloHTML();
  else if (kind === 'records') body.innerHTML = renderRecordsHTML();
  else if (kind === 'summary') body.innerHTML = renderSummaryHTML();
  wirePanel(body);
  glossNode($('panel-box'));
}
function wirePanel(body) {
  body.querySelectorAll('.pay-btn').forEach(b => b.onclick = () => {
    const p = S.party; const tab = p.tabs.find(t => String(t.id) === b.dataset.tab); if (!tab) return;
    if (tab.cleanup) { if (p.candy < tab.amount) return; p.candy -= tab.amount; p.cleanupPaid = true; p.tabs = []; S.perm.credits++; saveGame(); SFX.pay(); closePanel(); rollCredits(); return; }
    const dueLeftBefore = tab.dueLeft; const res = payTab(tab); if (!res) return; SFX.pay();
    if (dueLeftBefore >= 2) unlockAchievement('grace'); if (D.tier() >= 5) unlockAchievement('tier5');
    let msg = es(`Paid ${T(tab.guest)}. Favor: ${T(tab.favorText)}. +${res.ks} Keepsakes.`, `Pagaste ${T(tab.guest)}. Favor: ${T(tab.favorText)}. +${res.ks} Keepsakes.`);
    if (D.graceRuns() > 0 && !S.party.tabs.length) msg += es(` Grace Period: no new Tab until after Run ${D.nextTabRun()}.`, ` Periodo de gracia: sin nueva Tab hasta después de la Run ${D.nextTabRun()}.`);
    if (res.tierAfter > res.tierBefore) msg += ` Tier ${res.tierAfter}!`;
    if (res.unlocked.length) msg += es(' Now on sale at the weapons table: ', ' A la venta en la mesa de armas: ') + res.unlocked.map(w => T(w.name) + ' (' + fmt(w.price) + ' Candy)').join(', ') + '.';
    toast(msg, 3500); backerSay(res.tierAfter > res.tierBefore ? '¡Eso! Tier ' + res.tierAfter + '.' : es('Muy bien. One less.', 'Muy bien. Una menos.'), 3); renderPanel(); refreshHub();
  });
  body.querySelectorAll('button[data-equip]').forEach(b => b.onclick = e => { e.stopPropagation(); S.party.weapon = b.dataset.equip; buildGun(D.weapon()); setReticle(D.weapon()); saveGame(); SFX.open(); renderPanel(); refreshHub(); });
  body.querySelectorAll('button[data-wup]').forEach(b => b.onclick = e => { e.stopPropagation(); const [wid, uid] = b.dataset.wup.split(':'); const w = WEAPONS.find(x => x.id === wid), u = D.wupTracks(w).find(x => x.id === uid); if (buyWup(w, u)) { SFX.buy(); toast(es(`${T(w.name)}: ${T(u.name)} rank ${D.wup(w, u.id)}`, `${T(w.name)}: ${T(u.name)} rango ${D.wup(w, u.id)}`)); renderPanel(); refreshHub(); } });
  body.querySelectorAll('button[data-buy]').forEach(b => b.onclick = e => { e.stopPropagation(); const w = WEAPONS.find(x => x.id === b.dataset.buy); if (buyWeapon(w)) { SFX.pay(); toast(es(`${T(w.name)} is yours — forever. Equipped.`, `${T(w.name)} es tuya — para siempre. Equipada.`), 3500); backerSay(es('Ooh, fancy.', 'Uy, qué elegante.'), 3); renderPanel(); refreshHub(); } });
  body.querySelectorAll('button[data-charm]').forEach(b => b.onclick = () => { if (buyCharm(CHARMS.find(c => c.id === b.dataset.charm))) { SFX.buy(); renderPanel(); refreshHub(); } });
  const po = $('btn-partyover'); if (po) po.onclick = () => {
    if (!confirm(es("Call Party's Over? The Skill Tree, Candy, Tabs and Tier reset. Keepsakes, Charms and weapons stay.", "¿Declarar Party's Over? El Árbol, los Dulces, las Tabs y el Tier se reinician. Keepsakes, Charms y armas se quedan."))) return;
    if (!S.party.everOverdue && S.party.tabsPaid >= 6) unlockAchievement('no_cut');
    snapshotParty(D.prestigeKeepsakes()); partysOver(); arriveTabsIfDue(); selectedNode = null; closePanel(); backerSay(es('Bigger party next time, eh?', 'Una fiesta más grande la próxima, ¿eh?'), 5); refreshHub(); openPanel('summary');
  };
  const bd = $('btn-don'); if (bd) bd.onclick = () => {
    const p = S.party, r = p.lastRun; RUN.doubleOffered = true; const win = Math.random() < D.coinWin(); const amt = r.banked;
    if (win) p.candy += amt; else p.candy = Math.max(0, p.candy - amt);
    p.donResult = { win, amt }; win ? SFX.pay() : SFX.cut(); saveGame(); renderPanel(); refreshHub();
  };
  const ln = $('btn-lore-next'); if (ln) ln.onclick = () => { S.perm.lore = (S.perm.lore || 0) + 1; saveGame(); S.party.cheloTopic = 'lore'; if (S.perm.lore >= LORE.length) unlockAchievement('lore_all'); renderPanel(); };
  const sg = $('btn-summary-go'); if (sg) sg.onclick = () => closePanel();
  const lt = $('btn-lore-tabs'); if (lt) lt.onclick = () => { S.party.cheloTopic = 'tabs'; renderPanel(); };
  const lb = $('btn-lore-back'); if (lb) lb.onclick = () => { S.party.cheloTopic = null; renderPanel(); };
  const lv = $('btn-lore-leave'); if (lv) lv.onclick = () => closePanel();
  const tj = $('btn-toss-join'); if (tj) tj.onclick = () => { closePanel(); startRun({ toss: true }); };
  const ts = $('btn-toss-skip'); if (ts) ts.onclick = () => { closePanel(); startRun({}); };
}

// ---- Mailbox ----
function renderMailboxHTML() {
  const p = S.party, r = p.lastRun;
  const tier = D.tier(), done = p.tabsPaid % BAL.tabs_per_tier, left = BAL.tabs_per_tier - done, unlocks = nextTierUnlocks(tier + 1), cut = D.cutPct();
  let tabs = '';
  if (!p.tabs.length) tabs = `<div class="empty">${D.centerpieceDue() ? es('No Tabs. Only The Centerpiece remains.', 'No hay Tabs. Solo queda El Centerpiece.') : D.graceRuns() > 0 ? es(`<b>Grace Period.</b> No Tab until after Run ${D.nextTabRun()} — ${D.graceRuns()} Run${D.graceRuns() === 1 ? '' : 's'} of Candy that is all yours. Grow.`, `<b>Periodo de gracia.</b> Sin Tab hasta después de la Run ${D.nextTabRun()} — ${D.graceRuns()} Run${D.graceRuns() === 1 ? '' : 's'} de Candy que son todo tuyo. Crece.`) : es('No open Tabs. Enjoy it while it lasts.', 'No hay Tabs abiertas. Disfrútalo mientras dure.')}</div>`;
  else if (p.tabs.length < D.tabsOpenMax() && D.graceRuns() > 0) tabs += es(`<div class="small" style="margin:-4px 0 8px">Next Tab after Run ${D.nextTabRun()}.</div>`, `<div class="small" style="margin:-4px 0 8px">Próxima Tab después de la Run ${D.nextTabRun()}.</div>`);
  else tabs = p.tabs.map(t => {
    const over = !t.cleanup && t.dueLeft <= 0, warn = t.dueLeft === 1, can = p.candy >= t.amount, isNew = p.tabsArrivedThisRun.includes(t);
    const bar = t.cleanup ? '' : `<div class="due-bar ${over ? 'over' : warn ? 'warn' : ''}">${Array.from({ length: BAL.tab_due_runs }, (_, i) => `<i class="${i < t.dueLeft ? 'on' : ''}"></i>`).join('')}</div>`;
    const due = t.cleanup ? es('Pay it with what fell out of The Centerpiece.', 'Págala con lo que cayó del Centerpiece.') : over ? es(`OVERDUE · Tía Chelo takes ${cut}% until you pay`, `VENCIDA · Tía Chelo se lleva ${cut}% hasta que pagues`) : es(`Due in <b>${t.dueLeft}</b> Run${t.dueLeft === 1 ? '' : 's'}`, `Vence en <b>${t.dueLeft}</b> Run${t.dueLeft === 1 ? '' : 's'}`);
    return `<div class="tab-card ${over ? 'overdue' : ''} ${t.cleanup ? 'cleanup' : ''}">${over ? `<div class="stamp">${T('OVERDUE')}</div>` : isNew ? `<div class="stamp new">${T('NEW')}</div>` : ''}
      <div class="row"><div class="who">${es(T(t.guest) + "'s Tab", 'Tab de ' + T(t.guest))}</div><div class="amt">${fmt(t.amount)} Candy</div></div>
      ${bar}<div class="due ${over ? 'over' : ''}">${due}</div>
      <div class="favor">${t.cleanup ? '' : es(`Pays back: <b>${T(t.favorText)}</b> · +${BAL.keepsake_per_tab + BAL.keepsake_per_tier * t.tier} Keepsakes · counts toward Tier ${t.tier + 1}`, `Devuelve: <b>${T(t.favorText)}</b> · +${BAL.keepsake_per_tab + BAL.keepsake_per_tier * t.tier} Keepsakes · cuenta para el Tier ${t.tier + 1}`)}</div>
      <button class="pay-btn" data-tab="${t.id}" ${can ? '' : 'disabled'}>${can ? es('Pay ', 'Pagar ') + fmt(t.amount) : es('Need ' + fmt(t.amount - p.candy) + ' more Candy', 'Faltan ' + fmt(t.amount - p.candy) + ' Candy')}</button></div>`;
  }).join('');
  const tierBox = `<div class="tier-box"><b>Tier ${tier}</b> · ${es(`${p.tabsPaid} Tab${p.tabsPaid === 1 ? '' : 's'} paid this Party`, `${p.tabsPaid} Tab${p.tabsPaid === 1 ? '' : 's'} pagada${p.tabsPaid === 1 ? '' : 's'} esta Party`)}
    <div class="bar">${Array.from({ length: BAL.tabs_per_tier }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')}</div>
    ${D.centerpieceDue() ? es('The last Tab led here. Break The Centerpiece.', 'La última Tab llevó aquí. Rompe el Centerpiece.') : es(`${left} more for Tier ${tier + 1}: Sweet Spots shrink, piñatas move faster${unlocks ? ', and ' + unlocks + ' arrive' : ''}.`, `${left} más para el Tier ${tier + 1}: los Sweet Spots encogen, las piñatas van más rápido${unlocks ? ', y llegan ' + unlocks : ''}.`)}
    ${cut ? `<div style="color:var(--red);font-weight:800;margin-top:6px">${es(`Tía Chelo is taking ${cut}% of everything you collect.`, `Tía Chelo se lleva ${cut}% de todo lo que recoges.`)}</div>` : ''}</div>`;
  let right = '';
  if (r) {
    const acc = r.shots ? Math.round(100 * r.sweetHits / r.shots) : 0;
    right += `<h3>${es('Run ' + p.runCount + ' recap', 'Resumen de la Run ' + p.runCount)}</h3><div class="recap-grid">
      <div class="stat"><div class="l">${T('Banked')}</div><div class="v pink">+${fmt(r.banked)}</div></div>
      <div class="stat"><div class="l">${T('Sweet Hits')}</div><div class="v">${r.sweetHits}<span class="small"> / ${r.shots} (${acc}%)</span></div></div>
      <div class="stat"><div class="l">${T('Best Streak')}</div><div class="v">${r.bestStreak}${r.crits ? `<span class="small"> · ${r.crits} crit${r.crits === 1 ? '' : 's'}</span>` : ''}</div></div>
      <div class="stat"><div class="l">${r.taken ? T('The Cut took') : T('Spillover')}</div><div class="v ${r.taken ? 'red' : ''}">${r.taken ? '−' + fmt(r.taken) : '+' + fmt(r.spill)}</div></div></div>`;
    if (rank('double') && !RUN.doubleOffered && r.banked > 0) right += `<div class="don">${es(`<b>Double or Nothing.</b> Flip for the ${fmt(r.banked)} Candy you just banked. Heads doubles it, tails zeroes it.`, `<b>Doble o Nada.</b> Juega los Dulces que acabas de guardar (${fmt(r.banked)}). Cara lo dobla, cruz lo deja en cero.`)}<button id="btn-don">${es('Flip the coin', 'Lanzar la moneda')}</button></div>`;
    if (p.donResult) { right += `<div class="note ${p.donResult.win ? 'event' : ''}"><div class="from">${T('Double or Nothing')}</div>${p.donResult.win ? es('Heads! +' + fmt(p.donResult.amt) + ' Candy.', '¡Cara! +' + fmt(p.donResult.amt) + ' Candy.') : es('Tails. −' + fmt(p.donResult.amt) + ' Candy. That is the bit.', 'Cruz. −' + fmt(p.donResult.amt) + ' Candy. Así es la cosa.')}</div>`; delete p.donResult; }
  } else right += `<h3>${es('Before the first Run', 'Antes de la primera Run')}</h3><div class="note decision"><div class="from">${es('The one decision', 'La única decisión')}</div>${es('Candy from each Run goes either to the <b>Tabs</b> (pay on time: no Cut, higher Tier) or to the <b>Candy Tree</b> (shoot better, invite more piñatas). Never both.', 'Los Dulces de cada Run van a las <b>Tabs</b> (pagar a tiempo: sin Cut, más Tier) o al <b>Candy Tree</b> (disparar mejor, invitar más piñatas). Nunca a ambos.')}</div>`;
  if (p.crownNote) { right += `<div class="note event"><div class="from">${T('Sugar Crown')}</div>${es(`Sugar Crown: ${T(p.crownNote)}'s Tab arrived already paid.`, `Corona de Azúcar: la Tab de ${T(p.crownNote)} llegó ya pagada.`)}</div>`; delete p.crownNote; }
  if (p.centerpieceBroken && p.cleanupTab && !p.cleanupPaid) right += `<div class="note event"><div class="from">${es('The Backyard', 'El Backyard')}</div>${es('<b>No Tabs left.</b> …and then one more arrives.', '<b>No quedan Tabs.</b> …y entonces llega una más.')}</div>`;
  right += `<div class="note"><div class="from">${es('Note from the Backer', 'Nota de la Backer')}</div>${T(backerNote())}</div>`;
  return `<div class="mail-cols"><div><h3>Tabs <span class="badge ${D.overdueCount() ? 'red' : ''}">${p.tabs.length}</span></h3>${tabs}${tierBox}</div><div>${right}</div></div>`;
}
// Tía Chelo's portrait for the dialogue: her actual head, photographed by the thumbnail renderer (re-shot when she changes)
function cheloPortrait() {
  const key = DREAD.on ? 'chelo_dread' : 'chelo';
  if (!(key in THUMBS)) {
    try {
      if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setSize(120, 120); thumbR.setPixelRatio(1); thumbR.outputEncoding = THREE.sRGBEncoding; }
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(DREAD.on ? 0x8899bb : 0xffffff, 0x9a8f6a, DREAD.on ? 0.6 : 1.0)); const dl = new THREE.DirectionalLight(DREAD.on ? 0xff6060 : 0xffffff, 0.9); dl.position.set(2, 3, 5); sc.add(dl);
      const g = BACKER.group; const parent = g.parent; const pos = g.position.clone(), rot = g.rotation.clone(); parent.remove(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); sc.add(g);
      const cam = new THREE.PerspectiveCamera(28, 1, 0.05, 20); cam.position.set(0.15, 1.75, 1.55); cam.lookAt(0, 1.62, 0);
      thumbR.render(sc, cam); THUMBS[key] = thumbR.domElement.toDataURL('image/png');
      sc.remove(g); parent.add(g); g.position.copy(pos); g.rotation.copy(rot);
    } catch (e) { THUMBS[key] = null; }
  }
  return THUMBS[key] ? `<img src="${THUMBS[key]}" alt="Tía Chelo">` : ico('person', 80);
}
function renderCheloHTML() {
  const p = S.party, od = D.overdueCount(), dread = od > 0, idx = S.perm.lore || 0, topic = p.cheloTopic;
  const face = dread ? `<div class="chelo-face dread">${cheloPortrait()}</div>` : `<div class="chelo-face">${cheloPortrait()}</div>`;
  let line;
  if (topic === 'tabs') line = dread ? es(`“${od} Tab${od === 1 ? '' : 's'} late. I take ${D.cutPct()}% of everything you pick up until it is paid. Go to the Mailbox. Pay one. Any one. The lights come back.”`, `“${od} Tab${od === 1 ? '' : 's'} atrasada${od === 1 ? '' : 's'}. Me llevo ${D.cutPct()}% de todo lo que recoges hasta que pagues. Ve al Buzón. Paga una. La que sea. Las luces vuelven.”`) : es(`“The Tabs are in the Mailbox. Each one is a guest's share, due in a few Runs. Pay it and the guest owes you a Favor; three paid is a new Tier. Miss one and I start collecting from the grass.”`, `“Las Tabs están en el Buzón. Cada una es la parte de un invitado, vence en unas Runs. Págala y el invitado te debe un Favor; tres pagadas son un Tier nuevo. Deja vencer una y empiezo a cobrar del pasto.”`);
  else if (topic === 'lore') line = idx <= LORE.length ? `“${T(LORE[Math.min(idx, LORE.length) - 1])}”` : T('“That is all the story there is, mijo. For now.”');
  else line = T(dread ? '“…You came to talk? Now? With what you owe?”' : p.runCount === 0 ? '“Enjoy your party, mijo. Everything is arranged. We talk after.”' : idx === 0 ? '“Sit. Ask me anything. Well — almost anything.”' : '“Back again. Good. I like a Host who listens.”');
  const nextLabel = T(idx >= LORE.length ? 'Ask about the last piñata' : idx === 0 ? 'Ask about the party' : 'Tell me more');
  const canLore = idx < LORE.length || (idx >= LORE.length && p.centerpieceBroken);
  const lastLine = idx >= LORE.length && p.centerpieceBroken ? `<div class="note event"><div class="from">${T('The last piñata')}</div>${T('“It is me, mijo. I am the last piñata. Every Host who paid everything got to swing. None of them did. Sweet of them.”')}</div>` : '';
  return `<div class="chelo-wrap ${dread ? 'dread' : ''}">${face}<div class="chelo-say"><div class="from">${T(dread ? 'Tía Chelo · collecting' : 'Tía Chelo · the Backer')}</div><div class="line">${line}</div>${topic === 'lore' && idx >= LORE.length && !p.centerpieceBroken ? `<div class="small">${T('Break The Centerpiece, and ask again.')}</div>` : ''}${lastLine}
    <div class="chelo-actions">${topic ? `<button class="menu-btn" id="btn-lore-back">${T('Something else')}</button>` : ''}${(!topic || topic === 'tabs') && canLore ? `<button class="menu-btn" id="btn-lore-next">${nextLabel}</button>` : topic === 'lore' && canLore ? `<button class="menu-btn" id="btn-lore-next">${nextLabel}</button>` : ''}${topic !== 'tabs' ? `<button class="menu-btn" id="btn-lore-tabs">${T('Ask about the Tabs')}</button>` : ''}<button class="menu-btn" id="btn-lore-leave">${T('Leave her be')}</button></div>
    <div class="small" style="margin-top:8px">${T('Story:')} ${Math.min(idx, LORE.length)}/${LORE.length} ${T('told')}${idx >= LORE.length ? ' · ' + T('one secret left') : ''}</div></div></div>`;
}
function renderTossHTML() {
  return `<div class="po-box"><h3 style="margin:0 0 6px;color:var(--pink)">${es('The launcher is loaded.', 'El lanzador está cargado.')}</h3><p>${es(`Every ${BAL.toss_every} Runs the launcher throws piñatas in arcs across the yard. Their Sweet Spot is only open around the top of the arc — a short Open Window, high payout.`, `Cada ${BAL.toss_every} Runs el lanzador arroja piñatas en arcos por el patio. Su Sweet Spot solo está abierto cerca de la cima del arco — una Ventana Abierta corta, buena paga.`)}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="big-btn" id="btn-toss-join" style="margin-top:8px">${es('Join the Piñata Toss', 'Unirse al Piñata Toss')}</button><button class="big-btn alt" id="btn-toss-skip" style="margin-top:8px">${es('Regular Run', 'Run normal')}</button></div></div>`;
}
function renderWeaponsHTML() {
  const upgrades = w => D.wupTracks(w).map(u => { const r = D.wup(w, u.id), maxed = r >= u.ranks, cost = D.wupCost(w, u), can = !maxed && S.party.candy >= cost;
      return `<div class="wup"><span class="wu-n" title="${T(u.desc)}">${ico(u.icon, 15)} ${T(u.name)}</span><span class="wu-pips">${Array.from({ length: u.ranks }, (_, i) => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</span><button class="wu-btn" data-wup="${w.id}:${u.id}" ${can ? '' : 'disabled'}>${maxed ? T('MAX') : fmt(cost) + ' Candy'}</button></div>`; }).join('');
  return `<div class="small">${es("Weapons are bought with Candy for this Party; Party's Over clears them (the Old Friend Charm brings the Six-Shooter back). Each one goes on sale at a Tier. Equip one here or press <kbd>1</kbd>–<kbd>6</kbd> any time in the Backyard or mid-Run. <b>Upgrades</b> are three per weapon, paid in Candy, and reset at Party's Over like the Tree. Try them on the tin cans by the fence.", "Las armas se compran con Candy para esta Party; Party's Over las borra (el Amuleto Viejo Amigo devuelve el Revólver de Seis). Cada una sale a la venta en un Tier. Equípala aquí o pulsa <kbd>1</kbd>–<kbd>6</kbd> en el Backyard o en plena Run. Las <b>mejoras</b> son tres por arma, se pagan con Candy y se reinician con Party's Over, como el Árbol. Pruébalas en las latas junto a la cerca.")}</div><div class="weapons">` +
    WEAPONS.map((w, i) => { const un = D.weaponUnlocked(w.id); const sel = S.party.weapon === w.id; const sale = weaponOnSale(w); const price = D.weaponPrice(w); const can = sale && S.party.candy >= price;
      return `<div class="weapon ${sel ? 'sel' : ''} ${un ? '' : 'locked'}" data-w="${w.id}"><div class="n"><kbd>${i + 1}</kbd> ${T(w.name)}${sel ? es(' · equipped', ' · equipada') : ''}</div>
        <div class="stats">${es('Damage', 'Daño')} ${w.damage} · ${T('Mag')} ${D.magCapacity(w)} · ${w.pellets > 1 ? D.shotgunPellets() + es(' pellets', ' perdigones') : w.aoe ? es('Blast ', 'Explosión ') + D.aoe(w).toFixed(1) + ' m' : es('Hit radius ', 'Radio ') + (D.hitRadius(w) >= 0.02 ? es('mid', 'medio') : D.hitRadius(w) >= 0.01 ? es('small', 'pequeño') : es('tiny', 'diminuto'))} · <b>${(1 / D.cooldown(w)).toFixed(1)} ${es('shots/s', 'tiros/s')}</b> · ${es('reload', 'recarga')} ${D.reloadTime(w).toFixed(1)} s · Candy ×${w.candyMult} · ${es('time', 'tiempo')} ×${w.timeMult}${w.range ? ' · ' + es('range ', 'alcance ') + w.range + ' m' : ''}${w.heat ? es(' · runs hot', ' · se calienta') : ''}${w.pierce ? es(' · pierces', ' · perfora') : ''}</div>
        <div class="crit">Crit: ${T(w.critText)}</div><div class="style">${T(w.style)}</div>
        ${un ? (sel ? `<div class="small" style="margin-top:8px">${es('Equipped', 'Equipada')}</div>` : `<button class="equip-btn" data-equip="${w.id}">${es('Equip', 'Equipar')}</button>`) : sale ? `<button class="buy-btn" data-buy="${w.id}" ${can ? '' : 'disabled'}>${can ? es('Buy · ', 'Comprar · ') + fmt(price) + ' Candy' : es('Need ' + fmt(price - S.party.candy) + ' more Candy', 'Faltan ' + fmt(price - S.party.candy) + ' Candy')}</button>` : `<div class="small" style="margin-top:8px">${es('Locked · on sale from Tier', 'Bloqueada · a la venta desde el Tier')} ${w.unlockTier} · ${fmt(price)} Candy</div>`}
        ${un ? `<div class="wups">${upgrades(w)}</div>` : ''}</div>`; }).join('') + `</div>`;
}
function renderCharmsHTML() {
  return `<div class="small">${es(`Permanent. They survive every Party's Over. Bought with <b>Keepsakes</b> (${S.perm.keepsakes} available): 1 per Tab paid plus 1 per Tier of the Tab — and Party's Over mints more from the Party you throw (½ per Tab paid, +1 per Tier reached). Each Party you've thrown also pays +${BAL.prestige_candy_pct}% Candy on everything (now ×${D.globalCandy().toFixed(2)} total).`, `Permanentes. Sobreviven a cada Party's Over. Se compran con <b>Keepsakes</b> (${S.perm.keepsakes} disponibles): 1 por Tab pagada más 1 por Tier de la Tab — y Party's Over acuña más de la Party que das (½ por Tab pagada, +1 por Tier alcanzado). Cada Party que has dado también paga +${BAL.prestige_candy_pct}% de Candy en todo (ahora ×${D.globalCandy().toFixed(2)} total).`)}</div><div class="charms">` +
    CHARMS.map(c => { const have = charm(c.id); const maxed = have >= c.max; const cost = D.charmCost(c);
      return `<div class="charm"><div class="ico">${ico(c.icon, 36)}</div><div class="n">${T(c.name)} ${have ? `<span class="small">${have}/${c.max}</span>` : ''}</div><div class="d">${T(c.desc)}</div><div class="c-pips">${Array.from({ length: c.max }, (_, i) => `<i class="${i < have ? 'on' : ''}"></i>`).join('')}</div>
        <button data-charm="${c.id}" ${maxed || S.perm.keepsakes < cost ? 'disabled' : ''}>${maxed ? T('MAXED') : es(`Buy · ${cost} Keepsakes`, `Comprar · ${cost} Keepsakes`)}</button></div>`; }).join('') + `</div>`;
}
function renderPartyOverHTML() {
  const p = S.party;
  return `<div class="small">${es("When you can't or won't keep paying, flip the porch light and call it.", 'Cuando no puedas o no quieras seguir pagando, apaga la luz del porche y declárala.')}</div><div class="po-box">
    <ul><li>${es(`You <b>lose</b>: the Skill Tree (${D.nodesPurchased()} Nodes, invited piñatas included), your Candy (${fmt(p.candy)}), all Tabs (${p.tabs.length}), your Tier (${D.tier()}), Favors, and every weapon and weapon upgrade (${S.perm.weaponsUnlocked.length}/${WEAPONS.length} owned).`, `<b>Pierdes</b>: el Árbol (${D.nodesPurchased()} Nodos, piñatas invitadas incluidas), tus Dulces (${fmt(p.candy)}), todas las Tabs (${p.tabs.length}), tu Tier (${D.tier()}), los Favores y cada arma y mejora de arma (${S.perm.weaponsUnlocked.length}/${WEAPONS.length}).`)}</li>
    <li>${es(`You <b>mint</b>: <b>+${D.prestigeKeepsakes()} Keepsakes</b> for this Party (½ per Tab paid, +1 per Tier above 1) on top of the ${S.perm.keepsakes} you hold. Every Charm stays.`, `<b>Acuñas</b>: <b>+${D.prestigeKeepsakes()} Keepsakes</b> por esta Party (½ por Tab pagada, +1 por Tier sobre 1) además de los ${S.perm.keepsakes} que tienes. Cada Charm se queda.`)}</li>
    <li>${es(`Party ${S.perm.party + 1} pays <b>+${BAL.prestige_candy_pct * S.perm.party}% Candy</b> on everything (+${BAL.prestige_candy_pct}% per Party thrown)${charm('crown') ? ', and its first Tab arrives already paid (Sugar Crown)' : ''}${charm('headstart') ? ', with ' + fmt(400 * charm('headstart')) + ' Candy in the jar' : ''}.`, `La Party ${S.perm.party + 1} paga <b>+${BAL.prestige_candy_pct * S.perm.party}% de Candy</b> en todo (+${BAL.prestige_candy_pct}% por Party dada)${charm('crown') ? ', y su primera Tab llega ya pagada (Corona de Azúcar)' : ''}${charm('headstart') ? ', con ' + fmt(400 * charm('headstart')) + ' Candy en el frasco' : ''}.`)}</li></ul>
    <button class="big-btn danger" id="btn-partyover">${es("Call Party's Over", "Declarar Party's Over")}</button></div>`;
}
function rollCredits() {
  showScreen('credits'); HUB.mode = 'credits';
  $('credits-text').innerHTML = es(`You paid every Tab. Party ${S.perm.party}, ${S.party.runCount} Runs, ${S.party.tabsPaid} Tabs paid. The Centerpiece is confetti.<br><br>Keepsakes for the road: <b>${S.perm.keepsakes}</b>.`, `Pagaste todas las Tabs. Party ${S.perm.party}, ${S.party.runCount} Runs, ${S.party.tabsPaid} Tabs pagadas. El Centerpiece es confeti.<br><br>Keepsakes para el camino: <b>${S.perm.keepsakes}</b>.`);
  document.body.classList.add('menu');
}
// after a Run: a proper summary screen; inputs are frozen until you leave it
function showRunOver() {
  const p = S.party, r = p.lastRun; if (!r) return;
  HUB.mode = 'runover'; holdStop(); document.body.classList.add('menu');
  if (document.pointerLockElement) document.exitPointerLock();
  const acc = r.shots ? Math.round(100 * r.sweetHits / r.shots) : 0;
  const soon = p.tabs.filter(t => !t.cleanup).sort((a, b) => a.dueLeft - b.dueLeft)[0];
  const el = $('runover');
  el.querySelector('.ro-title').textContent = T(`Run ${p.runCount} over`);
  // records live across Parties; a new one gets a badge and a louder fanfare
  const rec = S.perm.records || (S.perm.records = { run: 0, streak: 0, breaks: 0 }); const newRecs = [];
  if (r.banked > rec.run) { if (rec.run > 0) newRecs.push(es('Best Run: ', 'Mejor Run: ') + fmt(r.banked) + ' Candy'); rec.run = r.banked; }
  if (r.bestStreak > rec.streak) { if (rec.streak > 0) newRecs.push(es('Best Streak: ', 'Mejor Streak: ') + r.bestStreak); rec.streak = r.bestStreak; }
  if (r.breaks > rec.breaks) { if (rec.breaks > 0) newRecs.push(es('Most broken: ', 'Más rotas: ') + r.breaks); rec.breaks = r.breaks; }
  el.querySelector('.ro-records').innerHTML = newRecs.map(x => `<span class="rec">${T('NEW RECORD')} · ${x}</span>`).join('');
  // the banked number rolls up
  const bankEl = el.querySelector('.ro-bank'); bankEl.innerHTML = `+0 <span>Candy banked</span>`; const t0 = performance.now(); const dur = Math.min(1600, 500 + r.banked * 0.6);
  (function roll() { const k = Math.min(1, (performance.now() - t0) / dur); const e = 1 - Math.pow(1 - k, 3); bankEl.innerHTML = `+${fmt(Math.round(r.banked * e))} <span>${T('Candy banked')}</span>`; if (k < 1 && HUB.mode === 'runover') requestAnimationFrame(roll); })();
  if (r.banked > 0) { const cf = el.querySelector('.ro-confetti'); cf.innerHTML = ''; const n = newRecs.length ? 70 : 36; for (let i = 0; i < n; i++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + '%'; c.style.background = ['#ff5ea8', '#ffd23f', '#2ec4b6', '#ff8c42', '#7b5ea7'][i % 5]; c.style.animationDuration = (1.6 + Math.random() * 1.4) + 's'; c.style.animationDelay = (Math.random() * 0.8) + 's'; cf.appendChild(c); } }
  if (newRecs.length) SFX.golden();
  $('btn-runover-again').hidden = (typeof TUT !== 'undefined' && TUT.active) || D.centerpieceDue();
  el.querySelector('.ro-grid').innerHTML = [
    ['Shots', r.shots], ['Sweet Hits', `${r.sweetHits} <small>(${acc}%)</small>`], ['Crits', r.crits], ['Best Streak', r.bestStreak], ['Piñatas broken', r.breaks + (r.chains ? ` <small>(${r.chains} chained)</small>` : '')], ['Time earned', '+' + (r.bonusTime || 0).toFixed(1) + ' s'], ['Misses', r.misses], ['Spillover', '+' + fmt(r.spill) + (r.vac ? ` <small>· vacuum +${r.vac}</small>` : '')],
  ].map(([l, v]) => `<div class="stat"><div class="l">${T(l)}</div><div class="v">${v}</div></div>`).join('') + (r.taken ? `<div class="stat red"><div class="l">${T('Tía Chelo took')}</div><div class="v">−${fmt(r.taken)}</div></div>` : '') + (r.launched ? `<div class="stat"><div class="l">${T('Launched')}</div><div class="v">${r.launched}</div></div>` : '') + (r.llamas ? `<div class="stat"><div class="l">${T('Lucky Llamas')}</div><div class="v">${r.llamas}</div></div>` : '') + (r.keepsakesWon ? `<div class="stat"><div class="l">${T('Keepsakes won')}</div><div class="v">+${r.keepsakesWon}</div></div>` : '') + (r.jackpots ? `<div class="stat"><div class="l">${T('Jackpots')}</div><div class="v">${r.jackpots}</div></div>` : '') + (r.bossFaced ? `<div class="stat ${r.bossDown ? '' : 'red'}"><div class="l">${T('Tier boss')}</div><div class="v">${r.bossDown ? T('DOWN') : T('still up')}</div></div>` : '') + (r.spikers ? `<div class="stat red"><div class="l">${T('Spikers popped')}</div><div class="v">${r.spikers} <small>(−${(r.penalty || 0).toFixed(0)} s)</small></div></div>` : '');
  let notes = '';
  if (p.tabsArrivedThisRun.length) notes += `<div class="note event"><div class="from">${T('New in the Mailbox')}</div>${p.tabsArrivedThisRun.map(t => es(`<b>${T(t.guest)}'s Tab: ${fmt(t.amount)} Candy</b>${t.cleanup ? '' : ' — due in ' + t.dueLeft + ' Runs'}`, `<b>Tab de ${T(t.guest)}: ${fmt(t.amount)} Candy</b>${t.cleanup ? '' : ' — vence en ' + t.dueLeft + ' Runs'}`)).join(' · ')}</div>`;
  if (soon) notes += `<div class="note ${soon.dueLeft <= 0 ? 'overdue' : ''}"><div class="from">${T('Closest Tab')}</div>${es(`${T(soon.guest)}'s Tab (${fmt(soon.amount)}) ${soon.dueLeft <= 0 ? '<b>is OVERDUE</b> — Tía Chelo takes ' + D.cutPct() + '% until you pay' : 'is due in <b>' + soon.dueLeft + '</b> Run' + (soon.dueLeft === 1 ? '' : 's')}. You now have <b>${fmt(p.candy)}</b> Candy${p.candy >= soon.amount ? ' — enough to pay it.' : ' (' + fmt(soon.amount - p.candy) + ' short).'}`, `La Tab de ${T(soon.guest)} (${fmt(soon.amount)}) ${soon.dueLeft <= 0 ? '<b>está VENCIDA</b> — Tía Chelo se lleva ' + D.cutPct() + '% hasta que pagues' : 'vence en <b>' + soon.dueLeft + '</b> Run' + (soon.dueLeft === 1 ? '' : 's')}. Ahora tienes <b>${fmt(p.candy)}</b> Candy${p.candy >= soon.amount ? ' — suficiente para pagarla.' : ' (faltan ' + fmt(soon.amount - p.candy) + ').'}`)}</div>`;
  if (p.runCount === 1) notes += `<div class="note decision"><div class="from">${T('The Backyard opens up')}</div>${es('The <b>Candy Tree</b> is open: Candy you don\'t put toward a Tab can buy Nodes there. The weapons table opens after Run 2.', 'El <b>Candy Tree</b> está abierto: los Dulces que no pongas en una Tab pueden comprar Nodos ahí. La mesa de armas abre tras la Run 2.')}</div>`;
  if (p.runCount === 2) notes += `<div class="note decision"><div class="from">${T('The Backyard opens up')}</div>${es('The <b>weapons table</b> is open. Weapons are bought with Candy and kept forever.', 'La <b>mesa de armas</b> está abierta. Las armas se compran con Candy.')}</div>`;
  if (p.tabsArrivedThisRun.length || p.tabs.some(t => p.candy >= t.amount)) notes += `<div class="note"><div class="from">${T('Back in the Backyard')}</div>${es('Walk to the <b>Mailbox</b> to read and pay Tabs — the golden marker points the way.', 'Ve al <b>Mailbox</b> para leer y pagar Tabs — el marcador dorado señala el camino.')}</div>`;
  el.querySelector('.ro-notes').innerHTML = notes;
  el.classList.add('on');
}
function closeRunOver() {
  $('runover').classList.remove('on'); document.body.classList.remove('menu');
  HUB.mode = 'hub'; interactCooldownUntil = performance.now() + 1500; refreshHub(); backToWorld();
}
let recapT = null;
function showRecapCard() {
  const p = S.party, r = p.lastRun; if (!r) return;
  const card = $('recap-card'); const acc = r.shots ? Math.round(100 * r.sweetHits / r.shots) : 0;
  const soon = p.tabs.slice().sort((a, b) => a.dueLeft - b.dueLeft)[0];
  card.innerHTML = `<div class="rc-head"><b>${es(`Run ${p.runCount} over`, `Run ${p.runCount} terminada`)}</b><span class="rc-bank">+${fmt(r.banked)} Candy</span></div>
    <div class="rc-row">${r.sweetHits}/${r.shots} Sweet (${acc}%) · ${es('best Streak', 'mejor Streak')} ${r.bestStreak}${r.crits ? ' · ' + r.crits + es(' crits', ' crits') : ''}${r.taken ? ` · <span style="color:#ff8a8a">${es(`Tía Chelo took ${fmt(r.taken)}`, `Tía Chelo se llevó ${fmt(r.taken)}`)}</span>` : ''}</div>
    ${p.tabsArrivedThisRun.length ? `<div class="rc-row new">${p.tabsArrivedThisRun.map(t => es(`${T(t.guest)}'s Tab: ${fmt(t.amount)}`, `Tab de ${T(t.guest)}: ${fmt(t.amount)}`)).join(' · ')}</div>` : ''}
    ${soon && !soon.cleanup ? `<div class="rc-row">${es(`${T(soon.guest)}'s Tab ${soon.dueLeft <= 0 ? '<b style="color:#ff8a8a">is OVERDUE</b>' : 'due in <b>' + soon.dueLeft + '</b> Run' + (soon.dueLeft === 1 ? '' : 's')} · you have ${fmt(p.candy)} Candy`, `Tab de ${T(soon.guest)} ${soon.dueLeft <= 0 ? '<b style="color:#ff8a8a">VENCIDA</b>' : 'vence en <b>' + soon.dueLeft + '</b> Run' + (soon.dueLeft === 1 ? '' : 's')} · tienes ${fmt(p.candy)} Candy`)}</div>` : ''}
    <div class="rc-foot">${es('Walk to the Mailbox to pay, or the Candy Tree to invest.', 'Ve al Buzón para pagar, o al Árbol de Dulces para invertir.')} <kbd>E</kbd> ${es('to dismiss', 'para cerrar')}</div>`;
  card.hidden = false; clearTimeout(recapT); recapT = setTimeout(() => { card.hidden = true; }, 12000);
}

// ---- The Skill Tree graph ----
const TREE = { cx: 500, cy: 400, rings: [0, 175, 330, 485, 640, 795, 950, 1105, 1260], span: 26, spans: { sugar: 27, muscle: 26, trigger: 25, wild: 30, tempo: 25, guests: 27 }, sx: 1.25, angles: { guests: 30, sugar: -30, muscle: -90, trigger: -150, wild: 150, tempo: 90 } };
// the graph is bigger than the screen now: drag to pan, wheel to zoom, Fit to see it all
const VIEW = { x: 0, y: 0, w: 0, h: 0, init: false, fit: null };
function parentOf(node) {
  if (!node.prereq) return null;
  for (const k in node.prereq) if (NODE_BY_ID[k] && NODE_BY_ID[k].branch === node.branch) return NODE_BY_ID[k];
  return null;
}
function layoutTree() {
  const pos = {};
  BRANCHES.forEach(b => {
    const base = TREE.angles[b.id];
    const kids = n => b.nodes.filter(m => parentOf(m) === n);
    const leaves = n => { const k = kids(n); return k.length ? k.reduce((a, c) => a + leaves(c), 0) : 1; };
    const roots = b.nodes.filter(n => !parentOf(n));
    const total = roots.reduce((a, r) => a + leaves(r), 0);
    const place = (n, depth, a0, a1) => {
      const ang = (a0 + a1) / 2; const rad = TREE.rings[Math.min(depth, TREE.rings.length - 1)];
      const t = ang * Math.PI / 180; pos[n.id] = { x: TREE.cx + Math.cos(t) * rad * TREE.sx, y: TREE.cy + Math.sin(t) * rad, ang, depth };
      const k = kids(n); let a = a0; k.forEach(c => { const w = leaves(c) / leaves(n) * (a1 - a0); place(c, depth + 1, a, a + w); a += w; });
    };
    const span = TREE.spans[b.id] || TREE.span; let a = base - span; const depth0 = b.id === 'wild' ? 4 : 1;
    roots.forEach(r => { const w = leaves(r) / total * span * 2; place(r, depth0, a, a + w); a += w; });
  });
  // Relaxation: every node owns a footprint (circle + pips + two text lines); push overlapping footprints apart.
  const ids = Object.keys(pos); const FW = 150, FH = 160, OFF = 26;
  for (let it = 0; it < 80; it++) {
    let moved = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const A = pos[ids[i]], B = pos[ids[j]]; const dx = (B.x - A.x) / FW, dy = (B.y - A.y) / FH; const d = Math.hypot(dx, dy) || 0.001;
      if (d < 1) { const push = (1 - d) * 0.5; const ux = dx / d, uy = dy / d; A.x -= ux * push * FW * 0.5; A.y -= uy * push * FH * 0.5; B.x += ux * push * FW * 0.5; B.y += uy * push * FH * 0.5; moved++; }
    }
    ids.forEach(id => { const P = pos[id]; const dx = P.x - TREE.cx, dy = P.y - TREE.cy - OFF; const d = Math.hypot(dx / 1.2, dy) || 0.001; const min = 140; if (d < min) { const k = min / d; P.x = TREE.cx + dx * k; P.y = TREE.cy + OFF + dy * k; moved++; } });
    if (!moved) break;
  }
  return pos;
}
let treePos = null, selectedNode = null;
// Piñata portraits for the Tree: each kind is built once, photographed by a tiny second renderer, and cached as an image
const THUMBS = {}; let thumbR = null;
function kindThumb(kind) {
  if (kind in THUMBS) return THUMBS[kind];
  try {
    if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setSize(120, 120); thumbR.setPixelRatio(1); thumbR.outputEncoding = THREE.sRGBEncoding; }
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x9a8f6a, 1.0)); const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(3, 4, 5); sc.add(dl);
    const P = new Pinata(kind, { position: new THREE.Vector3(0, 0, 0), stringLen: 0, bodyScale: 1 });
    scene.remove(P.pivot); const i = pinatas.indexOf(P); if (i >= 0) pinatas.splice(i, 1);
    P.pivot.position.set(0, 0, 0); P.body.position.set(0, 0, 0); if (P.setOpen) P.setOpen(true); sc.add(P.pivot);
    if (kind === 'skull' && P.jaw) P.jaw.position.y = P.jawY;
    const bx = new THREE.Box3().setFromObject(P.pivot); const size = bx.getSize(new THREE.Vector3()), c = bx.getCenter(new THREE.Vector3()); const r = Math.max(size.x, size.y, size.z) || 1;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 60); cam.position.set(c.x + r * 0.9, c.y + r * 0.55, c.z + r * 1.75); cam.lookAt(c);
    thumbR.render(sc, cam); THUMBS[kind] = thumbR.domElement.toDataURL('image/png');
    P.pivot.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  } catch (e) { THUMBS[kind] = null; }
  return THUMBS[kind];
}
function nodeState(n) {
  const r = rank(n.id);
  if (r >= n.ranks) return 'maxed';
  if (!nodeAvailable(n)) return 'locked';
  return S.party.candy >= D.nodeCost(n, r) ? 'can' : 'dim';
}
function renderTree() {
  treePos = treePos || layoutTree();
  const svg = $('tree-svg'); if (!svg) return; const p = S.party;
  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
  svg.innerHTML = '';
  const g = el('g', {}); svg.appendChild(g);
  const affordable = BRANCHES.flatMap(b => b.nodes).filter(n => nodeState(n) === 'can').length;
  const sub = $('tree-sub'); if (sub) sub.textContent = `${D.nodesPurchased()} ${T('Nodes owned')} · ${affordable} ${T('affordable')} · ${T('click a Node for details, twice to buy')} · ${T('each Node adds')} ${BAL.tab_percent_per_node}% ${T('to future Tabs')}`;
  BRANCHES.forEach(b => b.nodes.forEach(n => {
    const par = parentOf(n); const a = par ? treePos[par.id] : { x: TREE.cx, y: TREE.cy }; const z = treePos[n.id];
    const st = nodeState(n); const cls = 'edge' + (rank(n.id) ? ' owned' : '') + (st === 'locked' ? ' locked' : '');
    const line = el('line', { x1: a.x, y1: a.y, x2: z.x, y2: z.y, class: cls }); if (rank(n.id)) line.style.stroke = b.color; g.appendChild(line);
    if (n.prereq && n.prereq.total) { const mx = (a.x + z.x) / 2, my = (a.y + z.y) / 2; g.appendChild(el('rect', { x: mx - 44, y: my - 12, width: 88, height: 24, rx: 12, class: 'reqbg' })); g.appendChild(el('text', { x: mx, y: my + 5, class: 'req' }, `${n.prereq.total} Nodes`)); }
    if (n.id === 'sugar_hands') { const c = treePos.crit_refund; g.appendChild(el('line', { x1: c.x, y1: c.y, x2: z.x, y2: z.y, class: 'edge locked' })); }
  }));
  const xs = Object.values(treePos).map(q => q.x), ys = Object.values(treePos).map(q => q.y);
  BRANCHES.forEach(b => { const t = TREE.angles[b.id] * Math.PI / 180; const far = Math.max(...b.nodes.map(n => { const q = treePos[n.id]; return Math.hypot((q.x - TREE.cx) / TREE.sx, q.y - TREE.cy); })); const r = far + 120; const lx = TREE.cx + Math.cos(t) * r * TREE.sx, ly = TREE.cy + Math.sin(t) * r + 6; xs.push(lx); ys.push(ly - 12, ly + 6); const lbl = el('text', { x: lx, y: ly, class: 'blabel' }, T(b.name).toUpperCase()); lbl.style.fill = b.color; g.appendChild(lbl); });
  const x0 = Math.min(...xs) - 95, x1 = Math.max(...xs) + 95, y0 = Math.min(...ys) - 45, y1 = Math.max(...ys) + 90;
  VIEW.fit = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  if (!VIEW.init) fitView(); applyView();
  const hub = el('g', { class: 'hub' });
  const hc = el('circle', { cx: TREE.cx, cy: TREE.cy, r: 54 }); hc.style.stroke = '#ff5ea8'; hc.style.strokeWidth = 4; hub.appendChild(hc);
  hub.appendChild(el('text', { x: TREE.cx, y: TREE.cy + 6, class: 'big' }, fmt(p.candy)));
  hub.appendChild(el('text', { x: TREE.cx, y: TREE.cy + 26, class: 'small' }, 'CANDY'));
  hub.appendChild(el('text', { x: TREE.cx, y: TREE.cy - 18, class: 'small' }, 'CANDY'));
  g.appendChild(hub);
  BRANCHES.forEach(b => b.nodes.forEach(n => {
    const z = treePos[n.id]; const st = nodeState(n); const r = rank(n.id);
    const gn = el('g', { class: 'node ' + st + (r ? ' owned' : '') + (selectedNode === n ? ' sel' : ''), 'data-node': n.id, tabindex: 0, role: 'button', 'aria-label': n.name });
    if (st === 'can') { const halo = el('circle', { cx: z.x, cy: z.y, r: 40, class: 'halo' }); halo.style.fill = b.color; gn.appendChild(halo); }
    const bg = el('circle', { cx: z.x, cy: z.y, r: 31, class: 'bg' });
    if (r) { bg.style.fill = st === 'maxed' ? b.color : '#fff'; bg.style.stroke = b.color; } else if (st === 'can') bg.style.stroke = b.color;
    gn.appendChild(bg);
    if (st === 'maxed') { const ring = el('circle', { cx: z.x, cy: z.y, r: 37 }); ring.style.fill = 'none'; ring.style.stroke = '#ffd23f'; ring.style.strokeWidth = 3; gn.appendChild(ring); }
    const thumb = n.kind ? kindThumb(n.kind) : null;
    if (thumb) { const im = el('image', { x: z.x - 27, y: z.y - 27, width: 54, height: 54, href: thumb, preserveAspectRatio: 'xMidYMid meet' }); im.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', thumb); gn.appendChild(im); if (st === 'locked') { const gl = el('g', { class: 'nico small', transform: `translate(${z.x + 10},${z.y + 10}) scale(0.7)` }); gl.innerHTML = icoSVG('lock'); gn.appendChild(gl); } }
    else { const gi = el('g', { class: 'nico', transform: `translate(${z.x - 15},${z.y - 15}) scale(1.25)` }); gi.innerHTML = icoSVG(st === 'locked' ? 'lock' : n.icon); gn.appendChild(gi); }
    // rank pips: a tidy row just under the circle, inside the node's own footprint
    if (n.ranks > 1) { const pw = 10, gap = 3, tot = n.ranks * pw + (n.ranks - 1) * gap; for (let i = 0; i < n.ranks; i++) { const rect = el('rect', { x: z.x - tot / 2 + i * (pw + gap), y: z.y + 37, width: pw, height: 5, rx: 2.5 }); rect.style.fill = i < r ? b.color : '#d9ccb6'; gn.appendChild(rect); } }
    gn.appendChild(el('text', { x: z.x, y: z.y + 60, class: 'lbl' }, T(n.short)));
    const subT = st === 'maxed' ? T('MAXED') : st === 'locked' ? T('Locked') : fmt(D.nodeCost(n, r)) + ' Candy';
    gn.appendChild(el('text', { x: z.x, y: z.y + 77, class: 'sub' }, subT));
    gn.addEventListener('click', e => { if (TREE.dragging) return; selectNode(n); });
    gn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNode(n); } });
    g.appendChild(gn);
  }));
  glossNode(svg);
}
function applyView() { const svg = $('tree-svg'); if (svg && VIEW.w) svg.setAttribute('viewBox', `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`); }
// start close enough to read: if fitting everything would shrink the graph below ~70%, open zoomed in on the Candy hub instead
function fitView(all) {
  const svg = $('tree-svg'), f = VIEW.fit; if (!svg || !f) return; const r = svg.getBoundingClientRect(); const rw = Math.max(200, r.width), rh = Math.max(200, r.height);
  let w = f.w, h = f.h; if (w / h < rw / rh) w = h * rw / rh; else h = w * rh / rw;   // match the screen's aspect so 1 px is 1 px in both axes
  const scale = rw / w; VIEW.init = true;
  if (!all && scale < 0.7) { w = rw / 0.7; h = rh / 0.7; VIEW.x = TREE.cx - w / 2; VIEW.y = TREE.cy - h / 2 + 20; VIEW.w = w; VIEW.h = h; }
  else { VIEW.x = f.x + (f.w - w) / 2; VIEW.y = f.y + (f.h - h) / 2; VIEW.w = w; VIEW.h = h; }
  applyView();
}
function wireTree() {
  const svg = $('tree-svg'); let down = null, dragged = false;
  svg.addEventListener('click', e => { if (dragged) { dragged = false; return; } if (!e.target.closest('.node') && selectedNode) { selectedNode = null; renderTree(); renderNodeCard(null); } });
  svg.addEventListener('wheel', e => {
    e.preventDefault(); const r = svg.getBoundingClientRect(); const px = VIEW.x + (e.clientX - r.left) / r.width * VIEW.w, py = VIEW.y + (e.clientY - r.top) / r.height * VIEW.h;
    const f = e.deltaY > 0 ? 1.15 : 1 / 1.15; const nw = THREE.MathUtils.clamp(VIEW.w * f, VIEW.fit.w * 0.25, VIEW.fit.w * 1.4); const k = nw / VIEW.w;
    VIEW.x = px - (px - VIEW.x) * k; VIEW.y = py - (py - VIEW.y) * k; VIEW.w = nw; VIEW.h *= k; applyView();
  }, { passive: false });
  svg.addEventListener('pointerdown', e => { if (e.button !== 0) return; down = { x: e.clientX, y: e.clientY, vx: VIEW.x, vy: VIEW.y }; dragged = false; });
  window.addEventListener('pointermove', e => { if (!down) return; const r = svg.getBoundingClientRect(); const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 4) { dragged = true; TREE.dragging = true; } if (dragged) { VIEW.x = down.vx - dx * VIEW.w / r.width; VIEW.y = down.vy - dy * VIEW.h / r.height; applyView(); svg.style.cursor = 'grabbing'; } });
  window.addEventListener('pointerup', () => { down = null; svg.style.cursor = ''; setTimeout(() => { TREE.dragging = false; }, 0); });
  const fit = $('tree-fit'); if (fit) fit.onclick = () => fitView(true);
  const home = $('tree-home'); if (home) home.onclick = () => { VIEW.init = false; fitView(false); };
}
function selectNode(n) {
  if (selectedNode === n && nodeState(n) === 'can') { tryBuy(n); return; }
  selectedNode = n; renderTree(); renderNodeCard(n);
}
function tryBuy(n) { if (buyNode(n)) { SFX.buy(); toast(es(`${T(n.name)} → rank ${rank(n.id)}`, `${T(n.name)} → rango ${rank(n.id)}`)); $('panel-candy').textContent = fmt(S.party.candy); renderTree(); renderNodeCard(n); refreshHub(); } }
function statSnapshot() {
  return {
    'Run clock': D.runTime() + ' s', 'Starting Mag': D.magCapacity() + ' Rounds', 'Sweet Hit refund': D.sweetRefund() + (D.sweetRefund() === 1 ? ' Round' : ' Rounds'), 'Crit refund': D.critRefund() + ' Rounds',
    'Grace': D.grace() + (D.grace() === 1 ? ' Miss' : ' Misses'), 'Free First Round': D.freeFirst() ? 'yes' : 'no', 'Damage': '×' + D.damageMult().toFixed(2),
    'Spillover rate': Math.round(D.spillRate() * 100) + '%', 'Punch-Through': D.punch() + (D.punch() === 1 ? ' Layer' : ' Layers'), 'Pierce': D.pierce() ? 'yes' : 'no',
    'Classic Candy': '×' + D.candyMult('A').toFixed(2), 'Nesting Candy': '×' + D.candyMult('B').toFixed(2), 'Sugar Glass Candy': '×' + D.candyMult('C').toFixed(2), 'Clockwork Candy': '×' + D.candyMult('D').toFixed(2),
    'Golden chance': (D.goldenChance() * 100).toFixed(0) + '%', 'Starting piñatas': D.startPinatas(), 'Open Window': D.openWindow().toFixed(1) + ' s', 'New piñata every': D.spawnInterval().toFixed(1) + ' s',
    'Streak step': '+' + D.streakStep().toFixed(2) + ' per hit', 'Streak cap': '×' + D.streakCap().toFixed(2),
    'Chain Pop': Math.round(D.chainChance() * 100) + '%', 'Candy Vacuum': D.vacuum() ? 'unlocked' : 'no',
    'Double or Nothing': rank('double') ? 'unlocked (' + Math.round(D.coinWin() * 100) + '% heads)' : 'no', 'Confetti Burst': rank('confetti') ? 'unlocked (Q)' : 'no', 'Sugar Hands': rank('sugar_hands') ? 'unlocked' : 'no',
    'Reload': D.reloadTime().toFixed(2) + ' s', 'Fire rate': '×' + (1 / (1 - 0.10 * rank('hair_trigger'))).toFixed(2), 'Pistol cooling': '×' + (D.heatCool() / BAL.heat_cool).toFixed(2), 'Time per Sweet Hit': D.sweetTime().toFixed(1) + ' s', 'Time per Crit': D.critTime().toFixed(1) + ' s', 'Time cap': Math.round(D.timeBonusCap() * 100) + '% of the clock',
    'Shockwave': D.shock() ? D.shock().toFixed(1) + ' dmg' : 'no', 'Stun': D.stun() ? 'yes' : 'no', 'Break Candy': '×' + D.breakCandyMult().toFixed(2), 'Cannon radius': D.aoe(WEAPONS.find(w => w.id === 'cannon')).toFixed(1) + ' m', 'Sugar Rush': D.rush() ? D.rushDuration() + ' s' : 'no',
    'Lucky Llama': (D.llamaChance() * 100).toFixed(1) + '%', 'Jackpot': Math.round(D.jackpotChance() * 100) + '%', 'Max piñatas': D.maxPinatas(), 'Launcher': '×' + D.launcherRate().toFixed(1), 'Hot start': 'Streak ' + D.hotStart(), 'Vacuum from Streak': D.vacuum() ? D.vacuumStreak() + ' (+' + D.vacuumCandy() + ' each)' : 'no', 'Encore': D.encore() ? 'yes' : 'no', 'Heirloom': D.heirloom() ? 'yes' : 'no',
  };
}
function nodeEffect(n) {
  const r = rank(n.id); if (r >= n.ranks) return [];
  const before = statSnapshot(); S.party.nodes[n.id] = r + 1; const after = statSnapshot(); if (r) S.party.nodes[n.id] = r; else delete S.party.nodes[n.id];
  return Object.keys(before).filter(k => before[k] !== after[k]).map(k => `${T(k)}: ${T(before[k])} → <b>${T(after[k])}</b>`);
}
function renderNodeCard(n) {
  const card = $('node-card'); if (!card) return;
  if (!n) { card.hidden = true; return; }
  card.hidden = false;
  const r = rank(n.id), st = nodeState(n), b = BRANCHES.find(x => x.id === n.branch);
  const cost = r < n.ranks ? D.nodeCost(n, r) : 0;
  const pre = n.prereq ? Object.entries(n.prereq).map(([k, v]) => k === 'total' ? es(`${v} Nodes owned in total (you have ${D.nodesPurchased()})`, `${v} Nodos comprados en total (tienes ${D.nodesPurchased()})`) : k === 'tier' ? es(`Tier ${v}`, `Tier ${v}`) : es(`${T(NODE_BY_ID[k].name)} rank ${v}`, `${T(NODE_BY_ID[k].name)} rango ${v}`)).join(' · ') : '';
  const eff = nodeEffect(n);
  const th = n.kind ? kindThumb(n.kind) : null;
  card.innerHTML = `<div class="nc-head"><div><div class="nc-branch" style="color:${b.color}">${ico(n.icon, 14)} ${es(T(b.name) + ' branch', 'rama ' + T(b.name))}</div><div class="nc-name">${T(n.name)}</div></div><button class="nc-close" aria-label="Close">${ico('close', 16)}</button></div>${th ? `<div class="nc-thumb"><img src="${th}" alt="">${n.kind && !D.kindUnlocked(n.kind) ? `<span>${T('not invited yet')}</span>` : `<span>${T('at the party')}</span>`}</div>` : ''}
    <div class="nc-rank">${Array.from({ length: n.ranks }, (_, i) => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}<span class="small" style="margin-left:6px">${es('rank', 'rango')} ${r}/${n.ranks}</span></div>
    <div class="nc-desc">${T(n.desc)}</div>
    ${eff.length ? `<div class="nc-effect">${es('Next rank:', 'Siguiente rango:')} ${eff.join('<br>')}</div>` : ''}
    ${st === 'locked' ? `<div class="nc-req">${es('Locked — needs ' + pre, 'Bloqueado — requiere ' + pre)}</div>` : ''}
    <button class="nc-buy" ${st === 'can' ? '' : 'disabled'}>${st === 'maxed' ? es('Maxed out', 'Al máximo') : st === 'locked' ? T('Locked') : st === 'dim' ? es(`Need ${fmt(cost - S.party.candy)} more Candy`, `Faltan ${fmt(cost - S.party.candy)} Candy`) : es(`Buy for ${fmt(cost)} Candy`, `Comprar por ${fmt(cost)} Candy`)}</button>
    <div class="nc-fine">${es(`Every Node owned makes the next ones ${((BAL.node_inflation - 1) * 100).toFixed(1)}% pricier, and future Tabs +${BAL.tab_percent_per_node}%. Tabs already in the Mailbox don't change.`, `Cada Nodo comprado encarece los siguientes ${((BAL.node_inflation - 1) * 100).toFixed(1)}%, y las Tabs futuras +${BAL.tab_percent_per_node}%. Las Tabs que ya están en el Buzón no cambian.`)}</div>`;
  card.querySelector('.nc-close').onclick = () => { selectedNode = null; renderTree(); renderNodeCard(null); };
  card.querySelector('.nc-buy').onclick = () => tryBuy(n);
  glossNode(card);
  positionNodeCard(n);
}
function positionNodeCard(n) {
  const card = $('node-card'), wrap = card.parentElement, g = $('tree-svg').querySelector(`[data-node="${n.id}"]`);
  if (!g || window.innerWidth <= 900) { card.style.left = card.style.top = ''; return; }
  const nr = g.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
  let left = nr.right - wr.left + 10; if (left + cw > wr.width - 8) left = nr.left - wr.left - cw - 10; if (left < 8) left = 8;
  let top = nr.top + nr.height / 2 - wr.top - ch / 2; top = Math.max(8, Math.min(wr.height - ch - 8, top));
  card.style.left = left + 'px'; card.style.top = top + 'px';
}
window.addEventListener('resize', () => { if (PANEL.kind === 'tree') { VIEW.init = false; fitView(false); if (selectedNode) renderNodeCard(selectedNode); } });

// wiring
$('panel-close').onclick = closePanel;
$('panel').addEventListener('click', e => { if (e.target === $('panel')) closePanel(); });
$('btn-credits-done').onclick = () => { partysOver(); arriveTabsIfDue(); enterHub(); backerSay('Round two. Try not to owe me this time.', 5); };
$('btn-runover-done').onclick = closeRunOver;
$('btn-runover-again').onclick = () => { closeRunOver(); setPaused(false); startRun({}); };
