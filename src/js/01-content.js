// ---------- CONTENT: Families, Weapons, Guests, Skill Tree, Charms ----------

// Piñata kinds. `sweet` = Sweet Spot radius in metres (before Tier shrink), `where` = the side it protrudes from (§3 "front is geometry").
const KINDS = {
  donkey:  { family:'A', name:'Paper Donkey',    health:1, candy:CANDY.low,    sweet:0.27, where:'front', behavior:'still',     color:0xff8c42 },
  star:    { family:'A', name:'Star',            health:1, candy:CANDY.medium, sweet:0.22, where:'center',behavior:'spin',      color:0xffd23f },
  burro:   { family:'A', name:'Cardboard Burro', health:2, candy:CANDY.medium, sweet:0.24, where:'belly', behavior:'swing',     color:0x2ec4b6 },
  bull:    { family:'A', name:'Bull',            health:3, candy:CANDY.high,   sweet:0.18, where:'head',  behavior:'swingFast', color:0xe63946 },
  nest:    { family:'B', name:'Nesting Piñata',  health:2, candy:CANDY.medium, sweet:0.28, where:'front', behavior:'swingSlow', color:0x7b5ea7, layers:1 },
  nestlet: { family:'B', name:'Nestling',        health:1, candy:CANDY.medium*1.5, sweet:0.15, where:'front', behavior:'dart', color:0xff5ea8 },
  glass:   { family:'C', name:'Sugar Glass',     health:0, candy:CANDY.medium, sweet:0.16, where:'center',behavior:'slide',     color:0xbfefff },
  skull:   { family:'D', name:'The Skull',       health:2, candy:CANDY.high,   sweet:0.17, where:'mouth', behavior:'still',     color:0xf1e9d2, clockwork:true },
  golden:  { family:'R', name:'Golden Piñata',   health:1, candy:CANDY.medium*10, sweet:0.10, where:'center', behavior:'spinFast', color:0xffc300, life:BAL.golden_life },
  repo:    { family:'R', name:'Repo Piñata',     health:2, candy:0,            sweet:0.22, where:'front', behavior:'swing',     color:0x333333 },
  toss:    { family:'A', name:'Tossed Star',     health:1, candy:CANDY.high*1.5, sweet:0.20, where:'center',behavior:'toss',    color:0xff5ea8, tossed:true },
  cactus:  { family:'A', name:'Saguaro',         health:2, candy:CANDY.medium, sweet:0.22, where:'front', behavior:'still',     color:0x4e9339 },
  sun:     { family:'A', name:'Smiling Sun',     health:1, candy:CANDY.medium, sweet:0.19, where:'center',behavior:'spinSlow',  color:0xffb000 },
  armored: { family:'A', name:'Tin Bull',        health:3, candy:CANDY.high*4, sweet:0.2, where:'head',  behavior:'swing',     color:0xc9d1d9, armored:3 },
  glitter: { family:'R', name:'Glitter Bomb',    health:1, candy:0,            sweet:0.16, where:'center',behavior:'spinSlow',  color:0xe6e6fa, decoy:true },
  comet:   { family:'R', name:'Sugar Comet',     health:1, candy:CANDY.high*5, sweet:0.15, where:'side',  behavior:'gallop',    color:0xffc300, comet:true },
  cluster: { family:'A', name:'Cluster Ball',    health:1, candy:CANDY.medium, sweet:0.2,  where:'front', behavior:'swingSlow', color:0x2ec4b6, cluster:4 },
  mini:    { family:'A', name:'Mini Star',       health:1, candy:CANDY.medium, sweet:0.13, where:'center',behavior:'hop',       color:0xffd23f },
  spiker:  { family:'R', name:'Spiker',          health:1, candy:0,            sweet:0.14, where:'center',behavior:'zip',       color:0x1a1a1a, hazard:true },
  luchador:{ family:'A', name:'El Luchador',     health:2, candy:CANDY.high,   sweet:0.2,  where:'chest', behavior:'swingFast', color:0xe63946, scale:0.9 },
  chili:   { family:'A', name:'Chile Bravo',     health:2, candy:CANDY.medium*1.5, sweet:0.18, where:'front', behavior:'swing', color:0xd62828, spicy:true, scale:1.0 },
  llama:   { family:'R', name:'Lucky Llama',     health:1, candy:CANDY.high*8, sweet:0.2, where:'side',  behavior:'gallop',    color:0xff5ea8, llama:true },
  boss:    { family:'BD', name:'Tier Boss',       health:2, candy:CANDY.high*3, sweet:0.3, where:'doors', behavior:'spinSlow', color:0xff5ea8, clockwork:true, layers:3, boss:true },
  centerpiece: { family:'BD', name:'The Centerpiece', health:3, candy:CANDY.high*6, sweet:0.30, where:'doors', behavior:'spinSlow', color:0xffd23f, clockwork:true, layers:3 },
};

