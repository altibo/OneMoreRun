import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/balance';
import type { PlayerStats } from '../types';

/** Minimalistisches HUD: HP, XP, Coins, Timer, Level, Build, Boss-Indikator. */
export class HUD {
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private xpBar: Phaser.GameObjects.Rectangle;
  private levelText: Phaser.GameObjects.Text;
  private coinText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private buildText: Phaser.GameObjects.Text;
  private bossText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const pad = 16;
    const depth = 900;

    // XP-Leiste ganz oben über die volle Breite.
    scene.add
      .rectangle(0, 0, VIEW.width, 8, 0x000000, 0.5)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.xpBar = scene.add
      .rectangle(0, 0, VIEW.width, 8, COLORS.xp)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setScale(0, 1);

    // HP-Leiste oben links.
    scene.add
      .rectangle(pad, pad + 4, 220, 20, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.hpBar = scene.add      .rectangle(pad, pad + 4, 220, 20, COLORS.player)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.hpText = scene.add
      .text(pad + 110, pad + 14, '', { fontFamily: 'system-ui', fontSize: '13px', color: '#0e0e12' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.levelText = scene.add
      .text(pad, pad + 32, 'LVL 1', { fontFamily: 'system-ui', fontSize: '16px', color: '#ffffff' })
      .setScrollFactor(0)
      .setDepth(depth);

    // Timer & Coins oben rechts.
    this.timerText = scene.add
      .text(VIEW.width - pad, pad + 4, '0:00', {
        fontFamily: 'system-ui',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.coinText = scene.add
      .text(VIEW.width - pad, pad + 34, '◆ 0', {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: '#ffd166',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    // Build unten links.
    this.buildText = scene.add
      .text(pad, VIEW.height - pad, '', {
        fontFamily: 'system-ui',
        fontSize: '12px',
        color: '#9fb0c0',
        wordWrap: { width: VIEW.width - pad * 2 },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(depth);

    // Boss-Indikator zentriert.
    this.bossText = scene.add
      .text(VIEW.width / 2, 40, '', {
        fontFamily: 'system-ui',
        fontSize: '20px',
        color: '#ff3b7b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setVisible(false);
  }

  update(
    stats: PlayerStats,
    level: number,
    xpProgress: number,
    coins: number,
    timeMs: number,
  ): void {
    const hpRatio = Phaser.Math.Clamp(stats.hp / stats.maxHp, 0, 1);
    this.hpBar.setScale(hpRatio, 1);
    this.hpText.setText(`${Math.ceil(stats.hp)} / ${Math.round(stats.maxHp)}`);
    this.xpBar.setScale(Phaser.Math.Clamp(xpProgress, 0, 1), 1);
    this.levelText.setText(`LVL ${level}`);
    this.coinText.setText(`◆ ${coins}`);
    this.timerText.setText(this.formatTime(timeMs));
  }

  setBuild(build: string[]): void {
    this.buildText.setText(build.join('  ·  '));
  }

  setBossIndicator(text: string | null): void {
    if (text) {
      this.bossText.setText(text).setVisible(true);
    } else {
      this.bossText.setVisible(false);
    }
  }

  private formatTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
