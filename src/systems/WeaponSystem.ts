import Phaser from 'phaser';
import { WEAPON_BASE } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import type { Projectile } from '../entities/Projectile';
import type { Enemy } from '../entities/Enemy';
import type { PlayerStats } from '../types';

/** Automatische Angriffe. Zielt auf den nächsten Gegner, feuert Salven. */
export class WeaponSystem {
  private fireTimer = 0;

  constructor(
    private group: Phaser.Physics.Arcade.Group,
    private stats: PlayerStats,
    private getPlayerPos: () => { x: number; y: number },
    private findNearestEnemy: (x: number, y: number, range: number) => Enemy | null,
    private rng: Phaser.Math.RandomDataGenerator,
  ) {}

  update(deltaMs: number, time: number): void {
    this.fireTimer -= deltaMs;
    if (this.fireTimer > 0) return;

    this.fireTimer = 1000 / this.stats.attacksPerSec;

    const pos = this.getPlayerPos();
    const target = this.findNearestEnemy(pos.x, pos.y, this.stats.range);
    if (!target) return;

    const baseAngle = Math.atan2(target.y - pos.y, target.x - pos.x);
    const count = this.stats.projectileCount;
    const spread = Phaser.Math.DegToRad(WEAPON_BASE.spreadDeg);
    const start = -((count - 1) / 2) * spread;

    for (let i = 0; i < count; i++) {
      this.fireOne(pos.x, pos.y, baseAngle + start + i * spread, time);
    }
    AudioManager.play('shoot');
  }

  private fireOne(x: number, y: number, angle: number, time: number): void {
    const proj = this.group.get() as Projectile | null;
    if (!proj) return;
    const isCrit = this.rng.frac() < this.stats.critChance;
    const damage = isCrit ? this.stats.damage * this.stats.critMultiplier : this.stats.damage;
    proj.fire({
      x,
      y,
      angle,
      speed: this.stats.projectileSpeed,
      radius: this.stats.projectileRadius,
      damage,
      isCrit,
      pierce: this.stats.pierce,
      lifetimeMs: WEAPON_BASE.projectileLifetimeMs,
      time,
    });
  }
}