const FAMILY_UNLOCK_TIER = { A:1, B:2, C:3, D:4 };   // which Families hang at which Tier

const WEAPONS = [
  // Each weapon is a different way to aim. candyMult / timeMult: what a break and a Sweet Hit are worth with it.
  { id:'pea',     name:'Peashooter',      damage:1.0, mag:8,  pellets:1, spread:0,    hitRadius:0.018, cooldown:0.42, unlockTier:1, price:0, color:0x7bd389, candyMult:1.0, timeMult:1.0, range:13, reticle:'dot',
    critText:'A Sweet Hit at under 6 m', style:'Light, accurate, short-ranged: shots fizzle past 13 m. Zero recoil. It gets you through the first Tabs.' },
  { id:'six',     name:'Six-Shooter',     damage:2.5, mag:6,  pellets:1, spread:0,    hitRadius:0.012, cooldown:0.34, unlockTier:1, price:600, color:0xc0c0c0, candyMult:1.5, timeMult:1.8, reload:2.2, reticle:'diamond',
    critText:'A Sweet Hit beyond 16 m', style:'Six precise rounds, then a slow cylinder reload. The diamond snaps shut on a Sweet Spot; each one pays +80% time.' },
  { id:'shotgun', name:'Confetti Shotgun',damage:0.9, mag:6,  pellets:12, spread:0.075, hitRadius:0.0,  cooldown:0.55, unlockTier:2, price:1500, color:0x2ec4b6, candyMult:1.25, timeMult:1.1, reticle:'circle',
    critText:'Hit 2+ piñatas in one shot', style:'Twelve pellets fill the circle. Brutal on the first two lines, weak past 14 m. Built for crowds.' },
  { id:'rifle',   name:'Big Top Rifle',   damage:4.5, mag:4,  pellets:1, spread:0,    hitRadius:0.006, cooldown:0.95, unlockTier:3, price:3500, color:0x7b5ea7, candyMult:2.0, timeMult:1.5, splash:1.6, splashPct:0.5, reticle:'sniper',
    critText:'A Sweet Hit on a moving piñata', style:'One heavy shell. Every hit also splashes 50% of its damage over 1.6 m — the neighbours pay too. Reads the range.' },
  { id:'pistol',  name:'Carnival Repeater', damage:1.8, mag:18, pellets:1, spread:0,  hitRadius:0.018, cooldown:0.26, unlockTier:4, price:7000, color:0xff5ea8, candyMult:1.6, timeMult:1.2, heat:true, auto:true, reticle:'expand',
    critText:'Quick draw: a Sweet Hit within 0.4 s of your last Sweet Hit', style:'Hold the trigger: fully automatic, and it fires faster the longer you hold — until the barrel overheats and the aim wanders.' },
  { id:'cannon',  name:'Candy Cannon',    damage:6.0, mag:3,  pellets:1, spread:0,    hitRadius:0.03,  cooldown:1.6,  unlockTier:5, price:12000, color:0xe63946, candyMult:2.5, timeMult:2.0, aoe:2.6, projectile:16, reticle:'ring',
    critText:'Break 3+ piñatas in one blast', style:'Lobs a slow jawbreaker in an arc. Where it lands, everything within 2.6 m shatters, ×2.5 Candy each.' },
];
// Weapon upgrade tracks: three per weapon, each its own identity. Bought with Candy at the weapons table; reset at Party's Over like the Tree.
const WUP_BY_WEAPON = {
  pea:     [ { id:'reload', icon:'reload', name:'Quick reload', ranks:3, desc:'−20% reload time per rank.' }, { id:'margin', icon:'target', name:'Steady hand', ranks:3, desc:'A wider hit window around the dot per rank.' }, { id:'double', icon:'candy', name:'Double drop', ranks:3, desc:'+8% chance per rank that a break pays twice.' } ],
  six:     [ { id:'reload', icon:'reload', name:'Fast cylinder', ranks:3, desc:'−20% cylinder reload per rank.' }, { id:'sweettime', icon:'clock', name:'Sweet timing', ranks:3, desc:'+0.05 s per Sweet Hit, per rank.' }, { id:'pen', icon:'arrow', name:'Armour piercing', ranks:2, desc:'Sweet Hits crack 1 extra plate on the Tin Bull per rank.' } ],
  shotgun: [ { id:'cone', icon:'target', name:'Choke', ranks:3, desc:'A 15% tighter cone per rank — more pellets land where you look.' }, { id:'pierce', icon:'arrow', name:'Front-row pierce', ranks:1, desc:'Pellets pass through the first piñata they hit and into the one behind.' }, { id:'pellets', icon:'sparkle', name:'More confetti', ranks:3, desc:'+2 pellets per rank.' } ],
  rifle:   [ { id:'radius', icon:'boom', name:'Splash radius', ranks:3, desc:'+0.6 m splash per rank.' }, { id:'splash', icon:'wave', name:'Splash damage', ranks:3, desc:'+20% of the shot\'s damage splashed, per rank.' }, { id:'shred', icon:'shield', name:'Armour shred', ranks:2, desc:'Hits crack 1 extra plate on the Tin Bull per rank.' } ],
  pistol:  [ { id:'cool', icon:'snow', name:'Heat sink', ranks:3, desc:'Barrel cools 35% faster per rank.' }, { id:'ramp', icon:'bolt', name:'Ramp-up', ranks:3, desc:'The held-trigger fire rate climbs 10% higher per rank.' }, { id:'magnet', icon:'magnet', name:'Candy pull', ranks:3, desc:'Every break pulls 1 piece of ground Candy to you per rank (+2 Candy each).' } ],
  cannon:  [ { id:'radius', icon:'boom', name:'Blast radius', ranks:3, desc:'+0.4 m blast per rank.' }, { id:'velocity', icon:'rocket', name:'Launch velocity', ranks:3, desc:'Jawbreakers fly 25% faster per rank — flatter arc, less lead.' }, { id:'cluster', icon:'boom', name:'Cluster jawbreaker', ranks:2, desc:'On impact, 2 mini-blasts per rank go off on the nearest piñatas outside the main radius.' } ],
};
const WUP = [];   // (legacy; per-weapon tracks live in WUP_BY_WEAPON)


