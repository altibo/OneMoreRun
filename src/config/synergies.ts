import type { PlayerStats } from '../types';

export interface SynergyDef {
  id: string;
  name: string;
  desc: string;
  /** Alle diese Tags müssen unter den gewählten Upgrades vorhanden sein. */
  requiresTags: string[];
  /** Einmaliger Effekt beim Freischalten der Synergie. */
  apply: (s: PlayerStats) => void;
}

/**
 * Synergie-System — das Herzstück. Sobald die nötigen Tags im Build sind, wird
 * die Synergie einmalig freigeschaltet und verstärkt den Build.
 */
export const SYNERGIES: readonly SynergyDef[] = [
  {
    id: 'toxic_explosion',
    name: 'Toxic Explosion',
    desc: 'Fire + Poison: explosions poison and hit harder.',
    requiresTags: ['fire', 'poison'],
    apply: (s) => {
      s.explosion = true;
      s.poison = true;
      s.explosionDamageMult += 0.6;
      s.poisonDpsMult += 0.8;
    },
  },
  {
    id: 'critical_explosion',
    name: 'Critical Explosion',
    desc: 'Critical + Explosion: bigger, critical explosions.',
    requiresTags: ['crit', 'explosion'],
    apply: (s) => {
      s.explosionRadiusMult += 0.4;
      s.explosionDamageMult += 0.5;
      s.critMultiplier += 0.5;
    },
  },
  {
    id: 'electric_beam',
    name: 'Electric Beam',
    desc: 'Laser + Chain Lightning: pierces discharge as a beam.',
    requiresTags: ['laser', 'lightning'],
    apply: (s) => {
      s.chain = true;
      s.chainJumpsBonus += 2;
      s.pierce += 1;
    },
  },
  {
    id: 'inferno',
    name: 'Inferno',
    desc: 'Fire + Crit: the burning aura strikes critically.',
    requiresTags: ['fire', 'crit'],
    apply: (s) => {
      s.fireAura = true;
      s.fireAuraDpsMult += 0.8;
    },
  },
  {
    id: 'storm_caller',
    name: 'Storm Caller',
    desc: 'Lightning + Offense: more jumps, more damage.',
    requiresTags: ['lightning', 'offense'],
    apply: (s) => {
      s.chainJumpsBonus += 1;
      s.damage *= 1.15;
    },
  },
  {
    id: 'burning_thorns',
    name: 'Burning Thorns',
    desc: 'Spike + Fire: glowing spikes burn enemies.',
    requiresTags: ['spike', 'fire'],
    apply: (s) => {
      s.spikeShield = true;
      s.spikeDpsMult += 0.6;
      s.fireAura = true;
    },
  },
  {
    id: 'thermal_shock',
    name: 'Thermal Shock',
    desc: 'Frost + Fire: chilled foes shatter in flame.',
    requiresTags: ['frost', 'fire'],
    apply: (s) => {
      s.slow = true;
      s.fireAura = true;
      s.fireAuraDpsMult += 0.7;
      s.slowMult += 0.4;
    },
  },
  {
    id: 'glacial_storm',
    name: 'Glacial Storm',
    desc: 'Frost + Lightning: chained bolts freeze deeper.',
    requiresTags: ['frost', 'lightning'],
    apply: (s) => {
      s.chain = true;
      s.slow = true;
      s.chainJumpsBonus += 1;
      s.slowMult += 0.6;
    },
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    desc: 'Rage + Crit: desperate strikes crit harder.',
    requiresTags: ['rage', 'crit'],
    apply: (s) => {
      s.berserk = true;
      s.critMultiplier += 0.6;
      s.critChance += 0.05;
    },
  },
  {
    id: 'absolute_zero',
    name: 'Absolute Zero',
    desc: 'Frost + Spike: frozen foes are torn to shards.',
    requiresTags: ['frost', 'spike'],
    apply: (s) => {
      s.slow = true;
      s.spikeShield = true;
      s.spikeDpsMult += 0.8;
      s.slowMult += 0.5;
    },
  },
] as const;
