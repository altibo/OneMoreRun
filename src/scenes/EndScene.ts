import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../config/achievements';
import { COLORS, VIEW } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { Button } from '../ui/Button';
import type { RunResult } from '../types';

interface EndData {
  result: RunResult;
  victory: boolean;
  reason?: 'death' | 'time' | 'quit';
}

/** Clear outcome screen: VICTORY when the boss is beaten, GAME OVER on death. */
export class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  create(data: EndData): void {
    const { result, victory } = data;
    const title = victory ? 'CLEARED!' : data.reason === 'time' ? 'TIME OVER' : 'FAILED';
    const subtitle = victory
      ? 'You defeated the boss in time!'
      : data.reason === 'time'
        ? 'The boss was not defeated within 4 minutes.'
        : data.reason === 'quit'
          ? 'Run ended.'
          : 'You did not make it this time.';
    this.cameras.main.setBackgroundColor(COLORS.background);
    if (!victory) this.cameras.main.flash(400, 90, 0, 0);

    const newAchievements = this.evaluateAchievements(result);

    const cx = VIEW.width / 2;
    this.add
      .text(cx, 56, title, {
        fontFamily: 'system-ui',
        fontSize: '52px',
        color: victory ? '#ffd166' : '#ff4b5c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 98, subtitle, {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: victory ? '#9fb0c0' : '#ff8a93',
      })
      .setOrigin(0.5);

    const minutes = Math.floor(result.timeMs / 60000);
    const seconds = Math.floor((result.timeMs % 60000) / 1000);
    const lines = [
      `Survived        ${minutes}:${seconds.toString().padStart(2, '0')}`,
      `Enemies defeated   ${result.kills}`,
      `Coins earned       ${result.coins}`,
      `Level reached      ${result.level}`,
    ];
    this.add
      .text(cx, 158, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#c9d4df',
        align: 'left',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    if (result.build.length > 0) {
      this.add
        .text(cx, 270, `Best Build:  ${result.build.join('  ·  ')}`, {
          fontFamily: 'system-ui',
          fontSize: '13px',
          color: '#9fb0c0',
          align: 'center',
          wordWrap: { width: VIEW.width - 80 },
        })
        .setOrigin(0.5, 0);
    }

    if (newAchievements.length > 0) {
      this.add
        .text(cx, 330, `🏆 New: ${newAchievements.join(', ')}`, {
          fontFamily: 'system-ui',
          fontSize: '14px',
          color: '#ffd166',
          align: 'center',
          wordWrap: { width: VIEW.width - 80 },
        })
        .setOrigin(0.5, 0);
      AudioManager.play('rare');
    }

    new Button(
      this,
      cx,
      VIEW.height - 90,
      'PLAY AGAIN',
      { width: 280, height: 60, fontSize: 24 },
      () => this.scene.start('Game'),
    );
    new Button(
      this,
      cx,
      VIEW.height - 28,
      'MENU',
      { width: 160, height: 38, fontSize: 16, fill: 0x2a2a38, textColor: '#ffffff' },
      () => this.scene.start('Menu'),
    );
  }

  private evaluateAchievements(result: RunResult): string[] {
    const save = SaveManager.get();
    const unlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (save.achievements.includes(ach.id)) continue;
      if (ach.check(result, save)) {
        unlocked.push(ach.name);
        SaveManager.update((d) => d.achievements.push(ach.id));
      }
    }
    return unlocked;
  }
}
