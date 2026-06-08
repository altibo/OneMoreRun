import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { Button } from '../ui/Button';

/** Einstellungen: Lautstärke, Mute, Save zurücksetzen. */
export class SettingsScene extends Phaser.Scene {
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Button;

  constructor() {
    super('Settings');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const cx = VIEW.width / 2;

    this.add
      .text(cx, 36, 'SETTINGS', {
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

    // Lautstärke.
    this.add
      .text(cx, 130, 'Volume', { fontFamily: 'system-ui', fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5);
    this.volumeText = this.add
      .text(cx, 170, '', { fontFamily: 'monospace', fontSize: '22px', color: '#46e8a0' })
      .setOrigin(0.5);

    new Button(this, cx - 90, 170, '−', { width: 56, height: 48, fontSize: 26 }, () =>
      this.changeVolume(-0.1),
    );
    new Button(this, cx + 90, 170, '+', { width: 56, height: 48, fontSize: 26 }, () =>
      this.changeVolume(0.1),
    );

    // Mute.
    this.muteButton = new Button(
      this,
      cx,
      250,
      '',
      { width: 220, height: 50, fontSize: 18, fill: 0x2a2a38, textColor: '#ffffff' },
      () => this.toggleMute(),
    );

    // Reset.
    new Button(
      this,
      cx,
      VIEW.height - 70,
      'RESET PROGRESS',
      { width: 240, height: 48, fontSize: 16, fill: 0x7a2330, textColor: '#ffffff' },
      () => this.resetProgress(),
    );

    this.refresh();
  }

  private changeVolume(delta: number): void {
    const v = Phaser.Math.Clamp(SaveManager.get().settings.volume + delta, 0, 1);
    AudioManager.setVolume(v);
    AudioManager.play('click');
    this.refresh();
  }

  private toggleMute(): void {
    AudioManager.setMuted(!AudioManager.isMuted());
    this.refresh();
  }

  private resetProgress(): void {
    SaveManager.reset();
    AudioManager.play('hurt');
    this.refresh();
  }

  private refresh(): void {
    const settings = SaveManager.get().settings;
    this.volumeText.setText(`${Math.round(settings.volume * 100)}%`);
    this.muteButton.setText(settings.muted ? 'SOUND: OFF' : 'SOUND: ON');
  }
}
