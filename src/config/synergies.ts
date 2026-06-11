import { EFFECTS } from './balance';
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
    desc: `Fire + Poison: enables explosions and poison; explosions gain +60% damage and poison gains +${Math.round(0.8 * EFFECTS.poisonDps)} DPS base scaling.`,
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
    desc: `Critical + Explosion: explosion radius gains +40%, explosion damage gains +50%, crit damage gains +0.5x.`,
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
    desc: `Laser + Chain Lightning: +2 lightning jumps, +120 px chain range, and +1 pierce.`,
    requiresTags: ['laser', 'lightning'],
    apply: (s) => {
      s.chain = true;
      s.chainJumpsBonus += 2;
      s.chainRangeBonus += 120;
      s.pierce += 1;
    },
  },
  {
    id: 'inferno',
    name: 'Inferno',
    desc: `Fire + Crit: enables Fire Aura and adds +${Math.round(EFFECTS.fireAuraDps * 0.8)} aura DPS base scaling.`,
    requiresTags: ['fire', 'crit'],
    apply: (s) => {
      s.fireAura = true;
      s.fireAuraDpsMult += 0.8;
    },
  },
  {
    id: 'storm_caller',
    name: 'Storm Caller',
    desc: 'Lightning + Offense: +1 lightning jump, +80 px chain range, and +15% damage.',
    requiresTags: ['lightning', 'offense'],
    apply: (s) => {
      s.chainJumpsBonus += 1;
      s.chainRangeBonus += 80;
      s.damage *= 1.15;
    },
  },
  {
    id: 'burning_thorns',
    name: 'Burning Thorns',
    desc: `Spike + Fire: enables spikes and Fire Aura; spikes gain +${Math.round(EFFECTS.spikeDps * 0.6)} DPS base scaling.`,
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
    desc: `Frost + Fire: enables slow and Fire Aura; aura gains +${Math.round(EFFECTS.fireAuraDps * 0.7)} DPS base scaling and slows improve by +40%.`,
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
    desc: 'Frost + Lightning: enables chain and slow, adds +1 lightning jump, +80 px chain range, and +60% stronger slows.',
    requiresTags: ['frost', 'lightning'],
    apply: (s) => {
      s.chain = true;
      s.slow = true;
      s.chainJumpsBonus += 1;
      s.chainRangeBonus += 80;
      s.slowMult += 0.6;
    },
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    desc: 'Rage + Crit: enables Berserker, adds +0.6x crit damage and +5% crit chance.',
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
    desc: `Frost + Spike: enables slow, spikes, and Cryo Nova; adds +5% freeze chance, +${Math.round(EFFECTS.spikeDps * 0.8)} spike DPS base scaling, and +50% stronger slows.`,
    requiresTags: ['frost', 'spike'],
    apply: (s) => {
      s.slow = true;
      s.spikeShield = true;
      s.freezeNova = true;
      s.freezeNovaChance += 0.05;
      s.spikeDpsMult += 0.8;
      s.slowMult += 0.5;
    },
  },
] as const;
