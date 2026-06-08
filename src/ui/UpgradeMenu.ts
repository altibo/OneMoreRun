import Phaser from 'phaser';
import { VIEW } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import type { Rarity, UpgradeDef } from '../config/upgrades';

const RARITY_COLOR: Record<Rarity, number> = {
  common: 0x6a7b8c,
  rare: 0x4bb3ff,
  epic: 0xffb14b,
};

/** Sperrzeit nach dem Öffnen, damit ein gehaltener Steuer-Pointer nicht sofort wählt. */
const INPUT_GRACE_MS = 320;

const CARD_W = 240;
const CARD_H = 260;
const CARD_GAP = 28;

/**
 * Level-Up Upgrade-Auswahl: drei große Karten, eine Entscheidung.
 *
 * Wichtig gegen Fehlklicks/Versatz:
 * - Keine verschachtelten Container (nested Container-Hitboxen sind versetzt) —
 *   die Hit-Area sitzt direkt auf dem Karten-Rechteck.
 * - Eine Karte wird nur ausgewählt, wenn pointerdown UND pointerup auf derselben
 *   Karte stattfinden ("arming"). Ein bereits gehaltener Bewegungs-Pointer löst
 *   kein neues pointerdown aus und kann daher nicht versehentlich wählen.
 * - Zusätzliche Sperrzeit (INPUT_GRACE_MS) direkt nach dem Öffnen.
 */
export class UpgradeMenu {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private armed: Phaser.GameObjects.Rectangle | null = null;
  private readyAt: number;
  private done = false;

  constructor(
    scene: Phaser.Scene,
    choices: UpgradeDef[],
    onChoose: (id: string) => void,
  ) {
    this.scene = scene;
    this.readyAt = scene.time.now + INPUT_GRACE_MS;

    const overlay = scene.add
      .rectangle(0, 0, VIEW.width, VIEW.height, 0x05060a, 0.78)
      .setOrigin(0, 0)
      .setDepth(1500)
      .setInteractive();
    // Klick neben die Karten entwaffnet eine evtl. vorgemerkte Karte.
    overlay.on('pointerdown', () => (this.armed = null));
    this.objects.push(overlay);

    this.addText(VIEW.width / 2, 70, 'LEVEL UP', 36, '#ffffff', true);
    this.addText(VIEW.width / 2, 108, 'Wähle ein Upgrade', 15, '#9fb0c0');

    const totalW = choices.length * CARD_W + (choices.length - 1) * CARD_GAP;
    const startX = (VIEW.width - totalW) / 2 + CARD_W / 2;
    const cy = VIEW.height / 2 + 30;

    choices.forEach((def, i) => {
      const cx = startX + i * (CARD_W + CARD_GAP);
      this.buildCard(def, cx, cy, i, onChoose);
    });
  }

  private buildCard(
    def: UpgradeDef,
    cx: number,
    cy: number,
    index: number,
    onChoose: (id: string) => void,
  ): void {
    const scene = this.scene;
    const accent = RARITY_COLOR[def.rarity];
    const depth = 1501;

    const bg = scene.add
      .rectangle(cx, cy, CARD_W, CARD_H, 0x161620)
      .setStrokeStyle(3, accent)
      .setDepth(depth);
    const stripe = scene.add
      .rectangle(cx, cy - CARD_H / 2 + 6, CARD_W, 12, accent)
      .setDepth(depth + 1);
    const rarity = this.addText(cx, cy - CARD_H / 2 + 30, def.rarity.toUpperCase(), 12, '#9fb0c0');
    const name = this.addText(cx, cy - 40, def.name, 22, '#ffffff', true);
    name.setWordWrapWidth(CARD_W - 30);
    const desc = this.addText(cx, cy + 40, def.desc, 16, '#c9d4df');
    desc.setWordWrapWidth(CARD_W - 30);

    this.objects.push(bg, stripe, rarity, name, desc);

    const all: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [
      bg,
      stripe,
      rarity,
      name,
      desc,
    ];
    const setScaleAll = (s: number) => all.forEach((o) => o.setScale(s));
    const setHover = (on: boolean) => {
      bg.setFillStyle(on ? 0x1f1f2e : 0x161620);
      setScaleAll(on ? 1.04 : 1);
    };

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => setHover(true));
    bg.on('pointerout', () => {
      setHover(false);
      if (this.armed === bg) this.armed = null;
    });
    bg.on('pointerdown', () => {
      if (scene.time.now < this.readyAt) return;
      this.armed = bg;
      setScaleAll(0.98);
    });
    bg.on('pointerup', () => {
      if (this.done || scene.time.now < this.readyAt) return;
      if (this.armed !== bg) return; // nur wählen, wenn auf dieser Karte "geladen"
      this.done = true;
      AudioManager.play('levelup');
      onChoose(def.id);
      this.destroy();
    });

    // Einflug-Animation (rein visuell; Auswahl ist bis readyAt ohnehin gesperrt).
    all.forEach((o) => o.setAlpha(0));
    bg.setScale(0.6);
    scene.tweens.add({ targets: all, alpha: 1, delay: index * 60, duration: 200 });
    scene.tweens.add({
      targets: all,
      scale: 1,
      delay: index * 60,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  private addText(
    x: number,
    y: number,
    text: string,
    size: number,
    color: string,
    bold = false,
  ): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui',
        fontSize: `${size}px`,
        color,
        fontStyle: bold ? 'bold' : 'normal',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1502);
    this.objects.push(t);
    return t;
  }

  destroy(): void {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
  }
}
