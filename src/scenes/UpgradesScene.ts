import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/balance';
import { META_UPGRADES, metaCost } from '../config/metaUpgrades';
import { AudioManager } from '../managers/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { Button } from '../ui/Button';

/** Meta-Progression Shop: permanente Upgrades, mit Coins bezahlt. */
export class UpgradesScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Upgrades');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add
      .text(VIEW.width / 2, 36, 'META UPGRADES', {
        fontFamily: 'system-ui',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(VIEW.width / 2, 70, '', {
        fontFamily: 'system-ui',
        fontSize: '18px',
        color: '#ffd166',
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

    this.refresh();
  }

  private refresh(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];

    const save = SaveManager.get();
    this.coinText.setText(`◆ ${save.meta.coins}`);

    const startY = 110;
    const rowH = 62;

    META_UPGRADES.forEach((def, i) => {
      const y = startY + i * rowH;
      const level = save.meta.upgrades[def.id] ?? 0;
      const maxed = level >= def.maxLevel;
      const cost = metaCost(def, level);
      const affordable = !maxed && save.meta.coins >= cost;

      const bg = this.add
        .rectangle(VIEW.width / 2, y, VIEW.width - 80, rowH - 10, 0x161620)
        .setStrokeStyle(1, 0x2a2a38);
      const name = this.add
        .text(70, y - 12, def.name, {
          fontFamily: 'system-ui',
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
      const desc = this.add
        .text(70, y + 10, def.desc, {
          fontFamily: 'system-ui',
          fontSize: '13px',
          color: '#9fb0c0',
        })
        .setOrigin(0, 0.5);
      const lvl = this.add
        .text(VIEW.width - 230, y, `Lv ${level}/${def.maxLevel}`, {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#c9d4df',
        })
        .setOrigin(0.5);

      this.rows.push(bg, name, desc, lvl);

      const label = maxed ? 'MAX' : `◆ ${cost}`;
      const buy = new Button(
        this,
        VIEW.width - 110,
        y,
        label,
        { width: 130, height: 40, fontSize: 16 },
        () => this.buy(def.id),
      );
      buy.setEnabledState(affordable);
      this.rows.push(buy);
    });
  }

  private buy(id: string): void {
    const def = META_UPGRADES.find((d) => d.id === id);
    if (!def) return;
    const save = SaveManager.get();
    const level = save.meta.upgrades[id] ?? 0;
    if (level >= def.maxLevel) return;
    const cost = metaCost(def, level);
    if (save.meta.coins < cost) return;

    SaveManager.update((d) => {
      d.meta.coins -= cost;
      d.meta.upgrades[id] = level + 1;
    });
    AudioManager.play('coin');
    this.refresh();
  }
}
