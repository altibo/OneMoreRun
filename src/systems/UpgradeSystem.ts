import Phaser from 'phaser';
import { UPGRADES, UPGRADE_BY_ID, type Rarity, type UpgradeDef } from '../config/upgrades';
import { SYNERGIES } from '../config/synergies';
import { EventBus, GameEvents } from '../managers/EventBus';
import type { PlayerStats } from '../types';

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 100,
  rare: 45,
  epic: 16,
};

/**
 * Verwaltet den Build: wendet Upgrades an, löst Synergien auf und stellt die
 * zufällige 3er-Auswahl bereit. Datengetrieben über config/upgrades & synergies.
 */
export class UpgradeSystem {
  private owned = new Map<string, number>();
  private ownedTags = new Set<string>();
  private unlockedSynergies = new Set<string>();
  private rng: Phaser.Math.RandomDataGenerator;

  constructor(
    private stats: PlayerStats,
    seed?: string,
  ) {
    this.rng = new Phaser.Math.RandomDataGenerator([seed ?? `${Date.now()}`]);
  }

  /** Liefert bis zu `count` zufällige, noch wählbare Upgrades. */
  offer(count = 3): UpgradeDef[] {
    const pool = UPGRADES.filter((u) => (this.owned.get(u.id) ?? 0) < u.maxStacks);
    const picks: UpgradeDef[] = [];
    const working = [...pool];

    while (picks.length < count && working.length > 0) {
      const total = working.reduce((sum, u) => sum + this.weightOf(u), 0);
      let roll = this.rng.frac() * total;
      let idx = 0;
      for (let i = 0; i < working.length; i++) {
        roll -= this.weightOf(working[i]);
        if (roll <= 0) {
          idx = i;
          break;
        }
      }
      picks.push(working[idx]);
      working.splice(idx, 1);
    }
    EventBus.emit(GameEvents.UpgradeOffered, { ids: picks.map((p) => p.id) });
    return picks;
  }

  choose(id: string): void {
    const def = UPGRADE_BY_ID[id];
    if (!def) return;
    const stacks = (this.owned.get(id) ?? 0) + 1;
    this.owned.set(id, stacks);
    def.tags.forEach((t) => this.ownedTags.add(t));
    def.apply(this.stats);
    EventBus.emit(GameEvents.UpgradeChosen, { id });
    this.resolveSynergies();
  }

  getBuild(): string[] {
    const parts: string[] = [];
    for (const [id, stacks] of this.owned) {
      const def = UPGRADE_BY_ID[id];
      parts.push(stacks > 1 ? `${def.name} x${stacks}` : def.name);
    }
    for (const id of this.unlockedSynergies) {
      const syn = SYNERGIES.find((s) => s.id === id);
      if (syn) parts.push(`★ ${syn.name}`);
    }
    return parts;
  }

  private resolveSynergies(): void {
    for (const syn of SYNERGIES) {
      if (this.unlockedSynergies.has(syn.id)) continue;
      if (syn.requiresTags.every((t) => this.ownedTags.has(t))) {
        this.unlockedSynergies.add(syn.id);
        syn.apply(this.stats);
        EventBus.emit(GameEvents.SynergyUnlocked, { id: syn.id, name: syn.name });
      }
    }
  }

  private weightOf(u: UpgradeDef): number {
    // Luck verschiebt Gewicht hin zu selteneren Upgrades.
    const luck = this.stats.luck;
    const base = RARITY_WEIGHT[u.rarity];
    if (u.rarity === 'epic') return base * (1 + luck * 0.25);
    if (u.rarity === 'rare') return base * (1 + luck * 0.1);
    return base;
  }
}
