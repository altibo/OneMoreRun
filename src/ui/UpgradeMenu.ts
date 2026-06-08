import Phaser from 'phaser';
import { VIEW } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import type { Rarity, UpgradeDef } from '../config/upgrades';

const RARITY_COLOR: Record<Rarity, number> = {
  common: 0x6a7b8c,
  rare: 0x4bb3ff,
  epic: 0xffb14b,
};

/** Level-Up Upgrade-Auswahl: drei große Karten, eine Entscheidung. */
export class UpgradeMenu {
  private container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    choices: UpgradeDef[],
    onChoose: (id: string) => void,
  ) {
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1500);

    const overlay = scene.add
      .rectangle(0, 0, VIEW.width, VIEW.height, 0x05060a, 0.78)
      .setOrigin(0, 0)
      .setInteractive();
    const title = scene.add
      .text(VIEW.width / 2, 70, 'LEVEL UP', {
        fontFamily: 'system-ui',
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const subtitle = scene.add
      .text(VIEW.width / 2, 108, 'Wähle ein Upgrade', {
        fontFamily: 'system-ui',
        fontSize: '15px',
        color: '#9fb0c0',
      })
      .setOrigin(0.5);
    this.container.add([overlay, title, subtitle]);

    const cardW = 240;
    const cardH = 260;
    const gap = 28;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (VIEW.width - totalW) / 2 + cardW / 2;
    const cy = VIEW.height / 2 + 30;

    choices.forEach((def, i) => {
      const cx = startX + i * (cardW + gap);
      const card = this.buildCard(scene, def, cardW, cardH, () => {
        AudioManager.play('levelup');
        onChoose(def.id);
        this.destroy();
      });
      card.setPosition(cx, cy);
      this.container.add(card);

      // Kleine Einflug-Animation für Lebendigkeit.
      card.setScale(0.6);
      card.setAlpha(0);
      scene.tweens.add({
        targets: card,
        scale: 1,
        alpha: 1,
        delay: i * 60,
        duration: 220,
        ease: 'Back.easeOut',
      });
    });
  }

  private buildCard(
    scene: Phaser.Scene,
    def: UpgradeDef,
    w: number,
    h: number,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const card = scene.add.container(0, 0);
    const accent = RARITY_COLOR[def.rarity];

    const bg = scene.add.rectangle(0, 0, w, h, 0x161620).setStrokeStyle(3, accent);
    const stripe = scene.add.rectangle(0, -h / 2 + 6, w, 12, accent).setOrigin(0.5);
    const rarity = scene.add
      .text(0, -h / 2 + 30, def.rarity.toUpperCase(), {
        fontFamily: 'system-ui',
        fontSize: '12px',
        color: '#9fb0c0',
      })
      .setOrigin(0.5);
    const name = scene.add
      .text(0, -40, def.name, {
        fontFamily: 'system-ui',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 30 },
      })
      .setOrigin(0.5);
    const desc = scene.add
      .text(0, 40, def.desc, {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: '#c9d4df',
        align: 'center',
        wordWrap: { width: w - 30 },
      })
      .setOrigin(0.5);

    card.add([bg, stripe, rarity, name, desc]);
    card.setSize(w, h);
    card.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    card.on('pointerover', () => {
      bg.setFillStyle(0x1f1f2e);
      card.setScale(1.04);
    });
    card.on('pointerout', () => {
      bg.setFillStyle(0x161620);
      card.setScale(1);
    });
    card.on('pointerup', onClick);
    return card;
  }

  destroy(): void {
    this.container.destroy();
  }
}
