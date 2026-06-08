import Phaser from 'phaser';
import { COLORS } from '../config/balance';
import { TEX } from './Player';

/** Auto-Attack-Projektil. Bewegung über Physik-Velocity, Treffer im CombatSystem. */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  isCrit = false;
  pierceLeft = 0;
  private dieAt = 0;

  fire(opts: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    radius: number;
    damage: number;
    isCrit: boolean;
    pierce: number;
    lifetimeMs: number;
    time: number;
  }): void {
    this.damage = opts.damage;
    this.isCrit = opts.isCrit;
    this.pierceLeft = opts.pierce;
    this.dieAt = opts.time + opts.lifetimeMs;

    this.setTexture(TEX.disc);
    this.setTint(opts.isCrit ? COLORS.coin : COLORS.projectile);
    this.setActive(true).setVisible(true);
    this.setDepth(45);
    this.setPosition(opts.x, opts.y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    const texSize = 64;
    this.setDisplaySize(opts.radius * 2, opts.radius * 2);
    const scale = texSize / (opts.radius * 2);
    body.setCircle(opts.radius * scale, 0, 0);
    body.setVelocity(Math.cos(opts.angle) * opts.speed, Math.sin(opts.angle) * opts.speed);
  }

  isExpired(time: number): boolean {
    return time >= this.dieAt;
  }

  deactivate(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    this.setActive(false).setVisible(false);
  }
}
