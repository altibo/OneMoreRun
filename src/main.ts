import Phaser from 'phaser';
import { COLORS, VIEW } from './config/balance';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { EndScene } from './scenes/EndScene';
import { UpgradesScene } from './scenes/UpgradesScene';
import { CollectionScene } from './scenes/CollectionScene';
import { SettingsScene } from './scenes/SettingsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: Phaser.Display.Color.IntegerToColor(COLORS.background).rgba,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW.width,
    height: VIEW.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    LevelUpScene,
    EndScene,
    UpgradesScene,
    CollectionScene,
    SettingsScene,
  ],
};

new Phaser.Game(config);
