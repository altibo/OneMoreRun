import Phaser from 'phaser';
import { COLORS } from '../config/balance';

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
  private slowUntil = 0;
  private slowFactor = 1;
  private baseColor = 0xffffff;
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
    this.slowUntil = 0;
    this.slowFactor = 1;

    this.baseColor = cfg.color;
    this.setTexture('lizard', 'lizard_m_idle_anim_f0.png');
    this.setTint(cfg.color);
    this.anims.play('enemy-run', true);
    this.setActive(true).setVisible(true);
    this.setAlpha(1);
    this.setDepth(cfg.isBoss ? 40 : 30);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    // lizard-Quellframe ist 16 px breit -> auf Wunschdurchmesser skalieren.
    const srcW = 16;
    const scale = (cfg.radius * 2) / srcW;
    this.setScale(scale);
    body.setSize(srcW, srcW, true);


    if (cfg.isBoss) {
      this.createBossBar();
    }
  }

  trackToward(px: number, py: number): void {
    const angle = Math.atan2(py - this.y, px - this.x);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const mult = this.scene.time.now < this.slowUntil ? this.slowFactor : 1;
    body.setVelocity(Math.cos(angle) * this.speed * mult, Math.sin(angle) * this.speed * mult);
    // Mirror facing based on horizontal movement.
    if (Math.abs(body.velocity.x) > 2) this.setFlipX(body.velocity.x < 0);
  }

  /** Chills the enemy: slows movement for a while. factor < 1 (e.g. 0.5). */
  applySlow(factor: number, durationMs: number, time: number): void {
    if (time >= this.slowUntil) this.slowFactor = 1; // previous slow expired
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowUntil = time + durationMs;
  }

  /** Restores the enemy's base tint (after a flash/chill effect). */
  restoreTint(): void {
    if (this.active) this.setTint(this.baseColor);
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
      if (this.active) this.setTint(this.baseColor);
    });
  }

  /** Fügt Schaden zu. Gibt true zurück, wenn der Gegner dadurch stirbt. */
  damage(amount: number, flash = true): boolean {
    this.hp -= amount;
    if (flash && this.active) {
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(50, () => {
        if (this.active) this.setTint(this.baseColor);
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
