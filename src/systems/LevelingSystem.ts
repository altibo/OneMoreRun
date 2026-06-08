import { LEVELING } from '../config/balance';
import { EventBus, GameEvents } from '../managers/EventBus';
import type { PlayerStats } from '../types';

/** XP-Kurve & Level-Ups. Triggert die Upgrade-Auswahl über das Event-System. */
export class LevelingSystem {
  level = 1;
  private xp = 0;
  private xpToNext: number = LEVELING.baseXpToLevel;

  constructor(private stats: PlayerStats) {}

  addXp(rawAmount: number): void {
    this.xp += rawAmount * this.stats.xpBonus;
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.round(
        LEVELING.baseXpToLevel * Math.pow(LEVELING.xpGrowth, this.level - 1),
      );
      leveled = true;
    }
    if (leveled) {
      EventBus.emit(GameEvents.LevelUp, { level: this.level });
    }
  }

  getProgress(): number {
    return this.xp / this.xpToNext;
  }
}