// Guests: every Tab belongs to one. Paying it grants that Guest's Favor (§5).
const GUESTS = [
  { name:'Aunt Rosa',      favor:'mag',      favorText:'+1 Mag capacity' },
  { name:'Cousin Beto',    favor:'shotgun',  favorText:'Confetti Shotgun: +2 pellets, wider spread' },
  { name:'Tío Chuy',       favor:'candy',    favorText:'+5% Candy from every piñata' },
  { name:'Abuela Lupe',    favor:'window',   favorText:'+0.1 s Open Window on Clockwork piñatas' },
  { name:'Neighbor Dave',  favor:'golden',   favorText:'+1% Golden Piñata chance' },
  { name:'Doña Mari',      favor:'spawn',    favorText:'Piñatas hang 15% faster' },
  { name:'Primo Kike',     favor:'streakcap',favorText:'Streak cap +0.25' },
  { name:'Compadre Nacho', favor:'grace',    favorText:'+1 Grace' },
  { name:'Little Sofi',    favor:'start',    favorText:'+1 starting piñata' },
  { name:'The Twins',      favor:'nest',     favorText:'Nesting Piñatas release one extra Nestling' },
];
const BACKER_NAME = 'Tía Chelo';
// One boss per Tier: a layered piñata that comes out when a Tier is earned. Beat it for a Keepsake and a fat payout.
const BOSS_NAMES = ['La Grande', 'El Toro Mayor', 'La Reina de Azúcar', 'El Sol Negro', 'La Estrella Madre', 'La Abuela de Todas'];
const bossName = tier => BOSS_NAMES[Math.min(BOSS_NAMES.length - 1, Math.max(0, tier - 2))];

