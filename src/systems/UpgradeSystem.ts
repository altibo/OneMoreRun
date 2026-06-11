import Phaser from 'phaser';
import { EFFECTS } from '../config/balance';
import { SYNERGIES } from '../config/synergies';
import { UPGRADES, UPGRADE_BY_ID, type Rarity, type UpgradeDef } from '../config/upgrades';
import { EventBus, GameEvents } from '../managers/EventBus';
import type { PlayerStats } from '../types';

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 100,
  rare: 45,
  epic: 16,
};

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
      if (syn) parts.push(`* ${syn.name}`);
    }
    return parts;
  }

  getBuildDetails(): string[] {
    const parts: string[] = [];
    for (const [id, stacks] of this.owned) {
      const def = UPGRADE_BY_ID[id];
      const name = stacks > 1 ? `${def.name} x${stacks}` : def.name;
      parts.push(`${name}: ${this.describeUpgrade(id, stacks, def)}`);
    }
    for (const id of this.unlockedSynergies) {
      const syn = SYNERGIES.find((s) => s.id === id);
      if (syn) parts.push(`* ${syn.name}: ${syn.desc}`);
    }
    return parts;
  }

  private describeUpgrade(id: string, stacks: number, def: UpgradeDef): string {
    switch (id) {
      case 'damage':
        return `Weapon damage is ${Math.round(this.stats.damage)} after ${stacks} damage stack(s).`;
      case 'attack_speed':
        return `Fires ${this.stats.attacksPerSec.toFixed(2)} shots per second.`;
      case 'multishot':
        return `Fires ${this.stats.projectileCount} projectile(s) per attack.`;
      case 'proj_speed':
        return `Projectiles travel at ${Math.round(this.stats.projectileSpeed)} px/s.`;
      case 'proj_size':
        return `Projectile radius is ${this.stats.projectileRadius.toFixed(1)} px.`;
      case 'pierce':
        return `Projectiles pierce ${this.stats.pierce} enemy/enemies before stopping.`;
      case 'crit_chance':
      case 'crit_dmg':
        return `${Math.round(this.stats.critChance * 100)}% crit chance for x${this.stats.critMultiplier.toFixed(1)} damage.`;
      case 'max_hp':
        return `Maximum health is ${Math.round(this.stats.maxHp)}.`;
      case 'regen':
        return `Regenerates ${this.stats.hpRegenPerSec.toFixed(1)} HP per second.`;
      case 'armor':
        return `Reduces incoming damage by ${Math.round(this.stats.armor * 100)}%.`;
      case 'move_speed':
        return `Move speed is ${Math.round(this.stats.moveSpeed)} px/s.`;
      case 'magnet':
        return `Pickup magnet range is ${Math.round(this.stats.pickupRange)} px.`;
      case 'xp_boost':
        return `XP gain is x${this.stats.xpBonus.toFixed(2)}.`;
      case 'luck':
        return `Luck is ${this.stats.luck}, improving rare and epic upgrade odds.`;
      case 'lifesteal':
        return `Heals ${this.stats.lifestealPerKill} HP whenever an enemy dies.`;
      case 'poison':
        return `Hits poison enemies for ${(EFFECTS.poisonDps * this.stats.poisonDpsMult).toFixed(1)} DPS for ${(EFFECTS.poisonDurationMs / 1000).toFixed(1)}s.`;
      case 'explosion':
        return `Projectiles explode in a ${Math.round(EFFECTS.explosionRadius * this.stats.explosionRadiusMult)} px radius for ${Math.round(EFFECTS.explosionDamageFactor * this.stats.explosionDamageMult * 100)}% projectile damage.`;
      case 'fire_aura':
        return `Burns enemies within ${EFFECTS.fireAuraRadius} px for ${(EFFECTS.fireAuraDps * this.stats.fireAuraDpsMult).toFixed(1)} DPS.`;
      case 'chain':
      case 'storm_focus':
        return `Lightning jumps ${EFFECTS.chainJumps + this.stats.chainJumpsBonus} time(s) up to ${EFFECTS.chainRange + this.stats.chainRangeBonus} px; each jump deals ${Math.round(EFFECTS.chainDamageFactor * 100)}% damage.`;
      case 'poison_trail':
        return `Leaves poison clouds with a ${EFFECTS.poisonTrailRadius} px radius for ${(EFFECTS.poisonTrailDps * this.stats.poisonTrailDpsMult).toFixed(1)} DPS.`;
      case 'spike_shield':
        return `${EFFECTS.spikeCount} orbiting spikes deal ${(EFFECTS.spikeDps * this.stats.spikeDpsMult).toFixed(1)} DPS within ${EFFECTS.spikeRadius} px.`;
      case 'frostbite':
        return `Hits slow enemies to about ${Math.round((EFFECTS.slowFactor / this.stats.slowMult) * 100)}% speed for ${(EFFECTS.slowDurationMs / 1000).toFixed(1)}s.`;
      case 'cryo_nova':
        return `${Math.round(this.stats.freezeNovaChance * 100)}% on-hit chance to freeze enemies within ${EFFECTS.freezeNovaRadius + this.stats.freezeNovaRadiusBonus} px for ${((EFFECTS.freezeNovaDurationMs + this.stats.freezeNovaDurationBonusMs) / 1000).toFixed(1)}s.`;
      case 'berserk':
        return `Damage rises as HP drops, up to +${Math.round(EFFECTS.berserkMaxBonus * this.stats.berserkMult * 100)}%.`;
      case 'overcharge':
        return `Current damage is ${Math.round(this.stats.damage)} and attack speed is ${this.stats.attacksPerSec.toFixed(2)}/s.`;
      case 'glass_cannon':
        return `Current damage is ${Math.round(this.stats.damage)}, max HP is ${Math.round(this.stats.maxHp)}.`;
      default:
        return `${def.desc} (${stacks}/${def.maxStacks} stack(s)).`;
    }
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
    const luck = this.stats.luck;
    const base = RARITY_WEIGHT[u.rarity];
    if (u.rarity === 'epic') return base * (1 + luck * 0.25);
    if (u.rarity === 'rare') return base * (1 + luck * 0.1);
    return base;
  }
}
