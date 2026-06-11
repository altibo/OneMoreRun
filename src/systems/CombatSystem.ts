import Phaser from 'phaser';
import { COLORS, EFFECTS } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import { EventBus, GameEvents } from '../managers/EventBus';
import { Enemy } from '../entities/Enemy';
import { Pickup, type PickupKind } from '../entities/Pickup';
import { Player, TEX } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { LevelingSystem } from './LevelingSystem';
import type { PlayerStats } from '../types';

export interface CombatContext {
  scene: Phaser.Scene;
  player: Player;
  stats: PlayerStats;
  enemies: Phaser.Physics.Arcade.Group;
  projectiles: Phaser.Physics.Arcade.Group;
  pickups: Phaser.Physics.Arcade.Group;
  leveling: LevelingSystem;
  spawnPickup: (x: number, y: number, kind: PickupKind, value: number, tint?: number) => void;
  floatingText: (x: number, y: number, text: string, color: number) => void;
  burst: (x: number, y: number, color: number, count?: number) => void;
  addKill: (enemy: Enemy) => void;
  addCoins: (amount: number) => void;
}

const SHIELD_ACTIVE_MS = 1500;

/** Kollisionen, Schaden, Effekte (Poison/Explosion/Chain/Aura), Loot & Tod. */
export class CombatSystem {
  private fireAuraTimer = 0;
  private shieldTimer = EFFECTS.shieldCooldownMs;
  private shieldActiveUntil = 0;
  private poisonTrailTimer = 0;
  private spikeTickTimer = 0;
  private spikeContainer?: Phaser.GameObjects.Container;
  private fireAuraVisual?: Phaser.GameObjects.Arc;
  private trailPuddles: {
    cloud: Phaser.GameObjects.Container;
    x: number;
    y: number;
    expireAt: number;
    nextTick: number;
  }[] = [];
  private frozenCrystals = new Map<Enemy, Phaser.GameObjects.Container>();

  constructor(private ctx: CombatContext) {}

  setup(): void {
    const { scene, player, enemies, projectiles, pickups } = this.ctx;
    scene.physics.add.overlap(projectiles, enemies, this.onProjectileHit, undefined, this);
    scene.physics.add.overlap(player, enemies, this.onPlayerContact, undefined, this);
    scene.physics.add.overlap(player, pickups, this.onPickup, undefined, this);
  }

  update(deltaMs: number, time: number): void {
    this.tickProjectiles(time);
    this.tickPoison(time, deltaMs);
    this.tickFireAura(deltaMs, time);
    this.tickShield(deltaMs, time);
    this.tickPoisonTrail(deltaMs, time);
    this.tickSpikes(deltaMs, time);
    this.tickFrozenCrystals(time);
  }

  // --- Overlap-Handler ----------------------------------------------------

  private onProjectileHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (a, b) => {
    const proj = a as Projectile;
    const enemy = b as Enemy;
    if (!proj.active || !enemy.active) return;

    this.damageEnemy(enemy, proj.damage, proj.isCrit);

    if (this.ctx.stats.explosion) {
      this.explode(enemy.x, enemy.y, proj.damage);
    }
    if (this.ctx.stats.chain) {
      this.chain(enemy, proj.damage);
    }

    if (proj.pierceLeft > 0) {
      proj.pierceLeft -= 1;
    } else {
      proj.deactivate();
    }
  };

