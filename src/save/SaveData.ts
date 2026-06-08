/** Datenmodell für persistenten Zustand (localStorage). */
export interface SaveData {
  version: number;
  meta: {
    coins: number;
    upgrades: Record<string, number>; // metaUpgradeId -> Level
  };
  stats: {
    totalKills: number;
    totalRuns: number;
    bestTimeMs: number;
    highestLevel: number;
  };
  unlocks: string[];
  achievements: string[];
  settings: {
    muted: boolean;
    volume: number;
  };
}

export const SAVE_VERSION = 1;

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    meta: {
      coins: 0,
      upgrades: {},
    },
    stats: {
      totalKills: 0,
      totalRuns: 0,
      bestTimeMs: 0,
      highestLevel: 0,
    },
    unlocks: [],
    achievements: [],
    settings: {
      muted: false,
      volume: 0.6,
    },
  };
}
