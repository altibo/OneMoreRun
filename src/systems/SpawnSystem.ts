import Phaser from 'phaser';
import { SPAWN, VIEW, WORLD } from '../config/balance';
import { BOSS_DEF, ENEMIES, type EnemyDef } from '../config/enemies';
import type { Enemy } from '../entities/Enemy';

/** Erzeugt Gegner gemäß Difficulty Curve: ruhig → chaotisch. */
export class SpawnSystem {
  private spawnTimer = 0;

  constructor(
    private group: Phaser.Physics.Arcade.Group,
    private getPlayerPos: () => { x: number; y: number },
    private rng: Phaser.Math.RandomDataGenerator,
  ) {}

  update(deltaMs: number, runTimeSec: number): void {
    if (this.group.countActive(true) >= SPAWN.maxEnemies) return;

    this.spawnTimer -= deltaMs;
    const interval = Math.max(
      SPAWN.minIntervalMs,
      SPAWN.startIntervalMs - SPAWN.intervalDecayPerSec * runTimeSec,
    );
    if (this.spawnTimer <= 0) {
      this.spawnTimer = interval;
      const count = 1 + Math.floor(runTimeSec / 60); // mit der Zeit mehrere pro Welle
      for (let i = 0; i < count; i++) {
        this.spawnOne(runTimeSec);
      }
    }
  }

  spawnBoss(runTimeSec: number): Enemy | null {
    const enemy = this.group.get() as Enemy | null;
    if (!enemy) return null;
    const pos = this.spawnPosition();
    enemy.setPosition(pos.x, pos.y);
    const hpMult = this.hpMultiplier(runTimeSec);
    enemy.configure({
      hp: Math.round(BOSS_DEF.baseHp * hpMult),
      speed: BOSS_DEF.speed,
      radius: BOSS_DEF.radius,
      contactDamage: BOSS_DEF.contactDamage,
      xp: BOSS_DEF.xp,
      color: BOSS_DEF.color,
      isBoss: true,
    });
    return enemy;
  }

  private spawnOne(runTimeSec: number): void {
    const enemy = this.group.get() as Enemy | null;
    if (!enemy) return;
    const def = this.pickDef(runTimeSec);
    const pos = this.spawnPosition();
    enemy.setPosition(pos.x, pos.y);
    const hpMult = this.hpMultiplier(runTimeSec);
    enemy.configure({
      hp: Math.round(def.baseHp * hpMult),
      speed: def.speed,
      radius: def.radius,
      contactDamage: def.contactDamage,
      xp: def.xp,
      color: def.color,
      isBoss: false,
    });
  }

  private hpMultiplier(runTimeSec: number): number {
    return 1 + Math.floor(runTimeSec / SPAWN.difficultyRampSec) * 0.25;
  }

  private pickDef(runTimeSec: number): EnemyDef {
    const available = ENEMIES.filter((e) => runTimeSec >= e.unlockAtSec);
    const pool = available.length > 0 ? available : [ENEMIES[0]];
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let roll = this.rng.frac() * total;
    for (const e of pool) {
      roll -= e.weight;
      if (roll <= 0) return e;
    }
    return pool[pool.length - 1];
  }

  private spawnPosition(): { x: number; y: number } {
    const player = this.getPlayerPos();
    const radius =
      Math.sqrt(VIEW.width * VIEW.width + VIEW.height * VIEW.height) / 2 +
      SPAWN.spawnMarginPx;
    const angle = this.rng.frac() * Math.PI * 2;
    const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * radius, 10, WORLD.width - 10);
    const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * radius, 10, WORLD.height - 10);
    return { x, y };
  }
}
