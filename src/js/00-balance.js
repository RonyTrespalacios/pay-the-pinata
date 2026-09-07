// ============================================================
// PARTY TAB — a playable prototype built from the GDD.
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
  mag_base: 12,                 // §2 initial Mag (per weapon, see WEAPONS)
  sweet_refund: 1, crit_refund: 2,
  spillover_rate: 0.5,          // §2 base Spillover rate
  streak_step: 0.10,            // Candy multiplier per consecutive Sweet Hit
  streak_cap: 2.0,
  // Tabs (§5)
  tab_base_candy: 500, tab_tier_growth_percent: 190, tab_percent_per_node: 5,
  tab_node_percent_cap: 100, tab_amount_step: 10,
  tabs_open_max: 2, tab_due_runs: 3, tabs_per_tier: 3,   // (tabs_open_max is the old flat cap; see D.tabsOpenMax — 1 Tab early, more with Tier)
  // Billing cycles: a Tab opens a window of tab_due_runs Runs. Pay early and the rest of the window is a Grace Period — no new Tab until it closes.
  spiker_fuse: [1.4, 2.0],   // seconds a Spiker hangs before it fizzles harmlessly and something else takes its place
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
  llama_chance: 0.015, llama_from_tier: 2,       // Lucky Llama: a rare sprinter that crosses the yard
  node_cost_mult: 1.5, node_inflation: 1.035,   // Skill Tree: every Node owned makes the next ones 8% pricier, on top of a 2× base
  wup_cost_base: 0.35, wup_cost_growth: 1.8,   // weapon upgrades: base = 35% of the weapon's price (min 250), ×1.8 per rank
  jump_v: 6.4, gravity: 20,
  // Mouse: Valorant parity. 1.0 sensitivity = 0.0705° per mouse count (UE4 yaw), so 0.2 here feels like 0.2 there. Vertical FOV 70.53° = 103° horizontal at 16:9.
  sens_deg_per_count: 0.0705, sens_default: 0.3, sens_min: 0.05, sens_max: 2.0, fov_vertical: 70.53,
  prestige_keepsakes_per_tab: 0.5, prestige_keepsakes_per_tier: 1,   // Party's Over converts the Party into extra Keepsakes
  prestige_candy_pct: 4,   // +4% Candy from everything per Party thrown before this one
  heat_per_shot: 0.28, heat_cool: 0.9, heat_soft: 0.5,   // rapid-fire heat on the Carnival Pistol: past `heat_soft` the aim wanders
  // Tier scaling (§3): Sweet Spot shrink and speed-up per Tier above 1
  tier_sweet_shrink: 0.13, tier_speed: 0.18,
};

// Candy value bands used by the Family tables
const CANDY = { low: 8, medium: 16, high: 32 };
