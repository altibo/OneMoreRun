import Phaser from 'phaser';
import { COLORS } from '../config/balance';

const STICK_RADIUS = 70;
const STICK_DEADZONE = 6;

/**
 * Vereinheitlicht Eingaben: Tastatur (WASD/Pfeile) auf Desktop und virtueller
 * Stick per Touch/Maus auf Mobilgeräten. Liefert einen normalisierten
 * Richtungsvektor. Keine komplizierten Gesten.
 */
export class InputManager {
  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private pointerId: number | null = null;
  private base = new Phaser.Math.Vector2();
  private current = new Phaser.Math.Vector2();
  private stickBase?: Phaser.GameObjects.Arc;
  private stickThumb?: Phaser.GameObjects.Arc;
  private dir = new Phaser.Math.Vector2();
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const kb = scene.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys(
        'W,A,S,D,UP,LEFT,DOWN,RIGHT',
      ) as Record<string, Phaser.Input.Keyboard.Key>;
    }

    this.stickBase = scene.add
      .circle(0, 0, STICK_RADIUS, COLORS.text, 0.08)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
    this.stickThumb = scene.add
      .circle(0, 0, STICK_RADIUS * 0.45, COLORS.player, 0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
  }

  /** Normalisierter Richtungsvektor (Länge 0..1). */
  getDirection(): Phaser.Math.Vector2 {
    this.dir.set(0, 0);

    if (!this.enabled) return this.dir;

    if (this.isDown('A', 'LEFT')) this.dir.x -= 1;
    if (this.isDown('D', 'RIGHT')) this.dir.x += 1;
    if (this.isDown('W', 'UP')) this.dir.y -= 1;
    if (this.isDown('S', 'DOWN')) this.dir.y += 1;

    if (this.dir.lengthSq() > 0) {
      return this.dir.normalize();
    }

    if (this.pointerId !== null) {
      const offset = this.current.clone().subtract(this.base);
      if (offset.length() > STICK_DEADZONE) {
        return this.dir.copy(offset).limit(STICK_RADIUS).scale(1 / STICK_RADIUS);
      }
    }
    return this.dir.set(0, 0);
  }

  /** Aktiviert/deaktiviert die Eingabe (z. B. während der Upgrade-Auswahl). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pointerId = null;
      this.stickBase?.setVisible(false);
      this.stickThumb?.setVisible(false);
    }
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.stickBase?.destroy();
    this.stickThumb?.destroy();
  }

  private isDown(...names: string[]): boolean {
    return names.some((n) => this.keys[n]?.isDown);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.base.set(pointer.x, pointer.y);
    this.current.set(pointer.x, pointer.y);
    this.stickBase?.setPosition(pointer.x, pointer.y).setVisible(true);
    this.stickThumb?.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.current.set(pointer.x, pointer.y);
    const offset = this.current.clone().subtract(this.base).limit(STICK_RADIUS);
    this.stickThumb?.setPosition(this.base.x + offset.x, this.base.y + offset.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.stickBase?.setVisible(false);
    this.stickThumb?.setVisible(false);
  }
}