  private onPlayerContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_a, b) => {
    const enemy = b as Enemy;
    if (!enemy.active) return;
    this.ctx.player.takeDamage(enemy.contactDamage, this.ctx.scene.time.now);
  };

  private onPickup: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_a, b) => {
    const pickup = b as Pickup;
    if (!pickup.active) return;
    if (pickup.kind === 'xp') {
      this.ctx.leveling.addXp(pickup.value);
      AudioManager.play('xp');
      EventBus.emit(GameEvents.XpCollected, { amount: pickup.value });
    } else {
      this.ctx.addCoins(pickup.value);
      AudioManager.play('coin');
      EventBus.emit(GameEvents.CoinCollected, { amount: pickup.value });
    }
    pickup.collect();
  };

  // --- Schaden & Tod ------------------------------------------------------

  private damageEnemy(enemy: Enemy, amount: number, isCrit: boolean): void {
    const dead = enemy.damage(amount);
    this.showDamage(enemy.x, enemy.y - 12, amount, isCrit);
    AudioManager.play('hit');
    if (this.ctx.stats.poison) {
      enemy.applyPoison(
        EFFECTS.poisonDps * this.ctx.stats.poisonDpsMult,
        EFFECTS.poisonDurationMs,
        this.ctx.scene.time.now,
      );
    }
    if (this.ctx.stats.slow) {
      const factor = Phaser.Math.Clamp(EFFECTS.slowFactor / this.ctx.stats.slowMult, 0.2, 0.95);
      enemy.applySlow(factor, EFFECTS.slowDurationMs, this.ctx.scene.time.now);
      enemy.setTint(COLORS.frost);
      this.ctx.scene.time.delayedCall(140, () => {
        if (enemy.active && !enemy.isFrozen(this.ctx.scene.time.now)) enemy.restoreTint();
      });
    }
    if (this.ctx.stats.freezeNova && Math.random() < this.ctx.stats.freezeNovaChance) {
      this.freezeNova(enemy.x, enemy.y);
    }
    if (dead) this.killEnemy(enemy);
  }

  /** Floating damage number; crits pop bigger and gold. */
  private showDamage(x: number, y: number, amount: number, isCrit: boolean): void {
    const label = this.ctx.scene.add
      .text(x, y, `${Math.round(amount)}`, {
        fontFamily: 'system-ui',
        fontSize: isCrit ? '22px' : '15px',
        color: isCrit ? '#ffd166' : '#ffffff',
        fontStyle: isCrit ? 'bold' : 'normal',
        stroke: '#000000',
        strokeThickness: isCrit ? 4 : 3,
      })
      .setOrigin(0.5)
      .setDepth(72);
    this.ctx.scene.tweens.add({
      targets: label,
      y: y - (isCrit ? 36 : 26),
      alpha: 0,
      scale: isCrit ? 1.3 : 1,
      duration: isCrit ? 620 : 480,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private killEnemy(enemy: Enemy): void {
    if (!enemy.active) return;
    const wasBoss = enemy.isBoss;
    this.ctx.burst(enemy.x, enemy.y, wasBoss ? COLORS.boss : COLORS.enemy, wasBoss ? 30 : 8);
    this.spawnXpOrbs(enemy);

    if (wasBoss) {
      for (let i = 0; i < 12; i++) {
        const ox = enemy.x + Phaser.Math.Between(-40, 40);
        const oy = enemy.y + Phaser.Math.Between(-40, 40);
        this.ctx.spawnPickup(ox, oy, 'coin', 4);
      }
      AudioManager.play('explosion');
    }

    if (this.ctx.stats.lifestealPerKill > 0) {
      this.ctx.player.heal(this.ctx.stats.lifestealPerKill);
    }
    this.frozenCrystals.get(enemy)?.destroy();
    this.frozenCrystals.delete(enemy);
    this.ctx.addKill(enemy);
    enemy.kill();
  }

  private spawnXpOrbs(enemy: Enemy): void {
    const color = enemy.isBoss
      ? COLORS.xpBoss
      : enemy.xp >= 7
        ? COLORS.xpEpic
        : enemy.xp >= 4
          ? COLORS.xpRare
          : enemy.xp >= 2
            ? COLORS.coin
            : COLORS.xp;
    const orbCount = Phaser.Math.Clamp(
      enemy.isBoss ? Math.ceil(enemy.xp / 3) : EFFECTS.xpOrbMinCount + Math.floor(enemy.xp / 2),
      EFFECTS.xpOrbMinCount,
      EFFECTS.xpOrbMaxCount,
    );
    const value = enemy.xp / orbCount;
    const lineAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const spacing = enemy.isBoss ? 11 : 8;
    for (let i = 0; i < orbCount; i++) {
      const sideOffset = (i - (orbCount - 1) / 2) * spacing;
      const depthOffset = Phaser.Math.Between(-5, 5);
      this.ctx.spawnPickup(
        enemy.x + Math.cos(lineAngle) * sideOffset + Math.cos(lineAngle + Math.PI / 2) * depthOffset,
        enemy.y + Math.sin(lineAngle) * sideOffset + Math.sin(lineAngle + Math.PI / 2) * depthOffset,
        'xp',
        value,
        color,
      );
    }
  }

  // --- Effekte ------------------------------------------------------------

  private explode(x: number, y: number, baseDamage: number): void {
    const radius = EFFECTS.explosionRadius * this.ctx.stats.explosionRadiusMult;
    const dmg = baseDamage * EFFECTS.explosionDamageFactor * this.ctx.stats.explosionDamageMult;
    this.ctx.burst(x, y, COLORS.fire, 12);
    AudioManager.play('explosion');
    this.forEachEnemyInRange(x, y, radius, (enemy) => {
      if (enemy.damage(dmg, false)) this.killEnemy(enemy);
    });
  }

  private chain(from: Enemy, baseDamage: number): void {
    const jumps = EFFECTS.chainJumps + this.ctx.stats.chainJumpsBonus;
    const range = EFFECTS.chainRange + this.ctx.stats.chainRangeBonus;
    const dmg = baseDamage * EFFECTS.chainDamageFactor;
    let source = from;
    const hit = new Set<Enemy>([from]);
    for (let j = 0; j < jumps; j++) {
      const next = this.nearestEnemyExcluding(source.x, source.y, range, hit);
      if (!next) break;
      this.drawBolt(source.x, source.y, next.x, next.y);
      if (next.damage(dmg, false)) this.killEnemy(next);
      hit.add(next);
      source = next;
    }
  }

  private tickFireAura(deltaMs: number, _time: number): void {
    if (!this.ctx.stats.fireAura) {
      this.fireAuraVisual?.setVisible(false);
      return;
    }
    const p = this.ctx.player;
    if (!this.fireAuraVisual) {
      this.fireAuraVisual = this.ctx.scene.add
        .circle(p.x, p.y, EFFECTS.fireAuraRadius, COLORS.fire, 0.12)
        .setStrokeStyle(3, COLORS.fire, 0.5)
        .setDepth(14);
    }
    const aura = this.fireAuraVisual;
    aura.setVisible(true).setPosition(p.x, p.y);
    // Gentle flicker so the burning aura is clearly visible.
    aura.setScale(1 + Math.sin(this.ctx.scene.time.now / 120) * 0.04);

    this.fireAuraTimer -= deltaMs;
    if (this.fireAuraTimer > 0) return;
    this.fireAuraTimer = EFFECTS.fireAuraTickMs;
    const dmg =
      ((EFFECTS.fireAuraDps * this.ctx.stats.fireAuraDpsMult) * EFFECTS.fireAuraTickMs) / 1000;
    this.forEachEnemyInRange(p.x, p.y, EFFECTS.fireAuraRadius, (enemy) => {
      const dead = enemy.damage(dmg, false);
      this.ctx.burst(enemy.x, enemy.y, COLORS.fire, 2);
      if (dead) this.killEnemy(enemy);
    });
  }

  private tickShield(deltaMs: number, time: number): void {
    if (!this.ctx.stats.shield) return;
    if (this.shieldActiveUntil > time) {
      this.ctx.player.setShield(true);
      return;
    }
    this.ctx.player.setShield(false);
    this.shieldTimer -= deltaMs;
    if (this.shieldTimer <= 0) {
      this.shieldTimer = EFFECTS.shieldCooldownMs;
      this.shieldActiveUntil = time + SHIELD_ACTIVE_MS;
      this.ctx.burst(this.ctx.player.x, this.ctx.player.y, COLORS.shield, 10);
    }
  }

  private tickPoison(time: number, deltaMs: number): void {
    this.ctx.enemies.children.iterate((obj) => {
      const enemy = obj as Enemy;
      if (enemy.active && enemy.tickPoison(time, deltaMs)) {
        this.killEnemy(enemy);
      }
      return true;
    });
  }

  /** Hinterlässt giftige Pfützen, die Gegner beim Durchlaufen schädigen. */
  private tickPoisonTrail(deltaMs: number, time: number): void {
    if (this.ctx.stats.poisonTrail) {
      this.poisonTrailTimer -= deltaMs;
      if (this.poisonTrailTimer <= 0) {
        this.poisonTrailTimer = EFFECTS.poisonTrailDropMs;
        this.dropPoisonPuddle(time);
      }
    }
    for (let i = this.trailPuddles.length - 1; i >= 0; i--) {
      const p = this.trailPuddles[i];
      if (time >= p.expireAt) {
        p.cloud.destroy();
        this.trailPuddles.splice(i, 1);
        continue;
      }
      if (time >= p.nextTick) {
        p.nextTick = time + EFFECTS.poisonTrailTickMs;
        const dmg =
          (EFFECTS.poisonTrailDps *
            this.ctx.stats.poisonTrailDpsMult *
            EFFECTS.poisonTrailTickMs) /
          1000;
        this.forEachEnemyInRange(p.x, p.y, EFFECTS.poisonTrailRadius, (enemy) => {
          if (enemy.damage(dmg, false)) this.killEnemy(enemy);
        });
      }
    }
  }

  private dropPoisonPuddle(time: number): void {
    const p = this.ctx.player;
    const cloud = this.ctx.scene.add.container(p.x, p.y).setDepth(15);
    const puffCount = 7;
    for (let i = 0; i < puffCount; i++) {
      const angle = (i / puffCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.35, 0.35);
      const dist = Phaser.Math.Between(0, EFFECTS.poisonTrailRadius * 0.55);
      const puff = this.ctx.scene.add
        .image(Math.cos(angle) * dist, Math.sin(angle) * dist, TEX.disc)
        .setTint(COLORS.poison)
        .setAlpha(0.16)
        .setBlendMode(Phaser.BlendModes.ADD);
      const size = Phaser.Math.Between(18, 34);
      puff.setDisplaySize(size, size);
      cloud.add(puff);
      this.ctx.scene.tweens.add({
        targets: puff,
        x: puff.x + Math.cos(angle) * Phaser.Math.Between(8, 18),
        y: puff.y + Math.sin(angle) * Phaser.Math.Between(8, 18),
        alpha: 0,
        scale: 1.45,
        duration: EFFECTS.poisonTrailDurationMs,
        ease: 'Sine.easeOut',
      });
    }
    this.ctx.scene.tweens.add({
      targets: cloud,
      alpha: 0,
      duration: EFFECTS.poisonTrailDurationMs,
    });
    this.trailPuddles.push({
      cloud,
      x: p.x,
      y: p.y,
      expireAt: time + EFFECTS.poisonTrailDurationMs,
      nextTick: time + EFFECTS.poisonTrailTickMs,
    });
  }

  private freezeNova(x: number, y: number): void {
    const radius = EFFECTS.freezeNovaRadius + this.ctx.stats.freezeNovaRadiusBonus;
    const duration = EFFECTS.freezeNovaDurationMs + this.ctx.stats.freezeNovaDurationBonusMs;
    this.ctx.burst(x, y, COLORS.frost, 14);
    this.drawFreezeRing(x, y, radius);
    this.forEachEnemyInRange(x, y, radius, (enemy) => {
      enemy.applyFreeze(duration, this.ctx.scene.time.now);
      enemy.setTint(COLORS.frost);
      this.showIceCrystals(enemy, duration);
    });
  }

  private drawFreezeRing(x: number, y: number, radius: number): void {
    const ring = this.ctx.scene.add
      .circle(x, y, 10, COLORS.frost, 0.1)
      .setStrokeStyle(3, COLORS.frost, 0.8)
      .setDepth(47)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.ctx.scene.tweens.add({
      targets: ring,
      radius,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private showIceCrystals(enemy: Enemy, durationMs: number): void {
    this.frozenCrystals.get(enemy)?.destroy();
    const c = this.ctx.scene.add.container(enemy.x, enemy.y).setDepth(63);
    const count = enemy.isBoss ? 9 : 5;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const shard = this.ctx.scene.add
        .image(Math.cos(a) * 18, Math.sin(a) * 18, TEX.spike)
        .setTint(COLORS.frost)
        .setAlpha(0.92)
        .setBlendMode(Phaser.BlendModes.ADD);
      shard.setDisplaySize(14, 24);
      shard.rotation = a;
      c.add(shard);
    }
    this.frozenCrystals.set(enemy, c);
    this.ctx.scene.tweens.add({
      targets: c,
      alpha: 0,
      delay: Math.max(0, durationMs - 260),
      duration: 260,
      onComplete: () => {
        c.destroy();
        if (this.frozenCrystals.get(enemy) === c) this.frozenCrystals.delete(enemy);
        if (enemy.active) enemy.restoreTint();
      },
    });
  }

  private tickFrozenCrystals(time: number): void {
    for (const [enemy, crystals] of this.frozenCrystals) {
      if (!enemy.active || !enemy.isFrozen(time)) {
        crystals.destroy();
        this.frozenCrystals.delete(enemy);
        if (enemy.active) enemy.restoreTint();
        continue;
      }
      crystals.setPosition(enemy.x, enemy.y);
    }
  }

  /** Rotierender Stachelschild: trifft alle Gegner im Radius periodisch. */
  private tickSpikes(deltaMs: number, _time: number): void {
    if (!this.ctx.stats.spikeShield) {
      this.spikeContainer?.setVisible(false);
      return;
    }
    const p = this.ctx.player;
    if (!this.spikeContainer) {
      this.spikeContainer = this.createSpikeVisual();
    }
    const c = this.spikeContainer;
    c.setVisible(true);
    c.setPosition(p.x, p.y);
    c.rotation += (EFFECTS.spikeRotateSpeed * deltaMs) / 1000;

    this.spikeTickTimer -= deltaMs;
    if (this.spikeTickTimer > 0) return;
    this.spikeTickTimer = EFFECTS.spikeTickMs;
    const dmg =
      (EFFECTS.spikeDps * this.ctx.stats.spikeDpsMult * EFFECTS.spikeTickMs) / 1000;
    this.forEachEnemyInRange(p.x, p.y, EFFECTS.spikeRadius, (enemy) => {
      // flash=true + kleiner Funke -> sichtbares Treffer-Feedback.
      const dead = enemy.damage(dmg, true);
      this.ctx.burst(enemy.x, enemy.y, COLORS.spike, 2);
      if (dead) this.killEnemy(enemy);
    });
  }

  private createSpikeVisual(): Phaser.GameObjects.Container {
    const scene = this.ctx.scene;
    const c = scene.add.container(this.ctx.player.x, this.ctx.player.y).setDepth(48);
    for (let i = 0; i < EFFECTS.spikeCount; i++) {
      const a = (i / EFFECTS.spikeCount) * Math.PI * 2;
      const spike = scene.add
        .image(Math.cos(a) * EFFECTS.spikeRadius, Math.sin(a) * EFFECTS.spikeRadius, TEX.spike)
        .setTint(COLORS.spike);
      spike.setDisplaySize(22, 22);
      spike.rotation = a + Math.PI / 2; // Spitze nach außen
      c.add(spike);
    }
    return c;
  }

  private tickProjectiles(time: number): void {
    this.ctx.projectiles.children.iterate((obj) => {
      const proj = obj as Projectile;
      if (proj.active && proj.isExpired(time)) proj.deactivate();
      return true;
    });
  }

  // --- Hilfsfunktionen ----------------------------------------------------

  private forEachEnemyInRange(
    x: number,
    y: number,
    range: number,
    fn: (enemy: Enemy) => void,
  ): void {
    const rangeSq = range * range;
    this.ctx.enemies.children.iterate((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return true;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= rangeSq) fn(enemy);
      return true;
    });
  }

  private nearestEnemyExcluding(
    x: number,
    y: number,
    range: number,
    exclude: Set<Enemy>,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestSq = range * range;
    this.ctx.enemies.children.iterate((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active || exclude.has(enemy)) return true;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestSq) {
        bestSq = d;
        best = enemy;
      }
      return true;
    });
    return best;
  }

  private drawBolt(x1: number, y1: number, x2: number, y2: number): void {
    const g = this.ctx.scene.add.graphics().setDepth(46);
    g.lineStyle(2, COLORS.shield, 0.9);
    g.lineBetween(x1, y1, x2, y2);
    this.ctx.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 140,
      onComplete: () => g.destroy(),
    });
  }
}
