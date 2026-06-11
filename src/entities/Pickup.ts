import Phaser from 'phaser';
import { COLORS } from '../config/balance';
import { TEX } from './Player';

export type PickupKind = 'xp' | 'coin';

/** Einsammelbares Objekt (XP-Gem oder Coin). Wird vom Magnet angezogen. */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  kind: PickupKind = 'xp';
  value = 0;
  private magnetized = false;
  private glow?: Phaser.GameObjects.Arc;

  spawn(x: number, y: number, kind: PickupKind, value: number, tint?: number): void {
    this.kind = kind;
    this.value = value;
    this.magnetized = false;
    this.glow?.destroy();
    this.glow = undefined;

    this.setTexture(kind === 'xp' ? TEX.gem : TEX.coin);
    const color = tint ?? (kind === 'xp' ? COLORS.xp : COLORS.coin);
    this.setTint(color);
    this.setActive(true).setVisible(true);
    this.setDepth(22);
    this.setPosition(x, y);
    this.setBlendMode(kind === 'xp' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);

    const radius = kind === 'xp' ? 0.85 : 6;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    const texSize = 64;
    this.setDisplaySize(radius * 2, radius * 2);
    const scale = texSize / (radius * 2);
    body.setCircle(radius * scale, 0, 0);
    body.setVelocity(0, 0);
    body.setBounce(0.25);

    if (kind === 'xp') {
      this.glow = this.scene.add
        .circle(x, y, radius * 2.1, color, 0.16)
        .setDepth(21)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.35,
        scale: 1.35,
        duration: 420,
        yoyo: true,
        repeat: -1,
      });
    }

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
    this.glow?.setPosition(this.x, this.y);
    const dx = px - this.x;
    const dy = py - this.y;
    const distSq = dx * dx + dy * dy;
    if (this.magnetized || distSq < pickupRange * pickupRange) {
      this.magnetized = true;
      const angle = Math.atan2(dy, dx);
      const speed = magnetSpeed * (1 + Phaser.Math.Clamp((pickupRange * pickupRange - distSq) / (pickupRange * pickupRange), 0, 1) * 0.7);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  collect(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    this.glow?.destroy();
    this.glow = undefined;
    this.setActive(false).setVisible(false);
  }
}
