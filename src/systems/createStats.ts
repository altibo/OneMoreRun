import { PLAYER_BASE, WEAPON_BASE } from '../config/balance';
import { META_UPGRADES } from '../config/metaUpgrades';
import { SaveManager } from '../managers/SaveManager';
import type { PlayerStats } from '../types';

/** Erzeugt die Start-Stats eines Runs inkl. permanenter Meta-Upgrades. */
export function createInitialStats(): PlayerStats {
  const stats: PlayerStats = {
    maxHp: PLAYER_BASE.maxHp,
    hp: PLAYER_BASE.maxHp,
    hpRegenPerSec: PLAYER_BASE.hpRegenPerSec,
    armor: 0,
    lifestealPerKill: 0,

    moveSpeed: PLAYER_BASE.moveSpeed,
    pickupRange: PLAYER_BASE.pickupRange,

    damage: WEAPON_BASE.damage,
    attacksPerSec: WEAPON_BASE.attacksPerSec,
    projectileCount: WEAPON_BASE.projectileCount,
    projectileSpeed: WEAPON_BASE.projectileSpeed,
    projectileRadius: WEAPON_BASE.projectileRadius,
    pierce: WEAPON_BASE.pierce,
    critChance: WEAPON_BASE.critChance,
    critMultiplier: WEAPON_BASE.critMultiplier,
    range: WEAPON_BASE.range,

    poison: false,
    explosion: false,
    fireAura: false,
    chain: false,
    shield: false,
    poisonTrail: false,
    spikeShield: false,
    slow: false,
    berserk: false,
    freezeNova: false,

    poisonDpsMult: 1,
    explosionRadiusMult: 1,
    explosionDamageMult: 1,
    fireAuraDpsMult: 1,
    chainJumpsBonus: 0,
    chainRangeBonus: 0,
    poisonTrailDpsMult: 1,
    spikeDpsMult: 1,
    slowMult: 1,
    berserkMult: 1,
    freezeNovaChance: 0,
    freezeNovaRadiusBonus: 0,
    freezeNovaDurationBonusMs: 0,

    xpBonus: 1,
    luck: 0,
  };

  const owned = SaveManager.get().meta.upgrades;
  for (const def of META_UPGRADES) {
    const level = owned[def.id] ?? 0;
    if (level > 0) def.apply(stats, level);
  }
  stats.hp = stats.maxHp;
  return stats;
}
