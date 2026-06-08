import type { PlayerStats } from '../types';

export interface MetaUpgradeDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  /** Wendet den permanenten Bonus pro Level auf die Start-Stats an. */
  apply: (s: PlayerStats, level: number) => void;
}

export function metaCost(def: MetaUpgradeDef, currentLevel: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

/** Permanenter Meta-Shop. Jeder Run zahlt sich aus (keine verlorene Zeit). */
export const META_UPGRADES: readonly MetaUpgradeDef[] = [
  {
    id: 'start_hp',
    name: 'Start HP',
    desc: '+15 Max HP pro Level',
    maxLevel: 10,
    baseCost: 30,
    costGrowth: 1.5,
    apply: (s, lvl) => {
      s.maxHp += 15 * lvl;
      s.hp = s.maxHp;
    },
  },
  {
    id: 'move_speed',
    name: 'Movement Speed',
    desc: '+4% Speed pro Level',
    maxLevel: 8,
    baseCost: 40,
    costGrowth: 1.5,
    apply: (s, lvl) => (s.moveSpeed *= 1 + 0.04 * lvl),
  },
  {
    id: 'xp_bonus',
    name: 'XP Bonus',
    desc: '+5% XP pro Level',
    maxLevel: 8,
    baseCost: 45,
    costGrowth: 1.5,
    apply: (s, lvl) => (s.xpBonus *= 1 + 0.05 * lvl),
  },
  {
    id: 'proj_size',
    name: 'Projectile Size',
    desc: '+6% Größe pro Level',
    maxLevel: 6,
    baseCost: 50,
    costGrowth: 1.55,
    apply: (s, lvl) => (s.projectileRadius *= 1 + 0.06 * lvl),
  },
  {
    id: 'crit_chance',
    name: 'Critical Chance',
    desc: '+2% Crit pro Level',
    maxLevel: 8,
    baseCost: 55,
    costGrowth: 1.55,
    apply: (s, lvl) => (s.critChance += 0.02 * lvl),
  },
  {
    id: 'luck',
    name: 'Luck',
    desc: '+1 Luck pro Level',
    maxLevel: 5,
    baseCost: 70,
    costGrowth: 1.7,
    apply: (s, lvl) => (s.luck += lvl),
  },
];
