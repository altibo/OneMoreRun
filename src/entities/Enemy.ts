import Phaser from 'phaser';
import { COLORS } from '../config/balance';
import { TEX } from './Player';

export interface EnemySpawnConfig {
  hp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xp: number;
  color: number;
  isBoss: boolean;
}

/** Gegner (inkl. Boss). Bewegt sich auf den Spieler zu, fügt Kontaktschaden zu. */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = 1;
  maxHp = 1;
  speed = 0;
  contactDamage = 0;
  xp = 0;
  isBoss = false;

  private poisonUntil = 0;
  private poisonDps = 0;
  private poisonCarry = 0;
  private bossBarBg?: Phaser.GameObjects.Rectangle;
  private bossBar?: Phaser.GameObjects.Rectangle;

  configure(cfg: EnemySpawnConfig): void {
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.contactDamage = cfg.contactDamage;
    this.xp = cfg.xp;
    this.isBoss = cfg.isBoss;
    this.poisonUntil = 0;
    this.poisonDps = 0;
    this.poisonCarry = 0;

    this.setTexture(TEX.disc);
    this.setTint(cfg.color);
    this.setActive(true).setVisible(true);
    this.setAlpha(1);
    this.setDepth(cfg.isBoss ? 40 : 30);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    const texSize = 64;
    this.setDisplaySize(cfg.radius * 2, cfg.radius * 2);
    const scale = texSize / (cfg.radius * 2);
    body.setCircle(cfg.radius * scale, 0, 0);

    if (cfg.isBoss) {
      this.createBossBar();
    }
  }

  trackToward(px: number, py: number): void {
    const angle = Math.atan2(py - this.y, px - this.x);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  tickPoison(time: number, deltaMs: number): boolean {
    if (time < this.poisonUntil && this.poisonDps > 0) {
      this.poisonCarry += (this.poisonDps * deltaMs) / 1000;
      if (this.poisonCarry >= 1) {
        const dmg = Math.floor(this.poisonCarry);
        this.poisonCarry -= dmg;
        return this.damage(dmg, false);
      }
    }
    return false;
  }

  applyPoison(dps: number, durationMs: number, time: number): void {
    this.poisonDps = Math.max(this.poisonDps, dps);
    this.poisonUntil = time + durationMs;
    this.setTint(COLORS.poison);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });
  }

  /** Fügt Schaden zu. Gibt true zurück, wenn der Gegner dadurch stirbt. */
  damage(amount: number, flash = true): boolean {
    this.hp -= amount;
    if (flash && this.active) {
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(50, () => {
        if (this.active) this.clearTint();
      });
    }
    this.updateBossBar();
    return this.hp <= 0;
  }

  private createBossBar(): void {
    const w = 80;
    this.bossBarBg = this.scene.add
      .rectangle(this.x, this.y - 60, w, 8, 0x000000, 0.6)
      .setDepth(60);
    this.bossBar = this.scene.add
      .rectangle(this.x - w / 2, this.y - 60, w, 6, COLORS.boss)
      .setOrigin(0, 0.5)
      .setDepth(61);
  }

  private updateBossBar(): void {
    if (!this.bossBar || !this.bossBarBg) return;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.bossBar.setScale(ratio, 1);
  }

  syncBossBar(): void {
    if (!this.bossBar || !this.bossBarBg) return;
    this.bossBarBg.setPosition(this.x, this.y - 60);
    this.bossBar.setPosition(this.x - 40, this.y - 60);
  }

  kill(): void {
    this.bossBar?.destroy();
    this.bossBarBg?.destroy();
    this.bossBar = undefined;
    this.bossBarBg = undefined;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    this.setActive(false).setVisible(false);
  }
}
