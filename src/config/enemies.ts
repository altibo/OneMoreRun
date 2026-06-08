import { COLORS } from './balance';

export type EnemyKind = 'grunt' | 'fast' | 'tank' | 'swarm' | 'brute';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  baseHp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xp: number;
  color: number;
  /** Ab dieser Run-Zeit (Sek.) kann dieser Typ spawnen. */
  unlockAtSec: number;
  /** Relatives Spawngewicht. */
  weight: number;
}

/**
 * 5 Basis-Archetypen ergeben zusammen mit der Größen-/Farbvariation die in der
 * Spec geforderten ~10 Gegner-Erscheinungen. Datengetrieben, keine Magic Numbers
 * im Spawner.
 */
export const ENEMIES: readonly EnemyDef[] = [
  {
    kind: 'grunt',
    name: 'Grunt',
    baseHp: 18,
    speed: 70,
    radius: 13,
    contactDamage: 8,
    xp: 1,
    color: COLORS.enemy,
    unlockAtSec: 0,
    weight: 100,
  },
  {
    kind: 'swarm',
    name: 'Swarmling',
    baseHp: 9,
    speed: 95,
    radius: 9,
    contactDamage: 5,
    xp: 1,
    color: COLORS.enemy,
    unlockAtSec: 20,
    weight: 70,
  },
  {
    kind: 'fast',
    name: 'Runner',
    baseHp: 14,
    speed: 135,
    radius: 11,
    contactDamage: 9,
    xp: 2,
    color: COLORS.enemyFast,
    unlockAtSec: 45,
    weight: 55,
  },
  {
    kind: 'tank',
    name: 'Tank',
    baseHp: 70,
    speed: 48,
    radius: 20,
    contactDamage: 14,
    xp: 4,
    color: COLORS.enemyTank,
    unlockAtSec: 75,
    weight: 30,
  },
  {
    kind: 'brute',
    name: 'Brute',
    baseHp: 130,
    speed: 60,
    radius: 26,
    contactDamage: 20,
    xp: 7,
    color: COLORS.enemyTank,
    unlockAtSec: 110,
    weight: 18,
  },
] as const;

export interface BossDef {
  name: string;
  baseHp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xp: number;
  color: number;
}

export const BOSS_DEF: BossDef = {
  name: 'The Devourer',
  baseHp: 2600,
  speed: 64,
  radius: 46,
  contactDamage: 26,
  xp: 60,
  color: COLORS.boss,
};
