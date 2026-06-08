import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';

/** Initialisiert Save & Skalierung, dann weiter zum Preload. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    SaveManager.load();
    this.scene.start('Preload');
  }
}
