import Phaser from 'phaser';
import { COLORS } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';

export interface ButtonStyle {
  width: number;
  height: number;
  fontSize: number;
  fill?: number;
  textColor?: string;
}

/** Großer, touch-freundlicher Button (keine verschachtelten Menüs). */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: ButtonStyle,
    onClick: () => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.bg = scene.add
      .rectangle(0, 0, style.width, style.height, style.fill ?? COLORS.player)
      .setStrokeStyle(2, 0xffffff, 0.15);
    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: 'system-ui',
        fontSize: `${style.fontSize}px`,
        color: style.textColor ?? '#0e0e12',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add([this.bg, this.label]);
    this.setSize(style.width, style.height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => this.setScale(1.05));
    this.on('pointerout', () => this.setScale(1));
    this.on('pointerdown', () => this.setScale(0.96));
    this.on('pointerup', () => {
      this.setScale(1.05);
      AudioManager.play('click');
      onClick();
    });
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setEnabledState(enabled: boolean): this {
    this.bg.setFillStyle(enabled ? COLORS.player : 0x33333d);
    this.setAlpha(enabled ? 1 : 0.6);
    if (enabled) {
      this.setInteractive({ useHandCursor: true });
    } else {
      this.disableInteractive();
    }
    return this;
  }
}
