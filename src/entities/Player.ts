import Phaser from 'phaser';
import { COLORS, PLAYER_BASE } from '../config/balance';
import type { PlayerStats } from '../types';
import { EventBus, GameEvents } from '../managers/EventBus';

export const TEX = {
  disc: 'disc',
  ring: 'ring',
  spark: 'spark',
  gem: 'gem',
  coin: 'coin',
  bullet: 'bullet',
  spike: 'spike',
} as const;

/** Visuelle Skalierung der fauna-Sprites (Quelle 32x32 px). */
const PLAYER_SCALE = 1.5;

/** Der vom Spieler gesteuerte Charakter. Auto-Attack erfolgt im WeaponSystem. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  private invulnUntil = 0;
  private regenCarry = 0;
  shieldActive = false;
  private shieldRing?: Phaser.GameObjects.Arc;
  private facing: 'down' | 'side' | 'up' = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number, stats: PlayerStats) {
    super(scene, x, y, 'fauna', 'walk-down-3.png');
    this.stats = stats;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SCALE);
    this.setBoxBody(PLAYER_BASE.radius);
    this.setDepth(50);
    this.anims.play('player-idle-down');
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    this.shieldRing = scene.add
      .circle(x, y, PLAYER_BASE.radius + 10, COLORS.shield, 0.0)
      .setStrokeStyle(3, COLORS.shield, 0.9)
      .setDepth(49)
      .setVisible(false);
  }

  private setBoxBody(radius: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Body in Quell-Pixeln, damit er nach der Skalierung ~2*radius misst.
    const src = (radius * 2) / PLAYER_SCALE;
    body.setSize(src, src, true);
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
    this.updateAnimation();
  }

  /** Wählt Lauf-/Idle-Animation und Blickrichtung anhand der Geschwindigkeit. */
  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const moving = Math.abs(vx) > 5 || Math.abs(vy) > 5;

    if (moving) {
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.facing = 'side';
        this.setFlipX(vx < 0);
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
        this.setFlipX(false);
      }
      this.anims.play(`player-run-${this.facing}`, true);
    } else {
      this.anims.play(`player-idle-${this.facing}`, true);
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
