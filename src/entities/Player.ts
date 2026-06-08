import Phaser from 'phaser';
import { COLORS, PLAYER_BASE } from '../config/balance';
import type { PlayerStats } from '../types';
import { EventBus, GameEvents } from '../managers/EventBus';

export const TEX = {
  disc: 'disc',
  ring: 'ring',
  spark: 'spark',
} as const;

/** Der vom Spieler gesteuerte Charakter. Auto-Attack erfolgt im WeaponSystem. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  private invulnUntil = 0;
  private regenCarry = 0;
  shieldActive = false;
  private shieldRing?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, stats: PlayerStats) {
    super(scene, x, y, TEX.disc);
    this.stats = stats;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setTint(COLORS.player);
    this.setCircleBody(PLAYER_BASE.radius);
    this.setDepth(50);
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    this.shieldRing = scene.add
      .circle(x, y, PLAYER_BASE.radius + 10, COLORS.shield, 0.0)
      .setStrokeStyle(3, COLORS.shield, 0.9)
      .setDepth(49)
      .setVisible(false);
  }

  private setCircleBody(radius: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const texSize = 64; // 'disc' Textur ist 64x64
    this.setDisplaySize(radius * 2, radius * 2);
    const scale = texSize / (radius * 2);
    body.setCircle(radius * scale, 0, 0);
  }

  move(dir: Phaser.Math.Vector2): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(dir.x * this.stats.moveSpeed, dir.y * this.stats.moveSpeed);
  }

  tick(deltaMs: number): void {
    if (this.stats.hpRegenPerSec > 0 && this.stats.hp < this.stats.maxHp) {
      this.regenCarry += (this.stats.hpRegenPerSec * deltaMs) / 1000;
      if (this.regenCarry >= 1) {
        const whole = Math.floor(this.regenCarry);
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + whole);
        this.regenCarry -= whole;
      }
    }
    if (this.shieldRing) {
      this.shieldRing.setPosition(this.x, this.y).setVisible(this.shieldActive);
    }
  }

  isInvulnerable(time: number): boolean {
    return this.shieldActive || time < this.invulnUntil;
  }

  takeDamage(amount: number, time: number): void {
    if (this.isInvulnerable(time)) return;
    const reduced = amount * (1 - this.stats.armor);
    this.stats.hp -= reduced;
    this.invulnUntil = time + PLAYER_BASE.invulnMsOnHit;

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.setAlpha(1),
    });
    this.scene.cameras.main.shake(120, 0.006);

    EventBus.emit(GameEvents.PlayerDamaged, { hp: this.stats.hp });
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      EventBus.emit(GameEvents.PlayerDied, {});
    }
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  setShield(active: boolean): void {
    this.shieldActive = active;
  }

  destroy(fromScene?: boolean): void {
    this.shieldRing?.destroy();
    super.destroy(fromScene);
  }
}
