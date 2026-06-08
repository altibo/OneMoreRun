import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../config/achievements';
import { COLORS, VIEW } from '../config/balance';
import { SaveManager } from '../managers/SaveManager';
import { Button } from '../ui/Button';

/** Sammlung: Achievements & Statistiken (Reward Frequency sichtbar machen). */
export class CollectionScene extends Phaser.Scene {
  constructor() {
    super('Collection');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add
      .text(VIEW.width / 2, 36, 'COLLECTION', {
        fontFamily: 'system-ui',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    new Button(
      this,
      80,
      36,
      'BACK',
      { width: 110, height: 36, fontSize: 16, fill: 0x2a2a38, textColor: '#ffffff' },
      () => this.scene.start('Menu'),
    );

    const save = SaveManager.get();
    const unlocked = save.achievements.length;
    this.add
      .text(VIEW.width / 2, 72, `Achievements ${unlocked} / ${ACHIEVEMENTS.length}`, {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: '#46e8a0',
      })
      .setOrigin(0.5);

    const startY = 110;
    const rowH = 46;
    ACHIEVEMENTS.forEach((ach, i) => {
      const y = startY + i * rowH;
      const done = save.achievements.includes(ach.id);
      this.add
        .rectangle(VIEW.width / 2, y, VIEW.width - 80, rowH - 8, done ? 0x18241c : 0x161620)
        .setStrokeStyle(1, done ? COLORS.player : 0x2a2a38);
      this.add
        .text(70, y, done ? '🏆' : '🔒', { fontSize: '18px' })
        .setOrigin(0.5);
      this.add
        .text(100, y - 9, ach.name, {
          fontFamily: 'system-ui',
          fontSize: '16px',
          color: done ? '#ffffff' : '#6a7b8c',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(100, y + 10, ach.desc, {
          fontFamily: 'system-ui',
          fontSize: '12px',
          color: '#9fb0c0',
        })
        .setOrigin(0, 0.5);
    });
  }
}
