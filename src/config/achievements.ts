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
    desc: 'Defeat your first enemy.',
    check: (_run, save) => save.stats.totalKills >= 1,
  },
  {
    id: 'kill_100',
    name: 'Centurion',
    desc: 'Defeat 100 enemies in total.',
    check: (_run, save) => save.stats.totalKills >= 100,
  },
  {
    id: 'kill_1000',
    name: 'Slayer',
    desc: 'Defeat 1000 enemies in total.',
    check: (_run, save) => save.stats.totalKills >= 1000,
  },
  {
    id: 'level_25',
    name: 'Ascendant',
    desc: 'Reach level 25 in a single run.',
    check: (run) => run.level >= 25,
  },
  {
    id: 'level_50',
    name: 'Overpowered',
    desc: 'Reach level 50 in a single run.',
    check: (run) => run.level >= 50,
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    desc: 'Defeat the boss.',
    check: (run) => run.bossDefeated,
  },
  {
    id: 'survivor',
    name: 'Survivor',
    desc: 'Survive 5 minutes in a single run.',
    check: (run) => run.timeMs >= 5 * 60 * 1000,
  },
  {
    id: 'play_100',
    name: 'Addicted',
    desc: 'Play 100 runs.',
    check: (_run, save) => save.stats.totalRuns >= 100,
  },
];