// Skill Tree (§6). cost(r) = Candy for rank r (0-based). prereq: {node:rank} or {total:n}.
const BRANCHES = [
  { id:'trigger', name:'Trigger', color:'#e0a800', desc:'Precision and ammo.', nodes:[
    { id:'mag_cap', icon:'battery', short:'Mag', name:'Mag capacity',   ranks:6, cost:r=>Math.round(150*Math.pow(1.55,r)), desc:'+1 Round to the starting Mag per rank.' },
    { id:'sweet_refund', icon:'target', short:'Sweet refund', name:'Sweet refund',   ranks:2, cost:r=>[600,2200][r], desc:'Rounds refunded per Sweet Hit: 1 → 1.5 → 2. Half Rounds bank silently.', prereq:{mag_cap:1} },
    { id:'crit_refund', icon:'boom', short:'Crit refund', name:'Crit refund',    ranks:1, cost:()=>1400, desc:'Rounds refunded per Crit: 2 → 3.', prereq:{sweet_refund:1} },
    { id:'grace', icon:'dove', short:'Grace', name:'Grace',          ranks:2, cost:r=>[450,1600][r], desc:'Consecutive Misses forgiven before the Streak resets: 0 → 1 → 2.', prereq:{free_first:1} },
    { id:'free_first', icon:'gift', short:'Free 1st', name:'Free First Round',ranks:1, cost:()=>350, desc:'The first shot of every Run costs nothing.' },
    { id:'fast_reload', icon:'reload', short:'Quick fingers', name:'Quick fingers', ranks:3, cost:r=>Math.round(900*Math.pow(1.9,r)), desc:'Reload 25% faster per rank.', prereq:{mag_cap:2} },
    { id:'hair_trigger', icon:'bolt', short:'Hair trigger', name:'Hair trigger', ranks:3, cost:r=>Math.round(1800*Math.pow(1.9,r)), desc:'Every weapon fires 10% faster per rank.', prereq:{fast_reload:1} },
    { id:'steady', icon:'snow', short:'Cool barrel', name:'Cool barrel', ranks:3, cost:r=>Math.round(2400*Math.pow(1.8,r)), desc:'The Carnival Pistol cools 35% faster per rank — hold the trigger longer before the aim wanders.', prereq:{hair_trigger:1} },
    { id:'crit_time', icon:'clock', short:'Crit clock', name:'Crit clock', ranks:2, cost:r=>[3000,7000][r], desc:'Every Crit adds +0.1 s more to the clock per rank.', prereq:{crit_refund:1} },
  ]},
  { id:'muscle', name:'Muscle', color:'#e63946', desc:'Damage. Never wasted: Spillover pays Candy.', nodes:[
    { id:'damage', icon:'dumbbell', short:'Damage', name:'Base damage',    ranks:10, cost:r=>Math.round(120*Math.pow(1.45,r)), desc:'+10% damage per rank. Collapses "3 Body Hits" back toward "1".' },
    { id:'spill', icon:'drop', short:'Spillover', name:'Spillover rate', ranks:2, cost:r=>[500,1500][r], desc:'Excess damage converted to Candy: 50% → 75% → 100%.', prereq:{damage:1} },
    { id:'punch', icon:'dumbbell', short:'Punch-Thru', name:'Punch-Through',  ranks:1, cost:()=>900, desc:'Nesting Piñatas: a Sweet Hit opens 2 Layers at once.', prereq:{damage:2} },
    { id:'chain', icon:'link', short:'Chain Pop', name:'Chain Pop',      ranks:3, cost:r=>Math.round(1500*Math.pow(1.9,r)), desc:'+20% chance per rank that a Sweet Hit also pops the nearest piñata, paying its Candy. Chains can chain.', prereq:{punch:1} },
    { id:'pierce', icon:'arrow', short:'Pierce', name:'Pierce',         ranks:1, cost:()=>2600, desc:'A Sweet Hit passes through and hits the piñata behind it.', prereq:{spill:1, damage:4} },
    { id:'shock', icon:'wave', short:'Shockwave', name:'Shockwave', ranks:3, cost:r=>Math.round(2000*Math.pow(1.9,r)), desc:'A Body Hit also deals 0.5 damage per rank to every piñata within 2 m.', prereq:{damage:3} },
    { id:'stun', icon:'spiral', short:'Stun', name:'Stun', ranks:1, cost:()=>4500, desc:'A Body Hit freezes the piñata in place for 1.5 s — line up the Sweet Spot.', prereq:{shock:1} },
    { id:'heavy', icon:'dumbbell', short:'Heavy rounds', name:'Heavy rounds', ranks:5, cost:r=>Math.round(3000*Math.pow(1.7,r)), desc:'+6% damage and +8% Candy from every break, per rank.', prereq:{spill:2} },
    { id:'boom', icon:'boom', short:'Bigger boom', name:'Bigger boom', ranks:3, cost:r=>Math.round(4000*Math.pow(1.6,r)), desc:'Candy Cannon blast radius +25% per rank.', prereq:{chain:1} },
  ]},
  { id:'sugar', name:'Sugar', color:'#ff5ea8', desc:'Luck and loot.', nodes:[
    { id:'candy_A', icon:'candy', short:'Classic', name:'Classic Candy',  ranks:8, cost:r=>Math.round(100*Math.pow(1.6,r)), desc:'+15% Base Candy from Family A (Classic piñatas) per rank.' },
    { id:'candy_B', icon:'candy', short:'Nesting', name:'Nesting Candy',  ranks:8, cost:r=>Math.round(160*Math.pow(1.6,r)), desc:'+15% Base Candy from Family B (Nesting piñatas) per rank.', prereq:{candy_A:1} },
    { id:'candy_C', icon:'candy', short:'Sugar Glass', name:'Sugar Glass Candy',ranks:8, cost:r=>Math.round(160*Math.pow(1.6,r)), desc:'+15% Base Candy from Family C (Sugar Glass) per rank.', prereq:{candy_B:1} },
    { id:'candy_D', icon:'skull', short:'Clockwork', name:'Clockwork Candy',ranks:8, cost:r=>Math.round(200*Math.pow(1.6,r)), desc:'+15% Base Candy from Family D (Clockwork) per rank.', prereq:{candy_C:1} },
    { id:'golden', icon:'star', short:'Golden luck', name:'Golden luck',    ranks:3, cost:r=>Math.round(400*Math.pow(1.8,r)), desc:'+1% Golden Piñata spawn chance per rank.', prereq:{start_pinatas:1} },
    { id:'start_pinatas', icon:'star', short:'Starters', name:'Starting Piñatas',ranks:3, cost:r=>Math.round(250*Math.pow(1.7,r)), desc:'+1 piñata hanging when a Run begins.', prereq:{candy_A:1} },
    { id:'rush', icon:'wave', short:'Sugar Rush', name:'Sugar Rush',    ranks:1, cost:()=>4500, desc:'Once per Run, at a Streak of 10 the clock freezes for 3 s and every piñata pays double.', prereq:{golden:1} },
    { id:'rush_long', icon:'play', short:'Longer Rush', name:'Longer Rush', ranks:3, cost:r=>Math.round(5000*Math.pow(1.6,r)), desc:'Sugar Rush lasts +2 s per rank.', prereq:{rush:1} },
    { id:'llama_luck', icon:'clover', short:'Llama luck', name:'Llama luck', ranks:3, cost:r=>Math.round(2500*Math.pow(1.9,r)), desc:'+1.5% chance per rank that a Lucky Llama sprints across the yard. Break it: ×8 Candy and a Keepsake.', prereq:{golden:1} },
    { id:'sweet_tooth', icon:'candy', short:'Sweet tooth', name:'Sweet tooth', ranks:5, cost:r=>Math.round(1200*Math.pow(1.8,r)), desc:'+0.05 s on the clock per Sweet Hit, per rank.', prereq:{candy_B:1} },
    { id:'jackpot', icon:'dice', short:'Jackpot', name:'Jackpot', ranks:3, cost:r=>Math.round(5000*Math.pow(1.9,r)), desc:'+4% chance per rank that a break pays ×5.', prereq:{candy_C:2} },
    { id:'yield', icon:'chart', short:'Sweet economy', name:'Sweet economy', ranks:10, cost:r=>Math.round(400*Math.pow(1.55,r)), desc:'+10% Candy from everything, per rank. The number that keeps up with the prices.', prereq:{candy_A:2} },
  ]},
  { id:'tempo', name:'Tempo', color:'#1fa89b', desc:'Pace and timing.', nodes:[
    { id:'run_time', icon:'hourglass', short:'Longer Party', name:'Longer Party',  ranks:4, cost:r=>Math.round(300*Math.pow(1.7,r)), desc:'+5 s on the Run clock per rank.' },
    { id:'open_window', icon:'clock', short:'Open Window', name:'Open Window',    ranks:2, cost:r=>[700,2000][r], desc:'Clockwork Open Window +0.3 s per rank: 0.5 → 0.8 → 1.1 s.', prereq:{spawn_rate:1} },
    { id:'spawn_rate', icon:'reload', short:'Spawn rate', name:'Spawn rate',     ranks:4, cost:r=>Math.round(200*Math.pow(1.6,r)), desc:'New piñatas hang 15% faster per rank.' },
    { id:'streak_step', icon:'flame', short:'Streak', name:'Streak step',    ranks:5, cost:r=>Math.round(300*Math.pow(1.8,r)), desc:'Candy multiplier per consecutive Sweet Hit: +0.05 per rank (base +0.10).', prereq:{run_time:1} },
    { id:'streak_cap', icon:'trophy', short:'Streak cap', name:'Streak cap',     ranks:5, cost:r=>Math.round(500*Math.pow(1.8,r)), desc:'Streak multiplier cap +0.5 per rank (base ×2.0).', prereq:{streak_step:1} },
    { id:'overtime', icon:'clock', short:'Overtime', name:'Overtime', ranks:3, cost:r=>Math.round(2200*Math.pow(1.9,r)), desc:'The cap on time earned per Run rises +10% of the clock per rank.', prereq:{run_time:2} },
    { id:'max_pinatas', icon:'home', short:'Fuller yard', name:'Fuller yard', ranks:3, cost:r=>Math.round(1500*Math.pow(1.9,r)), desc:'+1 piñata can hang at once per rank.', prereq:{spawn_rate:2} },
    { id:'launcher', icon:'rocket', short:'Launcher', name:'Eager launcher', ranks:3, cost:r=>Math.round(3500*Math.pow(1.8,r)), desc:'The launcher fires 30% more often per rank, and throws one more piñata.', prereq:{max_pinatas:1} },
    { id:'hot_start', icon:'flame', short:'Hot start', name:'Hot start', ranks:3, cost:r=>Math.round(4000*Math.pow(1.9,r)), desc:'Every Run begins with a Streak of 2 per rank.', prereq:{streak_cap:2} },
  ]},
  { id:'guests', name:'Piñatas', color:'#ff8c42', desc:'Who hangs at the party. Every Node invites a new piñata; extra ranks make it pay more.', nodes:[
    { id:'p_donkey', kind:'donkey', icon:'star', short:'Paper Donkey', name:'Paper Donkey', ranks:3, cost:r=>[60,400,1500][r], desc:'Invites the Paper Donkey: still, big Sweet Spot, cheap Candy. Ranks 2–3: +25% Candy from it each.' },
    { id:'p_burro', kind:'burro', icon:'candy', short:'Burro', name:'Cardboard Burro', ranks:3, cost:r=>[220,900,3000][r], desc:'Invites the Cardboard Burro: swings, 2 Body Hits. Ranks 2–3: +25% Candy from it each.', prereq:{p_donkey:1} },
    { id:'p_sun', kind:'sun', icon:'star', short:'Sun', name:'Smiling Sun', ranks:3, cost:r=>[500,1600,4500][r], desc:'Invites the Smiling Sun: a slow turner with a Sweet Spot on both faces. Ranks 2–3: +25% Candy each.', prereq:{p_donkey:1} },
    { id:'p_bull', kind:'bull', icon:'star', short:'Bull', name:'Bull', ranks:3, cost:r=>[900,2600,7000][r], desc:'Invites the Bull: fast swings, small Sweet Spot, high Candy. Ranks 2–3: +25% Candy each.', prereq:{p_burro:1} },
    { id:'p_cactus', kind:'cactus', icon:'star', short:'Saguaro', name:'Saguaro', ranks:3, cost:r=>[1200,3200,8000][r], desc:'Invites the Saguaro: 2 Body Hits, hops from Tier 3. Ranks 2–3: +25% Candy each.', prereq:{p_sun:1} },
    { id:'p_chili', kind:'chili', icon:'star', short:'Chile', name:'Chile Bravo', ranks:3, cost:r=>[1500,3800,9000][r], desc:'Invites the Chile Bravo: every Body Hit makes it swing faster and pay more. Ranks 2–3: +25% Candy each.', prereq:{p_sun:1} },
    { id:'p_luchador', kind:'luchador', icon:'star', short:'Luchador', name:'El Luchador', ranks:3, cost:r=>[2200,5500,13000][r], desc:'Invites El Luchador: a masked wrestler who swings hard and drops from the rope when kicked. Ranks 2–3: +25% Candy each.', prereq:{p_bull:1} },
    { id:'p_cluster', kind:'cluster', icon:'star', short:'Cluster', name:'Cluster Ball', ranks:3, cost:r=>[1800,4500,11000][r], desc:'Invites the Cluster Ball: breaks into four hopping Mini Stars. Ranks 2–3: +25% Candy from it and the Minis.', prereq:{p_bull:1} },
    { id:'p_nest', kind:'nest', icon:'candy', short:'Nesting', name:'Nesting Piñata', ranks:3, cost:r=>[2500,6000,14000][r], desc:'Invites Family B: the Nesting Piñata and its darting Nestlings. Ranks 2–3: +25% Candy each.', prereq:{p_bull:1, tier:2} },
    { id:'p_armored', kind:'armored', icon:'shield', short:'Tin Bull', name:'Tin Bull', ranks:3, cost:r=>[4000,9000,20000][r], desc:'Invites the Tin Bull: three Sweet Hits to crack, ×4 Candy. Ranks 2–3: +25% each.', prereq:{p_cluster:1, tier:3} },
    { id:'p_glass', kind:'glass', icon:'candy', short:'Sugar Glass', name:'Sugar Glass', ranks:3, cost:r=>[5000,11000,24000][r], desc:'Invites Family C: Sugar Glass pays by zone (rim ×1, middle ×2, centre ×5). Ranks 2–3: +25% each.', prereq:{p_nest:1, tier:3} },
    { id:'p_comet', kind:'comet', icon:'star', short:'Comet', name:'Sugar Comet', ranks:3, cost:r=>[6000,13000,28000][r], desc:'Sugar Comets start streaking along the lines: ×5 Candy and +3 s if you catch one. Ranks 2–3: they come 50% more often.', prereq:{p_glass:1} },
    { id:'p_skull', kind:'skull', icon:'skull', short:'Skull', name:'The Skull', ranks:3, cost:r=>[8000,17000,36000][r], desc:'Invites Family D: the Clockwork Skull — its jaw opens on a cycle; only then is the Sweet Spot live. Ranks 2–3: +25% each.', prereq:{p_glass:1, tier:4} },
    { id:'p_llama', kind:'llama', icon:'clover', short:'Llama', name:'Lucky Llama', ranks:3, cost:r=>[10000,22000,45000][r], desc:'Lucky Llamas start sprinting across the yard: ×8 Candy and a Keepsake each. Ranks 2–3: they come 50% more often.', prereq:{p_armored:1, p_comet:1} },
  ]},
  { id:'wild', name:'Wild', color:'#7b5ea7', desc:'Actives. The weird stuff deep in the tree.', nodes:[
    { id:'double', icon:'coin', short:'Double/Nothing', name:'Double or Nothing',ranks:1, cost:()=>2000, desc:'After banking, bet a Run\'s Candy on a plain coin flip. Doubles or zeroes it.', prereq:{total:6} },
    { id:'confetti', icon:'sparkle', short:'Confetti Burst', name:'Confetti Burst', ranks:1, cost:()=>3000, desc:'Active (Q): for 3 s every Sweet Spot on screen is enlarged. 20 s cooldown.', prereq:{total:8} },
    { id:'sugar_hands', icon:'candy', short:'Sugar Hands', name:'Sugar Hands',    ranks:1, cost:()=>4000, desc:'After a 5-hit Streak, Crits refund 3 Rounds for 10 s.', prereq:{crit_refund:1, total:10} },
    { id:'vacuum', icon:'magnet', short:'Candy Vacuum', name:'Candy Vacuum',  ranks:1, cost:()=>4000, desc:'From a Streak of 6, Candy lying on the grass rolls to your feet — +2 Candy a piece, and it keeps rolling while the Streak holds.', prereq:{total:12} },
    { id:'magnet', icon:'magnet', short:'Strong magnet', name:'Strong magnet', ranks:2, cost:r=>[5000,10000][r], desc:'The Vacuum starts 2 Streak earlier and pays +1 Candy a piece, per rank.', prereq:{vacuum:1} },
    { id:'loaded', icon:'dice', short:'Loaded coin', name:'Loaded coin', ranks:1, cost:()=>4000, desc:'Double or Nothing lands heads 60% of the time.', prereq:{double:1} },
    { id:'encore', icon:'music', short:'Encore', name:'Encore', ranks:1, cost:()=>7000, desc:'When the clock hits zero with a Streak of 8+, the party goes on for 5 more seconds. Once per Run.', prereq:{vacuum:1, total:18} },
    { id:'heirloom', icon:'trophy', short:'Heirloom', name:'Piñata heirloom', ranks:1, cost:()=>9000, desc:'Golden Piñatas and Lucky Llamas pay +1 Keepsake when broken.', prereq:{sugar_hands:1, total:22} },
  ]},
];
const NODE_BY_ID = {}, KIND_NODE = {}; BRANCHES.forEach(b=>b.nodes.forEach(n=>{ n.branch=b.id; NODE_BY_ID[n.id]=n; if (n.kind) KIND_NODE[n.kind]=n; }));

