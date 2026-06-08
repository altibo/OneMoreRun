import Phaser from 'phaser';
import { COLORS } from '../config/balance';
import { TEX } from './Player';

export type PickupKind = 'xp' | 'coin';

/** Einsammelbares Objekt (XP-Gem oder Coin). Wird vom Magnet angezogen. */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  kind: PickupKind = 'xp';
  value = 0;
  private magnetized = false;

  spawn(x: number, y: number, kind: PickupKind, value: number): void {
    this.kind = kind;
    this.value = value;
    this.magnetized = false;

    this.setTexture(kind === 'xp' ? TEX.gem : TEX.coin);
    this.setTint(kind === 'xp' ? COLORS.xp : COLORS.coin);
    this.setActive(true).setVisible(true);
    this.setDepth(20);
    this.setPosition(x, y);

    const radius = kind === 'xp' ? 5 : 6;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    const texSize = 64;
    this.setDisplaySize(radius * 2, radius * 2);
    const scale = texSize / (radius * 2);
    body.setCircle(radius * scale, 0, 0);
    body.setVelocity(0, 0);

    // Kleiner Pop beim Spawn.
    this.setScale(0.1);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  updateMagnet(px: number, py: number, pickupRange: number, magnetSpeed: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const distSq = dx * dx + dy * dy;
    if (this.magnetized || distSq < pickupRange * pickupRange) {
      this.magnetized = true;
      const angle = Math.atan2(dy, dx);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * magnetSpeed, Math.sin(angle) * magnetSpeed);
    }
  }

  collect(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    this.setActive(false).setVisible(false);
  }
}
