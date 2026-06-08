import Phaser from 'phaser';

/**
 * Zentraler Event-Bus zur losen Kopplung der Systeme. Singleton, damit Szenen
 * und Systeme über denselben Emitter kommunizieren.
 */
export const EventBus = new Phaser.Events.EventEmitter();

/** Typsichere Event-Namen, um Tippfehler zu vermeiden. */
export const GameEvents = {
  EnemyKilled: 'enemy:killed',
  XpCollected: 'xp:collected',
  LevelUp: 'level:up',
  UpgradeOffered: 'upgrade:offered',
  UpgradeChosen: 'upgrade:chosen',
  SynergyUnlocked: 'synergy:unlocked',
  PlayerDamaged: 'player:damaged',
  PlayerDied: 'player:died',
  BossWarning: 'boss:warning',
  BossSpawned: 'boss:spawned',
  BossKilled: 'boss:killed',
  CoinCollected: 'coin:collected',
  RunEnded: 'run:ended',
} as const;
