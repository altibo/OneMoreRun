import Phaser from 'phaser';
import { VIEW } from '../config/balance';

/**
 * Lädt echte Pixel-Art-Sprites (CC0, "0x72 DungeonTileset II") und erzeugt
 * kleinere Effekt-/Item-Texturen prozedural. Sprite-Atlanten werden in preload()
 * geladen, alles Übrige in create() gebaut.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // Kurzer Ladehinweis.
    this.add
      .text(VIEW.width / 2, VIEW.height / 2, 'ONE MORE RUN', {
        fontFamily: 'system-ui',
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Echte animierte Charakter-Sprites (Texture-Packer-Atlanten).
    this.load.atlas('fauna', 'assets/sprites/fauna.png', 'assets/sprites/fauna.json');
    this.load.atlas('lizard', 'assets/sprites/lizard.png', 'assets/sprites/lizard.json');
  }

  create(): void {
    // Effekt-/Item-Texturen prozedural (klein, lizenzfrei).
    this.makeDisc('disc', 64);
    this.makeSpark('spark', 16);
    this.makeRing('ring', 64);
    this.makeGlowDisc('gem', 26); // XP: weiche Scheibe, fadet nach außen (per Tint blau)
    this.makeCoin('coin');
    this.makeStar('bullet', 4, 28, 11, 0); // funkelnder Schuss
    this.makeSpikeShard('spike'); // Stachel/Dorn

    this.createAnimations();

    this.time.delayedCall(150, () => this.scene.start('Menu'));
  }

  /** Registriert die globalen Charakter-Animationen (Spieler & Gegner). */
  private createAnimations(): void {
    const player = (key: string, prefix: string, end: number, frameRate: number) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNames('fauna', {
          prefix,
          start: 1,
          end,
          suffix: '.png',
        }),
        frameRate,
        repeat: -1,
      });
    };
    // Idle = einzelnes "walk-*-3"-Frame.
    const idle = (key: string, frame: string) => {
      this.anims.create({ key, frames: [{ key: 'fauna', frame }] });
    };
    idle('player-idle-down', 'walk-down-3.png');
    idle('player-idle-side', 'walk-side-3.png');
    idle('player-idle-up', 'walk-up-3.png');
    player('player-run-down', 'run-down-', 8, 14);
    player('player-run-side', 'run-side-', 8, 14);
    player('player-run-up', 'run-up-', 8, 14);

    this.anims.create({
      key: 'enemy-idle',
      frames: this.anims.generateFrameNames('lizard', {
        prefix: 'lizard_m_idle_anim_f',
        start: 0,
        end: 3,
        suffix: '.png',
      }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'enemy-run',
      frames: this.anims.generateFrameNames('lizard', {
        prefix: 'lizard_m_run_anim_f',
        start: 0,
        end: 3,
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    });
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

  /**
   * Weiche, runde Scheibe mit hellem Kern, die nach außen ausfadet (Glow-Look).
   * Weiß gezeichnet, damit der Tint (z. B. Blau für XP) die Farbe bestimmt.
   */
  private makeGlowDisc(key: string, radius: number): void {
    const c = 32;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Von außen nach innen: viele konzentrische Kreise mit steigender Deckkraft.
    const steps = radius;
    for (let i = steps; i >= 1; i--) {
      const t = i / steps; // 1 (Rand) .. 0 (Mitte)
      const alpha = Math.pow(1 - t, 1.8); // außen ~0, innen ~1
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(c, c, t * radius);
    }
    // Heller Kern.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c, radius * 0.32);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  /** Stern (z. B. Boss / Schuss) mit äußerem/innerem Radius. */
  private makeStar(
    key: string,
    points: number,
    outer: number,
    inner: number,
    rotation: number,
  ): void {
    const c = 32;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = rotation + (i / (points * 2)) * Math.PI * 2;
      pts.push({ x: c + Math.cos(a) * r, y: c + Math.sin(a) * r });
    }
    this.renderShape(key, pts, c, outer);
  }

  /** Münze: Scheibe mit dunklerem Innenring und Glanzpunkt. */
  private makeCoin(key: string): void {
    const c = 32;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xeef2f6, 1);
    g.fillCircle(c, c, 28);
    g.lineStyle(3, 0x000000, 0.35);
    g.strokeCircle(c, c, 28);
    g.lineStyle(3, 0x000000, 0.22);
    g.strokeCircle(c, c, 18);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(c - 8, c - 9, 6);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  /** Schmaler Dorn/Stachel, Spitze oben. */
  private makeSpikeShard(key: string): void {
    const pts = [
      { x: 32, y: 3 },
      { x: 42, y: 40 },
      { x: 32, y: 52 },
      { x: 22, y: 40 },
    ];
    this.renderShape(key, pts, 32, 30);
  }

  /** Füllt ein Polygon weiß/hellgrau, zeichnet dunkle Outline + Glanzpunkt. */
  private renderShape(
    key: string,
    pts: { x: number; y: number }[],
    c: number,
    radius: number,
  ): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe9eef3, 1);
    g.fillPoints(pts, true);
    g.lineStyle(3, 0x000000, 0.38);
    g.strokePoints(pts, true, true);
    // Glanzpunkt oben-links für plastischeren Look.
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(c - radius * 0.28, c - radius * 0.32, radius * 0.24);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }
}
