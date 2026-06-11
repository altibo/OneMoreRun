import Phaser from 'phaser';
import { VIEW } from '../config/balance';
import { Button } from '../ui/Button';
import type { PlayerStats } from '../types';

export interface PauseData {
  stats: PlayerStats;
  level: number;
  build: string[];
  onResume: () => void;
  onQuit: () => void;
}

/**
 * Pause overlay. Freezes the run and shows the current stats & build so the
 * player can review their power between fights.
 */
export class PauseScene extends Phaser.Scene {
  private onResume: () => void = () => {};
  private onQuit: () => void = () => {};

  constructor() {
    super('Pause');
  }

  create(data: PauseData): void {
    this.onResume = data.onResume;
    this.onQuit = data.onQuit;
    const cx = VIEW.width / 2;

    this.add
      .rectangle(0, 0, VIEW.width, VIEW.height, 0x05060a, 0.82)
      .setOrigin(0, 0)
      .setInteractive();

    this.add
      .text(cx, 56, 'PAUSED', {
        fontFamily: 'system-ui',
        fontSize: '44px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 96, `Level ${data.level}`, {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: '#46e8a0',
      })
      .setOrigin(0.5);

    this.renderStats(data.stats, cx);
    this.renderBuild(data.build, cx);

    new Button(
      this,
      cx - 145,
      VIEW.height - 54,
      'RESUME',
      { width: 250, height: 54, fontSize: 22 },
      () => this.resume(),
    );
    new Button(
      this,
      cx + 145,
      VIEW.height - 54,
      'QUIT',
      { width: 250, height: 54, fontSize: 22, fill: 0x4a1822, textColor: '#ffffff' },
      () => this.quit(),
    );
  }

  private renderStats(s: PlayerStats, cx: number): void {
    const rows: [string, string][] = [
      ['Max HP', `${Math.round(s.maxHp)}`],
      ['Damage', `${Math.round(s.damage)}`],
      ['Attack Speed', `${s.attacksPerSec.toFixed(2)}/s`],
      ['Projectiles', `${s.projectileCount}`],
      ['Pierce', `${s.pierce}`],
      ['Crit Chance', `${Math.round(s.critChance * 100)}%`],
      ['Crit Damage', `x${s.critMultiplier.toFixed(1)}`],
      ['Move Speed', `${Math.round(s.moveSpeed)}`],
      ['Armor', `${Math.round(s.armor * 100)}%`],
      ['HP Regen', `${s.hpRegenPerSec.toFixed(1)}/s`],
      ['Lifesteal', `${s.lifestealPerKill}/kill`],
      ['Pickup Range', `${Math.round(s.pickupRange)}`],
    ];

    const colW = 230;
    const startX = cx - colW;
    const startY = 140;
    const rowH = 26;
    const perCol = Math.ceil(rows.length / 2);

    rows.forEach((row, i) => {
      const col = Math.floor(i / perCol);
      const line = i % perCol;
      const x = startX + col * (colW + 12);
      const y = startY + line * rowH;
      this.add
        .text(x, y, row[0], { fontFamily: 'system-ui', fontSize: '15px', color: '#9fb0c0' })
        .setOrigin(0, 0.5);
      this.add
        .text(x + colW - 16, y, row[1], {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);
    });
  }

  private renderBuild(build: string[], cx: number): void {
    const titleY = 302;
    this.add
      .text(cx, titleY, 'BUILD', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: '#6a7b8c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (build.length === 0) {
      this.add
        .text(cx, titleY + 28, 'No upgrades yet.', {
          fontFamily: 'system-ui',
          fontSize: '14px',
          color: '#9fb0c0',
        })
        .setOrigin(0.5, 0);
      return;
    }
    const visible = build.slice(0, 7);
    const extra = build.length - visible.length;
    const lines = visible.map((entry) => `- ${entry}`);
    if (extra > 0) lines.push(`- +${extra} more effects`);
    this.add
      .text(cx, titleY + 26, lines.join('\n'), {
        fontFamily: 'system-ui',
        fontSize: '13px',
        color: '#c9d4df',
        align: 'left',
        lineSpacing: 5,
        wordWrap: { width: VIEW.width - 140 },
      })
      .setOrigin(0.5, 0);
  }

  private resume(): void {
    this.onResume();
    this.scene.stop();
  }

  private quit(): void {
    this.onQuit();
  }
}
