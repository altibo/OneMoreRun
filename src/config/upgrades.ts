import { EFFECTS } from './balance';
import type { PlayerStats } from '../types';

export type Rarity = 'common' | 'rare' | 'epic';

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  rarity: Rarity;
  /** Wie oft das Upgrade maximal genommen werden kann. */
  maxStacks: number;
  /** Tags steuern das Synergie-System. */
  tags: string[];
  /** Wendet den Effekt auf die Laufzeit-Stats an. */
  apply: (s: PlayerStats) => void;
}

/** Basis-Pool mit 20 Upgrades für v0.1 (datengetrieben). */
export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'damage',
    name: 'Sharpened Edge',
    desc: '+20% Damage',
    rarity: 'common',
    maxStacks: 8,
    tags: ['offense'],
    apply: (s) => (s.damage *= 1.2),
  },
  {
    id: 'attack_speed',
    name: 'Rapid Fire',
    desc: '+18% Attack Speed',
    rarity: 'common',
    maxStacks: 8,
    tags: ['offense'],
    apply: (s) => (s.attacksPerSec *= 1.18),
  },
  {
    id: 'multishot',
    name: 'Split Shot',
    desc: '+1 Projectile',
    rarity: 'rare',
    maxStacks: 5,
    tags: ['offense'],
    apply: (s) => (s.projectileCount += 1),
  },
  {
    id: 'proj_speed',
    name: 'Velocity',
    desc: '+25% Projectile Speed',
    rarity: 'common',
    maxStacks: 5,
    tags: ['offense'],
    apply: (s) => (s.projectileSpeed *= 1.25),
  },
  {
    id: 'proj_size',
    name: 'Heavy Rounds',
    desc: '+30% Projectile Size',
    rarity: 'common',
    maxStacks: 5,
    tags: ['offense'],
    apply: (s) => (s.projectileRadius *= 1.3),
  },
  {
    id: 'pierce',
    name: 'Piercing Bolt',
    desc: 'Projectiles pierce +1 enemy',
    rarity: 'rare',
    maxStacks: 4,
    tags: ['offense', 'laser'],
    apply: (s) => (s.pierce += 1),
  },
  {
    id: 'crit_chance',
    name: 'Keen Eye',
    desc: '+8% Critical Chance',
    rarity: 'rare',
    maxStacks: 6,
    tags: ['crit'],
    apply: (s) => (s.critChance += 0.08),
  },
  {
    id: 'crit_dmg',
    name: 'Deadly Strike',
    desc: '+50% Critical Damage',
    rarity: 'rare',
    maxStacks: 5,
    tags: ['crit'],
    apply: (s) => (s.critMultiplier += 0.5),
  },
  {
    id: 'max_hp',
    name: 'Vitality',
    desc: '+25 Max HP & heal',
    rarity: 'common',
    maxStacks: 8,
    tags: ['defense'],
    apply: (s) => {
      s.maxHp += 25;
      s.hp = Math.min(s.maxHp, s.hp + 25);
    },
  },
  {
    id: 'regen',
    name: 'Regeneration',
    desc: '+1.5 HP / sec',
    rarity: 'rare',
    maxStacks: 5,
    tags: ['defense'],
    apply: (s) => (s.hpRegenPerSec += 1.5),
  },
  {
    id: 'armor',
    name: 'Plating',
    desc: '+6% Damage Reduction',
    rarity: 'rare',
    maxStacks: 6,
    tags: ['defense'],
    apply: (s) => (s.armor = Math.min(0.8, s.armor + 0.06)),
  },
  {
    id: 'move_speed',
    name: 'Swift Boots',
    desc: '+12% Movement Speed',
    rarity: 'common',
    maxStacks: 5,
    tags: ['utility'],
    apply: (s) => (s.moveSpeed *= 1.12),
  },
  {
    id: 'magnet',
    name: 'Magnet',
    desc: '+40% Pickup Range',
    rarity: 'common',
    maxStacks: 4,
    tags: ['utility'],
    apply: (s) => (s.pickupRange *= 1.4),
  },
  {
    id: 'xp_boost',
    name: 'Fast Learner',
    desc: '+20% XP Gain',
    rarity: 'common',
    maxStacks: 5,
    tags: ['utility'],
    apply: (s) => (s.xpBonus *= 1.2),
  },
  {
    id: 'luck',
    name: 'Lucky Charm',
    desc: '+1 Luck (better upgrades)',
    rarity: 'rare',
    maxStacks: 4,
    tags: ['utility'],
    apply: (s) => (s.luck += 1),
  },
  {
    id: 'lifesteal',
    name: 'Vampirism',
    desc: 'Heal +2 HP per kill',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['defense'],
    apply: (s) => (s.lifestealPerKill += 2),
  },
  {
    id: 'poison',
    name: 'Venom',
    desc: 'Hits apply Poison',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['poison'],
    apply: (s) => {
      s.poison = true;
      s.poisonDpsMult += 0.5;
    },
  },
  {
    id: 'explosion',
    name: 'Demolition',
    desc: 'Projectiles Explode',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['explosion', 'fire'],
    apply: (s) => {
      s.explosion = true;
      s.explosionDamageMult += 0.5;
    },
  },
  {
    id: 'fire_aura',
    name: 'Fire Aura',
    desc: 'Burn nearby enemies',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['fire'],
    apply: (s) => {
      s.fireAura = true;
      s.fireAuraDpsMult += 0.5;
    },
  },
  {
    id: 'chain',
    name: 'Chain Lightning',
    desc: `Hits arc +1 jump and +${EFFECTS.chainRangePerStack}px chain range`,
    rarity: 'epic',
    maxStacks: 5,
    tags: ['lightning'],
    apply: (s) => {
      s.chain = true;
      s.chainJumpsBonus += 1;
      s.chainRangeBonus += EFFECTS.chainRangePerStack;
    },
  },
  {
    id: 'poison_trail',
    name: 'Toxic Trail',
    desc: 'Leave a poison trail behind you',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['poison'],
    apply: (s) => {
      s.poisonTrail = true;
      s.poisonTrailDpsMult += 0.5;
    },
  },
  {
    id: 'spike_shield',
    name: 'Spike Shield',
    desc: 'Orbiting spikes shred nearby foes',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['defense', 'spike'],
    apply: (s) => {
      s.spikeShield = true;
      s.spikeDpsMult += 0.5;
    },
  },
  {
    id: 'frostbite',
    name: 'Frostbite',
    desc: 'Hits chill and slow enemies harder each stack',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['frost'],
    apply: (s) => {
      s.slow = true;
      s.slowMult += 0.5;
    },
  },
  {
    id: 'cryo_nova',
    name: 'Cryo Nova',
    desc: '5% chance on hit to freeze enemies around the impact',
    rarity: 'epic',
    maxStacks: 4,
    tags: ['frost'],
    apply: (s) => {
      const alreadyOwned = s.freezeNova;
      s.freezeNova = true;
      s.freezeNovaChance += alreadyOwned ? EFFECTS.freezeNovaChancePerStack : EFFECTS.freezeNovaChance;
      if (alreadyOwned) {
        s.freezeNovaRadiusBonus += EFFECTS.freezeNovaRadiusPerStack;
        s.freezeNovaDurationBonusMs += EFFECTS.freezeNovaDurationPerStackMs;
      }
    },
  },
  {
    id: 'storm_focus',
    name: 'Storm Focus',
    desc: '+120px chain range and +20% lightning damage',
    rarity: 'rare',
    maxStacks: 4,
    tags: ['lightning', 'offense'],
    apply: (s) => {
      s.chain = true;
      s.chainRangeBonus += 120;
      s.damage *= 1.2;
    },
  },
  {
    id: 'berserk',
    name: 'Berserker',
    desc: 'The lower your HP, the more damage you deal',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['offense', 'rage'],
    apply: (s) => {
      s.berserk = true;
      s.berserkMult += 0.5;
    },
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    desc: '+15% Damage & +10% Attack Speed',
    rarity: 'rare',
    maxStacks: 5,
    tags: ['offense'],
    apply: (s) => {
      s.damage *= 1.15;
      s.attacksPerSec *= 1.1;
    },
  },
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    desc: '+45% Damage, but -15 Max HP',
    rarity: 'epic',
    maxStacks: 3,
    tags: ['offense', 'rage'],
    apply: (s) => {
      s.damage *= 1.45;
      s.maxHp = Math.max(20, s.maxHp - 15);
      s.hp = Math.min(s.hp, s.maxHp);
    },
  },
] as const;

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);
