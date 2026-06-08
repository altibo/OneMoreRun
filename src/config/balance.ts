/**
 * Globale Balancing-Werte. Keine Magic Numbers im Code — alles hier zentral.
 * Werte sind bewusst großzügig, damit sich der Build schnell stark anfühlt
 * (Ultimate Design Rule: motiviere "PLAY AGAIN").
 */

export const VIEW = {
  width: 960,
  height: 540,
} as const;

export const WORLD = {
  width: 2400,
  height: 2400,
} as const;

export const COLORS = {
  background: 0x0e0e12,
  grid: 0x1b1b26,
  player: 0x46e8a0,
  playerTrail: 0x2bbd80,
  enemy: 0xff5d6c,
  enemyFast: 0xffa24b,
  enemyTank: 0x9b6bff,
  boss: 0xff3b7b,
  projectile: 0xffe066,
  xp: 0x4bd0ff,
  coin: 0xffd166,
  shield: 0x6ad0ff,
  fire: 0xff7b3b,
  poison: 0x7bff6a,
  spike: 0xcfd8e3,
  text: 0xffffff,
} as const;

export const PLAYER_BASE = {
  maxHp: 100,
  hpRegenPerSec: 0,
  moveSpeed: 230,
  radius: 14,
  invulnMsOnHit: 600,
  pickupRange: 90,
  magnetSpeed: 420,
} as const;

export const WEAPON_BASE = {
  damage: 12,
  attacksPerSec: 2,
  projectileCount: 1,
  projectileSpeed: 460,
  projectileRadius: 6,
  projectileLifetimeMs: 1400,
  pierce: 0,
  spreadDeg: 14,
  critChance: 0.05,
  critMultiplier: 2,
  range: 520,
} as const;

export const LEVELING = {
  baseXpToLevel: 5,
  xpGrowth: 1.28,
  xpPerGem: 1,
} as const;

export const SPAWN = {
  startIntervalMs: 1100,
  minIntervalMs: 240,
  intervalDecayPerSec: 6,
  maxEnemies: 220,
  spawnMarginPx: 60,
  difficultyRampSec: 18, // alle X Sek steigt die HP-Skalierung
} as const;

export const BOSS = {
  spawnAtSec: 150,
  warningSec: 5,
} as const;

export const EFFECTS = {
  poisonDps: 8,
  poisonDurationMs: 2500,
  explosionRadius: 70,
  explosionDamageFactor: 0.6,
  fireAuraRadius: 95,
  fireAuraDps: 14,
  fireAuraTickMs: 250,
  chainJumps: 2,
  chainRange: 240,
  chainDamageFactor: 0.6,
  lifestealPerKill: 2,
  shieldCooldownMs: 9000,
  armorReductionPerStack: 0.06,
  // Gift-Spur, die der Spieler hinter sich herzieht.
  poisonTrailDropMs: 220,
  poisonTrailRadius: 34,
  poisonTrailDps: 18,
  poisonTrailDurationMs: 1400,
  poisonTrailTickMs: 200,
  // Rotierender Stachelschild um den Spieler.
  spikeRadius: 74,
  spikeDps: 30,
  spikeTickMs: 350,
  spikeCount: 8,
  spikeRotateSpeed: 2.2, // rad/s
} as const;

export const RUN = {
  coinPerKill: 1,
  coinPerBoss: 50,
  targetSessionSec: 300,
} as const;
