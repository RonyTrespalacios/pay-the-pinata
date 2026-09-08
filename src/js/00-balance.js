// ============================================================
// PAY THE PIÑATA — a playable prototype built from the GDD.
// Vocabulary follows the Glossary (§13): Run, Mag, Round, Sweet Hit,
// Crit, Body Hit, Miss, Streak, Grace, Spillover, Tab, The Cut,
// Favor, Keepsake, Charm, Party's Over, Tier, Family, Layer…
// ============================================================
'use strict';

// ---------- BALANCE (everything tunable lives here, cf. domain/balance.gd) ----------
const BAL = {
  // The Run is on the clock now: a hard cap with small, diminishing extensions for precision.
  run_time: 45,                 // seconds per Run before Nodes/Charms
  time_sweet: 0.12, time_crit: 0.25, time_decay: 0.985, time_bonus_cap: 0.35,   // +s per Sweet Hit / Crit (a tenth of a second — visible on the bar, never infinite), decay per bonus, max total bonus as a share of run_time
  time_penalty: 2.0,   // seconds lost for popping a Spiker
  reload_time: 1.4,             // seconds to refill an empty Mag (Sweet Hits refund Rounds and skip the reload)
  // ---- Recarga activa (Gears of War, pero pegada a la mira) ----
  // La aguja recorre la barra durante TODA la recarga, asi que las ventanas van en fraccion
  // del recorrido y no en segundos: el sitio de la pantalla donde hay que darle a R es el
  // mismo con cualquier arma y con cualquier rango de Recarga rapida. Eso es lo que se puede
  // aprender; un instante en segundos, no.
  //
  // `perfect` empieza donde empieza `good` — el premio gordo esta al ENTRAR en la ventana,
  // que es lo que obliga a estar atento en vez de esperar al final.
  active_reload: {
    good: [0.56, 0.82], perfect: [0.56, 0.645],
    min_dur: 0.35,   // por debajo de esto la recarga ya es casi instantanea: no hay minijuego que jugar
    time: 0.35,      // segundos de reloj que paga una perfecta
    jam: 0.45,       // fallar atasca el arma: +45% de recarga sobre la que quedaba
    wide: 1.8,       // multiplicador de las dos ventanas en el ajuste "Amplia"
    teach: 3,        // recargas acertadas tras las cuales se deja de enseñar la tecla
  },
  mag_base: 12,                 // §2 initial Mag (per weapon, see WEAPONS)
  // Devolver Rounds es una TIRADA, no un regalo. Al principio hay que recargar mucho aunque se
  // acierte el Sweet Spot; el arbol sube la probabilidad hasta el 100%, y ahi ya casi no se recarga.
  // Esa curva es la que le da sentido al minijuego de recarga activa en las primeras Rondas.
  refund_base: 0.35, refund_per_rank: 0.13, refund_crit_bonus: 0.35,
  sweet_refund: 1, crit_refund: 2,
  spillover_rate: 0.5,          // §2 base Spillover rate
  streak_step: 0.10,            // Candy multiplier per consecutive Sweet Hit
  streak_cap: 2.0,
  // Tabs (§5)
  tab_base_candy: 500, tab_tier_growth_percent: 190, tab_percent_per_node: 5,
  tab_node_percent_cap: 100, tab_amount_step: 10,
  tabs_open_max: 2, tab_due_runs: 3, tabs_per_tier: 3,   // (tabs_open_max is the old flat cap; see D.tabsOpenMax — 1 Tab early, more with Tier)
  // Billing cycles: a Tab opens a window of tab_due_runs Runs. Pay early and the rest of the window is a Grace Period — no new Tab until it closes.
  // Las piñatas MALAS (el Spiker, que quita reloj, y la Bomba de Brillantina, que ciega) son
  // pruebas de reflejos, no obstaculos permanentes: cuelgan esto y se apagan solas, y el sitio
  // que dejan lo ocupa enseguida una piñata buena. Si se quedaran, un patio lleno acabaria siendo
  // un patio lleno de cosas a las que NO hay que disparar, que es lo contrario de un shooter.
  bad_fuse: [1.0, 1.8],   // segundos que cuelga una piñata mala antes de apagarse sola
  keepsake_per_tab: 1, keepsake_per_tier: 1,
  cut_steps: [0, 10, 25, 50],   // The Cut per Overdue Tab count (ceiling at 3)
  repo_debt_threshold: 1,       // Overdue Tabs needed before the Repo Piñata may spawn
  repo_chance: 0.03,
  golden_chance: 0.02, golden_life: 4.0,
  // Backyard pacing
  start_pinatas: 3, max_pinatas: 9, spawn_interval: 3.0,
  // Clockwork (§3)
  open_window: 0.5, open_cycle: 3.0,
  // Ending (§7)
  centerpiece_tabs: 15,          // Tabs paid this Party that summon The Centerpiece
  launcher_from_tier: 2, launcher_gap: [5, 9],   // the launcher fires at random during Runs from this Tier; seconds between attempts
  // Cada tiro del lanzador sale con fuerza y alza distintas. Con speed 11 y alza 50 el arco sube
  // ~3,6 m sobre la boca (o sea por encima de las tres lineas de piñatas) y recorre unos 12 m,
  // que es cruzar el patio entero. `toward` es la deriva en z hacia la linea de tiro.
  toss: { speed: [9.5, 14], angle: [42, 62], toward: [0.8, 3.2] },
  llama_chance: 0.015, llama_from_tier: 2,       // Lucky Llama: a rare sprinter that crosses the yard
  node_cost_mult: 1.5, node_inflation: 1.035,   // Skill Tree: every Node owned makes the next ones 8% pricier, on top of a 2× base
  wup_cost_base: 0.35, wup_cost_growth: 1.8,   // weapon upgrades: base = 35% of the weapon's price (min 250), ×1.8 per rank
  jump_v: 6.4, gravity: 20,
  // Mouse: Valorant parity. 1.0 sensitivity = 0.0705° per mouse count (UE4 yaw), so 0.2 here feels like 0.2 there. Vertical FOV 70.53° = 103° horizontal at 16:9.
  sens_deg_per_count: 0.0705, sens_default: 0.3, sens_min: 0.05, sens_max: 2.0, fov_vertical: 70.53,
  fov_h_default: 103, fov_h_min: 80, fov_h_max: 120,   // el ajuste se pide en FOV horizontal a 16:9, que es como lo pide todo shooter
  // Aim assist: se suma al hitRadius del arma (radio en pantalla del anillo de rayos extra que perdona un fallo por poco).
  // Los radios de las armas van de 0.006 (Rifle) a 0.03 (Canon), asi que +0.010 nota y +0.024 perdona de verdad.
  assist_radius: [0, 0.010, 0.024],
  prestige_keepsakes_per_tab: 0.5, prestige_keepsakes_per_tier: 1,   // Party's Over converts the Party into extra Keepsakes
  prestige_candy_pct: 4,   // +4% Candy from everything per Party thrown before this one
  heat_per_shot: 0.28, heat_cool: 0.9, heat_soft: 0.5,   // rapid-fire heat on the Carnival Pistol: past `heat_soft` the aim wanders
  // Tier scaling (§3): Sweet Spot shrink and speed-up per Tier above 1
  tier_sweet_shrink: 0.13, tier_speed: 0.18,
};

// Candy value bands used by the Family tables
const CANDY = { low: 8, medium: 16, high: 32 };
