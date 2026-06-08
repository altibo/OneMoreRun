import Phaser from 'phaser';
import { VIEW } from '../config/balance';

/**
 * Erzeugt alle Texturen prozedural (kein Asset-Download -> kleiner Build).
 * Minimalistische, geometrische Art Direction.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    this.makeDisc('disc', 64);
    this.makeSpark('spark', 16);
    this.makeRing('ring', 64);

    // Kurzer Ladehinweis (Ziel: < 3 Sek.).
    this.add
      .text(VIEW.width / 2, VIEW.height / 2, 'ONE MORE RUN', {
        fontFamily: 'system-ui',
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.time.delayedCall(150, () => this.scene.start('Menu'));
  }

  private makeDisc(key: string, size: number): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeSpark(key: string, size: number): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeRing(key: string, size: number): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(size / 2, size / 2, size / 2 - 3);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
