import Phaser from 'phaser';
import type { UpgradeDef } from '../config/upgrades';
import { UpgradeMenu } from '../ui/UpgradeMenu';

export interface LevelUpData {
  choices: UpgradeDef[];
  onChoose: (id: string) => void;
}

/**
 * Overlay-Szene für die Level-Up-Auswahl. Eigene, nicht gescrollte Kamera —
 * dadurch stimmen Render- und Input-Koordinaten überein (in der gescrollten
 * GameScene wären die Karten-Hitboxen versetzt und nicht klickbar).
 */
export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUp');
  }

  create(data: LevelUpData): void {
    new UpgradeMenu(this, data.choices, (id) => {
      data.onChoose(id);
      this.scene.stop();
    });
  }
}
