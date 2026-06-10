import Phaser from 'phaser';
import { COLORS, VIEW } from './config/balance';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { PauseScene } from './scenes/PauseScene';
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
    expandParent: true,
    autoRound: true,
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
    PauseScene,
    EndScene,
    UpgradesScene,
    CollectionScene,
    SettingsScene,
  ],
};

const game = new Phaser.Game(config);

/**
 * Auf Touch-Geräten (Handy/Tablet) beim ersten Tipp echtes Vollbild anfordern,
 * damit die Browser-Adressleiste verschwindet und das Spiel den ganzen Schirm
 * füllt. Die Fullscreen-API verlangt eine Nutzer-Geste, daher der Listener.
 */
function enableMobileFullscreen(): void {
  const isTouch =
    'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  if (!isTouch) return;

  const tryFullscreen = (): void => {
    try {
      if (!game.scale.isFullscreen) {
        game.scale.startFullscreen();
      }
    } catch {
      /* Vom Browser blockiert – ignorieren. */
    }
  };

  window.addEventListener('pointerdown', tryFullscreen, { once: true });
  window.addEventListener('touchend', tryFullscreen, { once: true });
}

enableMobileFullscreen();