import type { SaveData } from '../save/SaveData';
import type { RunResult } from '../types';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  /** True, wenn nach diesem Run freigeschaltet. */
  check: (run: RunResult, save: SaveData) => boolean;
}

/** Kleine, häufige Ziele — ständige Erfolgserlebnisse (Reward Frequency). */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    desc: 'Besiege deinen ersten Gegner.',
    check: (_run, save) => save.stats.totalKills >= 1,
  },
  {
    id: 'kill_100',
    name: 'Centurion',
    desc: 'Besiege insgesamt 100 Gegner.',
    check: (_run, save) => save.stats.totalKills >= 100,
  },
  {
    id: 'kill_1000',
    name: 'Slayer',
    desc: 'Besiege insgesamt 1000 Gegner.',
    check: (_run, save) => save.stats.totalKills >= 1000,
  },
  {
    id: 'level_25',
    name: 'Ascendant',
    desc: 'Erreiche Level 25 in einem Run.',
    check: (run) => run.level >= 25,
  },
  {
    id: 'level_50',
    name: 'Overpowered',
    desc: 'Erreiche Level 50 in einem Run.',
    check: (run) => run.level >= 50,
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    desc: 'Besiege den Boss.',
    check: (run) => run.bossDefeated,
  },
  {
    id: 'survivor',
    name: 'Survivor',
    desc: 'Überlebe 5 Minuten in einem Run.',
    check: (run) => run.timeMs >= 5 * 60 * 1000,
  },
  {
    id: 'play_100',
    name: 'Addicted',
    desc: 'Spiele 100 Runs.',
    check: (_run, save) => save.stats.totalRuns >= 100,
  },
];
