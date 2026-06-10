import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { Button } from '../ui/Button';

/** Hauptmenü: ONE MORE RUN — PLAY, UPGRADES, COLLECTION, SETTINGS. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    AudioManager.init();
    // Audio darf erst nach Nutzergeste starten.
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => AudioManager.startMusic());
    this.input.keyboard?.once('keydown', () => AudioManager.startMusic());

    this.drawBackground();

    this.add
      .text(VIEW.width / 2, 110, 'ONE MORE RUN', {
        fontFamily: 'system-ui',
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(VIEW.width / 2, 156, 'Just one more run …', {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: '#46e8a0',
      })
      .setOrigin(0.5);

    const stats = SaveManager.get().stats;
    this.add
      .text(
        VIEW.width / 2,
        VIEW.height - 24,
        `Runs: ${stats.totalRuns}   ·   Kills: ${stats.totalKills}   ·   Best Lvl: ${stats.highestLevel}`,
        { fontFamily: 'system-ui', fontSize: '13px', color: '#6a7b8c' },
      )
      .setOrigin(0.5);

    const cx = VIEW.width / 2;
    const big = { width: 280, height: 64, fontSize: 26 };
    const small = { width: 180, height: 48, fontSize: 18, fill: 0x2a2a38, textColor: '#ffffff' };

    new Button(this, cx, 250, 'PLAY', big, () => this.scene.start('Game'));
    new Button(this, cx - 96, 330, 'UPGRADES', small, () => this.scene.start('Upgrades'));
    new Button(this, cx + 96, 330, 'COLLECTION', small, () => this.scene.start('Collection'));
    new Button(this, cx, 390, 'SETTINGS', small, () => this.scene.start('Settings'));
  }

  private drawBackground(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const g = this.add.graphics();
    g.lineStyle(1, COLORS.grid, 1);
    const step = 48;
    for (let x = 0; x <= VIEW.width; x += step) g.lineBetween(x, 0, x, VIEW.height);
    for (let y = 0; y <= VIEW.height; y += step) g.lineBetween(0, y, VIEW.width, y);
  }
}
