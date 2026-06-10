import Phaser from 'phaser';
import { VIEW } from '../config/balance';
import { Button } from '../ui/Button';
import type { PlayerStats } from '../types';

export interface PauseData {
  stats: PlayerStats;
  level: number;
  build: string[];
  onResume: () => void;
}

/**
 * Pause overlay. Freezes the run and shows the current stats & build so the
 * player can review their power between fights.
 */
export class PauseScene extends Phaser.Scene {
  private onResume: () => void = () => {};

  constructor() {
    super('Pause');
  }

  create(data: PauseData): void {
    this.onResume = data.onResume;
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
      cx,
      VIEW.height - 60,
      'RESUME',
      { width: 260, height: 56, fontSize: 24 },
      () => this.resume(),
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
    if (build.length === 0) return;
    this.add
      .text(cx, VIEW.height - 160, 'BUILD', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: '#6a7b8c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, VIEW.height - 134, build.join('  ·  '), {
        fontFamily: 'system-ui',
        fontSize: '13px',
        color: '#c9d4df',
        align: 'center',
        wordWrap: { width: VIEW.width - 100 },
      })
      .setOrigin(0.5, 0);
  }

  private resume(): void {
    this.onResume();
    this.scene.stop();
  }
}