// Charms (§7): permanent, bought with Keepsakes, survive every Party's Over.
const CHARMS = [
  // Permanent (§7). Bought with Keepsakes; cost climbs with each rank. Party's Over also mints Keepsakes from the Party you just threw.
  { id:'ring',     icon:'ring', name:'Candy Ring',        cost:2, step:1, max:5,  desc:'+2 base Mag capacity per rank, permanent.' },
  { id:'bracelet', icon:'link', name:'Gummy Bracelet',    cost:2, step:1, max:8,  desc:'+5% base damage per rank, permanent.' },
  { id:'watch',    icon:'clock', name:'Chocolate Watch',   cost:3, step:2, max:4,  desc:'+3 s on every Run clock per rank, permanent.' },
  { id:'sugar',    icon:'drop', name:'Sugar Jar',         cost:3, step:2, max:10, desc:'+8% Candy from everything per rank, permanent. Stacks with the Party bonus.' },
  { id:'wrapper',  icon:'ticket', name:'Golden Wrapper',    cost:4, step:2, max:5,  desc:'Every Tab is 6% cheaper per rank.' },
  { id:'headstart',icon:'gift', name:'Birthday Money',    cost:3, step:2, max:5,  desc:'Start every Party with 400 Candy per rank already in the jar.' },
  { id:'coupon',   icon:'tag', name:'Weapon Coupon',     cost:4, step:3, max:3,  desc:'Weapons cost 15% less per rank, every Party.' },
  { id:'necklace', icon:'ring', name:'Licorice Necklace', cost:5, step:3, max:3,  desc:'Start every Party with Mag capacity rank 1 (2: Damage rank 1 too, 3: Paper Donkey rank 1 too).' },
  { id:'oldfriend',icon:'gun', name:'Old Friend',        cost:8, step:0, max:1,  desc:'The Six-Shooter comes back on its own at the start of every Party.' },
  { id:'crown',    icon:'crown', name:'Sugar Crown',       cost:8, step:0, max:1,  desc:'The first Tab of every Party arrives already paid.' },
  { id:'guestbook',icon:'book', name:'Guest Book',        cost:6, step:4, max:3,  desc:'Every Party starts with one more piñata already invited: Burro, then Sun, then Bull.' },
  { id:'lucky',    icon:'clover', name:'Lucky Charm',       cost:6, step:3, max:3,  desc:'+1% Golden Piñata and +1% Lucky Llama chance per rank.' },
];

