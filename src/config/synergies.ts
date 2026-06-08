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
    desc: 'Fire + Poison: Explosionen vergiften und schlagen härter zu.',
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
    desc: 'Critical + Explosion: Größere, kritische Explosionen.',
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
    desc: 'Laser + Chain Lightning: Durchschlag entlädt sich als Beam.',
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
    desc: 'Fire + Crit: Brennende Aura trifft kritisch.',
    requiresTags: ['fire', 'crit'],
    apply: (s) => {
      s.fireAura = true;
      s.fireAuraDpsMult += 0.8;
    },
  },
  {
    id: 'storm_caller',
    name: 'Storm Caller',
    desc: 'Lightning + Offense: Mehr Sprünge, mehr Schaden.',
    requiresTags: ['lightning', 'offense'],
    apply: (s) => {
      s.chainJumpsBonus += 1;
      s.damage *= 1.15;
    },
  },
  {
    id: 'burning_thorns',
    name: 'Burning Thorns',
    desc: 'Spike + Fire: Glühende Stacheln verbrennen Gegner.',
    requiresTags: ['spike', 'fire'],
    apply: (s) => {
      s.spikeShield = true;
      s.spikeDpsMult += 0.6;
      s.fireAura = true;
    },
  },
] as const;
