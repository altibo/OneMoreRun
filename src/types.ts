/**
 * Laufzeit-Stats des Spielers innerhalb eines Runs. Werden von Upgrades und
 * Synergien modifiziert. Bewusst flach gehalten für einfache Anwendung.
 */
export interface PlayerStats {
  // Survival
  maxHp: number;
  hp: number;
  hpRegenPerSec: number;
  armor: number; // 0..0.9 Schadensreduktion
  lifestealPerKill: number;

  // Movement
  moveSpeed: number;
  pickupRange: number;

  // Weapon
  damage: number;
  attacksPerSec: number;
  projectileCount: number;
  projectileSpeed: number;
  projectileRadius: number;
  pierce: number;
  critChance: number;
  critMultiplier: number;
  range: number;

  // Effekt-Flags (werden über Tags/Synergien gesetzt)
  poison: boolean;
  explosion: boolean;
  fireAura: boolean;
  chain: boolean;
  shield: boolean;
  poisonTrail: boolean;
  spikeShield: boolean;

  // Synergie-Verstärkungen
  poisonDpsMult: number;
  explosionRadiusMult: number;
  explosionDamageMult: number;
  fireAuraDpsMult: number;
  chainJumpsBonus: number;
  poisonTrailDpsMult: number;
  spikeDpsMult: number;

  // Meta
  xpBonus: number; // Multiplikator, 1 = normal
  luck: number; // beeinflusst Rarität der Upgrade-Auswahl
}

/** Zusammenfassung eines beendeten Runs für End Screen & Meta-Progression. */
export interface RunResult {
  timeMs: number;
  kills: number;
  coins: number;
  level: number;
  build: string[];
  bossDefeated: boolean;
  newUnlocks: string[];
  newAchievements: string[];
}