// What Tía Chelo tells you if you keep coming back to talk. One line per visit; the story is hers, and it is not short.
const LORE = [
  'You want to know about the money? Fine. Every guest at this party paid something toward it. I paid the rest. That is what the Tabs are: my rest, split into pieces you can carry.',
  'Aunt Rosa brought the cake. Cousin Beto brought the sound system he "borrowed". Neighbor Dave brought himself. Everyone brought a little debt with them.',
  'The piñatas? Those are mine. I have been making them since before your mother was born. Paper, paste, patience. You break them, the Candy falls, the Candy pays me. A clean arrangement.',
  'You noticed the Sweet Spot glows. Of course it does. I paint it that way. I want you to hit it. A Host who hits the Sweet Spot pays on time.',
  'The Cut is not a punishment, mijo. It is interest. Ten percent, twenty-five, half. It stops at half because after half people stop trying, and then nobody gets paid.',
  'The black piñata with the red tag — the Repo — is Candy I already took, wrapped nice. Some people call that cruel. I call it a second chance with a bow on it.',
  'Before this house there was another house, another party, another Host. He paid every Tab but the last one. I still have his porch light. It is that one, there.',
  'Party\'s Over is not a defeat. It is the porch light going off. The guests forget, the Tree forgets, the Tabs forget. I keep the Keepsakes. That is fair.',
  'The Golden Piñata is real gold leaf, by the way. I only hang one when I am feeling generous, or when I want to see if you are paying attention.',
  'The Lucky Llama belonged to a girl who never came to a party in her life. She made it and left it on my step. It runs because it is looking for her.',
  'The Centerpiece? Fifteen Tabs, then it comes out from behind the roof. Bigger than the house. Five layers. Break it and we are square. Nobody has broken it. Yet.',
  'You ask why I sit here with lemonade instead of inside with the others. Somebody has to watch the money, mijo. It has always been me.',
  'When a Tab goes late the lights go a little dim. You have seen it. That is not me doing it. That is the party remembering it is owed something.',
  'That is all the story there is. Well. There is one more piñata I never hang. Pay everything and maybe I will tell you about it.',
];
const BACKER_NOTES = {
  first:   `Hola, mijo. Great party. Truly. Now, about the money — I put the Tabs in here so nobody has to be awkward about it. Pay them before they come due and we're golden. — ${BACKER_NAME}`,
  fine:    `All good so far. Keep breaking piñatas, keep paying. I'm not counting. (I am counting.) — ${BACKER_NAME}`,
  overdue1:`One Tab is late. I took a little something off the ground while you weren't looking. Ten percent. Call it a handling fee. — ${BACKER_NAME}`,
  overdue2:`Two late Tabs. I'm now taking a quarter of everything that hits the grass. Pay someone, anyone. — ${BACKER_NAME}`,
  overdue3:`Three late Tabs, and I'm taking half. It doesn't go higher than half — I'm not a monster — but it doesn't need to. — ${BACKER_NAME}`,
  repo:    `You may notice a black piñata with a red tag. That's the Candy I already took, wrapped up nice. Break it and you can have some back. I'm sentimental like that. — ${BACKER_NAME}`,
  partyover:`So that's it? Party's Over? Fine. Keep your Keepsakes and your guns. The Guests will forget. I won't, but I'll pretend. Throw a bigger one next time. — ${BACKER_NAME}`,
  centerpiece:`This is the last one. Behind the roof there's a piñata bigger than the house. Break it and we're square. — ${BACKER_NAME}`,
  cleanup: `No Tabs left… except someone has to pay for the cleanup. Use what fell out of that thing. — ${BACKER_NAME}`,
};
