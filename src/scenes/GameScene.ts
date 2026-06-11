import Phaser from 'phaser';
import { BOSS, COLORS, PLAYER_BASE, RUN, VIEW, WORLD } from '../config/balance';
import { AudioManager } from '../managers/AudioManager';
import { EventBus, GameEvents } from '../managers/EventBus';
import { InputManager } from '../managers/InputManager';
import { SaveManager } from '../managers/SaveManager';
import { Enemy } from '../entities/Enemy';
import { Pickup, type PickupKind } from '../entities/Pickup';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { CombatSystem } from '../systems/CombatSystem';
import { LevelingSystem } from '../systems/LevelingSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { createInitialStats } from '../systems/createStats';
import { HUD } from '../ui/HUD';
import type { PlayerStats, RunResult } from '../types';

interface BossBomb {
  sprite: Phaser.Physics.Arcade.Image;
  fuseLeftMs: number;
  pulse?: Phaser.GameObjects.Arc;
}

export class GameScene extends Phaser.Scene {
  private stats!: PlayerStats;
  private rng!: Phaser.Math.RandomDataGenerator;
  private player!: Player;
  private input2!: InputManager;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private leveling!: LevelingSystem;
  private upgrades!: UpgradeSystem;
  private weapon!: WeaponSystem;
  private spawner!: SpawnSystem;
  private combat!: CombatSystem;
  private hud!: HUD;

  private startTime = 0;
  private elapsedRunMs = 0;
  private kills = 0;
  private coins = 0;
  private bossWarned = false;
  private bossSpawned = false;
  private bossDefeated = false;
  private paused = false;
  private ended = false;
  private bossBombTimer: number = BOSS.bombIntervalMs;
  private bossBombs: BossBomb[] = [];

  constructor() {
    super('Game');
  }

  create(): void {
    this.resetState();
    this.stats = createInitialStats();
    this.rng = new Phaser.Math.RandomDataGenerator([`${Date.now()}`]);

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.drawArena();

    this.enemies = this.physics.add.group({ classType: Enemy, defaultKey: 'disc', maxSize: 260 });
    this.projectiles = this.physics.add.group({
      classType: Projectile,
      defaultKey: 'disc',
      maxSize: 400,
    });
    this.pickups = this.physics.add.group({ classType: Pickup, defaultKey: 'disc', maxSize: 600 });

    this.player = new Player(this, WORLD.width / 2, WORLD.height / 2, this.stats);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.input2 = new InputManager(this);
    this.leveling = new LevelingSystem(this.stats);
    this.upgrades = new UpgradeSystem(this.stats);
    this.weapon = new WeaponSystem(
      this.projectiles,
      this.stats,
      () => ({ x: this.player.x, y: this.player.y }),
      (x, y, range) => this.findNearestEnemy(x, y, range),
      this.rng,
    );
    this.spawner = new SpawnSystem(
      this.enemies,
      () => ({ x: this.player.x, y: this.player.y }),
      this.rng,
    );
    this.combat = new CombatSystem({
      scene: this,
      player: this.player,
      stats: this.stats,
      enemies: this.enemies,
      projectiles: this.projectiles,
      pickups: this.pickups,
      leveling: this.leveling,
      spawnPickup: (x, y, kind, value, tint) => this.spawnPickup(x, y, kind, value, tint),
      floatingText: (x, y, text, color) => this.floatingText(x, y, text, color),
      burst: (x, y, color, count) => this.burst(x, y, color, count),
      addKill: (enemy) => this.onKill(enemy),
      addCoins: (amount) => this.addCoins(amount),
    });
    this.combat.setup();

    this.hud = new HUD(this, () => this.openPauseMenu());

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    this.registerEvents();
  }

  update(time: number, delta: number): void {
    if (this.ended || this.paused) return;

    // Run-Start auf den ersten Frame setzen (Scene-Clock ist in create() noch 0).
    if (this.startTime < 0) this.startTime = time;

    this.elapsedRunMs += delta;
    const runTimeMs = this.elapsedRunMs;
    const runTimeSec = runTimeMs / 1000;

    this.player.move(this.input2.getDirection());
    this.player.tick(delta);

    this.enemies.children.iterate((obj) => {
      const enemy = obj as Enemy;
      if (enemy.active) {
        enemy.trackToward(this.player.x, this.player.y);
        if (enemy.isBoss) enemy.syncBossBar();
      }
      return true;
    });

    this.pickups.children.iterate((obj) => {
      const pickup = obj as Pickup;
      if (pickup.active) {
        pickup.updateMagnet(
          this.player.x,
          this.player.y,
          this.stats.pickupRange,
          PLAYER_BASE.magnetSpeed,
        );
      }
      return true;
    });

    this.weapon.update(delta, time);
    this.spawner.update(delta, runTimeSec);
    this.combat.update(delta, time);
    this.handleBoss(runTimeSec);
    this.updateBossBombs(delta);

    const remainingMs = Math.max(0, RUN.targetSessionSec * 1000 - runTimeMs);
    this.hud.update(this.stats, this.leveling.level, this.leveling.getProgress(), this.coins, remainingMs);
    if (!this.bossDefeated && runTimeSec >= RUN.targetSessionSec) {
      this.endRun(false, 'time');
    }
  }

  // --- Boss ---------------------------------------------------------------

  private handleBoss(runTimeSec: number): void {
    if (this.bossDefeated) return;
    if (!this.bossWarned && runTimeSec >= BOSS.spawnAtSec - BOSS.warningSec) {
      this.bossWarned = true;
      this.hud.setBossIndicator('⚠ BOSS INCOMING');
    }
    if (!this.bossSpawned && runTimeSec >= BOSS.spawnAtSec) {
      this.bossSpawned = true;
      const boss = this.spawner.spawnBoss(runTimeSec);
      if (boss) {
        this.bossBombTimer = 900;
        AudioManager.play('boss');
        EventBus.emit(GameEvents.BossSpawned, {});
        this.hud.setBossIndicator('BOSS');
        this.cameras.main.flash(300, 80, 0, 40);
      }
    }
  }

  // --- Event-Wiring -------------------------------------------------------

  private registerEvents(): void {
    EventBus.on(GameEvents.LevelUp, this.onLevelUp, this);
    EventBus.on(GameEvents.PlayerDied, this.onPlayerDied, this);
    EventBus.on(GameEvents.SynergyUnlocked, this.onSynergyUnlocked, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.LevelUp, this.onLevelUp, this);
      EventBus.off(GameEvents.PlayerDied, this.onPlayerDied, this);
      EventBus.off(GameEvents.SynergyUnlocked, this.onSynergyUnlocked, this);
      this.input2.destroy();
    });
  }

  /** Flashy banner when items combine into a special synergy. */
  private onSynergyUnlocked(data: { name: string }): void {
    AudioManager.play('rare');
    this.cameras.main.flash(220, 255, 200, 80);
    const cx = VIEW.width / 2;
    const cy = VIEW.height / 2 - 120;
    const banner = this.add
      .text(cx, cy, `★ ${data.name} ★`, {
        fontFamily: 'system-ui',
        fontSize: '30px',
        color: '#ffd166',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(950)
      .setScale(0.4)
      .setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: banner,
      y: cy - 40,
      alpha: 0,
      delay: 1100,
      duration: 600,
      onComplete: () => banner.destroy(),
    });
  }

  private onLevelUp(): void {
    if (this.ended) return;
    AudioManager.play('levelup');
    this.cameras.main.flash(150, 70, 232, 160);
    this.openUpgradeMenu();
  }

  private onPlayerDied(): void {
    this.endRun(false);
  }

  private openUpgradeMenu(): void {
    this.paused = true;
    this.physics.pause();
    this.input2.setEnabled(false);
    const choices = this.upgrades.offer(3);
    if (choices.length === 0) {
      this.resumeFromUpgrade();
      return;
    }
    this.scene.launch('LevelUp', {
      choices,
      onChoose: (id: string) => {
        this.upgrades.choose(id);
        this.hud.setBuild(this.upgrades.getBuild());
        this.resumeFromUpgrade();
      },
    });
  }

  private resumeFromUpgrade(): void {
    this.physics.resume();
    this.input2.setEnabled(true);
    this.paused = false;
  }

  private openPauseMenu(): void {
    if (this.ended || this.paused) return;
    this.paused = true;
    this.physics.pause();
    this.input2.setEnabled(false);
    this.scene.launch('Pause', {
      stats: this.stats,
      level: this.leveling.level,
      build: this.upgrades.getBuildDetails(),
      onResume: () => this.resumeFromUpgrade(),
      onQuit: () => {
        this.scene.stop('Pause');
        this.endRun(false, 'quit');
      },
    });
  }

  /** Keyboard toggle: opens the pause menu, or closes it if already paused. */
  private togglePause(): void {
    if (this.ended) return;
    if (this.scene.isActive('Pause')) {
      this.scene.stop('Pause');
      this.resumeFromUpgrade();
      return;
    }
    this.openPauseMenu();
  }

  // --- Run-Status ---------------------------------------------------------

  private onKill(enemy: Enemy): void {
    this.kills += 1;
    this.coins += RUN.coinPerKill;
    if (enemy.isBoss) {
      this.bossDefeated = true;
      this.coins += RUN.coinPerBoss;
      this.hud.setBossIndicator(null);
      this.time.delayedCall(800, () => this.endRun(true));
    }
  }

  private addCoins(amount: number): void {
    this.coins += amount;
  }

  private endRun(victory: boolean, reason: 'death' | 'time' | 'quit' = 'death'): void {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();

    const timeMs = this.elapsedRunMs;
    const result: RunResult = {
      timeMs,
      kills: this.kills,
      coins: this.coins,
      level: this.leveling.level,
      build: this.upgrades.getBuild(),
      bossDefeated: this.bossDefeated,
      newUnlocks: [],
      newAchievements: [],
    };

    this.persistRun(result);
    AudioManager.play(victory ? 'rare' : reason === 'time' ? 'boss' : 'hurt');
    this.cameras.main.fade(600, 5, 6, 10);
    this.time.delayedCall(650, () => this.scene.start('End', { result, victory, reason }));
  }

  private persistRun(result: RunResult): void {
    SaveManager.update((d) => {
      d.meta.coins += result.coins;
      d.stats.totalKills += result.kills;
      d.stats.totalRuns += 1;
      d.stats.bestTimeMs = Math.max(d.stats.bestTimeMs, result.timeMs);
      d.stats.highestLevel = Math.max(d.stats.highestLevel, result.level);
    });
  }

  // --- Helpers ------------------------------------------------------------

  private findNearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestSq = range * range;
    this.enemies.children.iterate((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return true;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestSq) {
        bestSq = d;
        best = enemy;
      }
      return true;
    });
    return best;
  }

  private spawnPickup(x: number, y: number, kind: PickupKind, value: number, tint?: number): void {
    const pickup = this.pickups.get() as Pickup | null;
    if (pickup) pickup.spawn(x, y, kind, value, tint);
  }

  private floatingText(x: number, y: number, text: string, color: number): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
      })
      .setOrigin(0.5)
      .setDepth(70);
    this.tweens.add({
      targets: label,
      y: y - 26,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private burst(x: number, y: number, color: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const spark = this.add
        .image(x, y, 'spark')
        .setTint(color)
        .setDepth(48)
        .setScale(Phaser.Math.FloatBetween(0.4, 0.9))
        .setBlendMode(Phaser.BlendModes.ADD);
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 70);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(250, 450),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private updateBossBombs(deltaMs: number): void {
    const boss = this.findBoss();
    if (boss) {
      this.bossBombTimer -= deltaMs;
      if (this.bossBombTimer <= 0) {
        this.bossBombTimer = BOSS.bombIntervalMs;
        this.throwBossBomb(boss);
      }
    }

    for (let i = this.bossBombs.length - 1; i >= 0; i--) {
      const bomb = this.bossBombs[i];
      bomb.fuseLeftMs -= deltaMs;
      const progress = Phaser.Math.Clamp(1 - bomb.fuseLeftMs / BOSS.bombFuseMs, 0, 1);
      bomb.sprite.setScale(0.65 + progress * 0.55);
      bomb.sprite.setAlpha(0.85 + Math.sin(this.time.now / 65) * 0.15);
      bomb.pulse?.setPosition(bomb.sprite.x, bomb.sprite.y).setScale(0.8 + progress * 1.4);
      bomb.pulse?.setAlpha(0.35 * (1 - progress) + 0.1);
      if (bomb.fuseLeftMs <= 0) {
        this.explodeBossBomb(bomb);
        this.bossBombs.splice(i, 1);
      }
    }
  }

  private throwBossBomb(boss: Enemy): void {
    const bomb = this.physics.add.image(boss.x, boss.y, 'gem');
    bomb.setTint(COLORS.boss).setDepth(44).setBlendMode(Phaser.BlendModes.ADD);
    bomb.setDisplaySize(BOSS.bombRadius * 2, BOSS.bombRadius * 2);
    const body = bomb.body as Phaser.Physics.Arcade.Body;
    body.setCircle(32);
    const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
    body.setVelocity(Math.cos(angle) * BOSS.bombSpeed, Math.sin(angle) * BOSS.bombSpeed);
    const pulse = this.add
      .circle(boss.x, boss.y, BOSS.bombExplosionRadius * 0.35, COLORS.boss, 0.16)
      .setStrokeStyle(2, COLORS.boss, 0.55)
      .setDepth(43)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.bossBombs.push({ sprite: bomb, fuseLeftMs: BOSS.bombFuseMs, pulse });
  }

  private explodeBossBomb(bomb: BossBomb): void {
    const x = bomb.sprite.x;
    const y = bomb.sprite.y;
    bomb.pulse?.destroy();
    bomb.sprite.destroy();
    this.burst(x, y, COLORS.boss, 24);
    this.addExplosionRing(x, y, COLORS.boss, BOSS.bombExplosionRadius);
    AudioManager.play('explosion');
    const dx = this.player.x - x;
    const dy = this.player.y - y;
    if (dx * dx + dy * dy <= BOSS.bombExplosionRadius * BOSS.bombExplosionRadius) {
      this.player.takeDamage(BOSS.bombExplosionDamage, this.time.now);
    }
  }

  private addExplosionRing(x: number, y: number, color: number, radius: number): void {
    const ring = this.add
      .circle(x, y, radius * 0.2, color, 0.16)
      .setStrokeStyle(4, color, 0.85)
      .setDepth(47)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      radius,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private findBoss(): Enemy | null {
    let boss: Enemy | null = null;
    this.enemies.children.iterate((obj) => {
      const enemy = obj as Enemy;
      if (enemy.active && enemy.isBoss) boss = enemy;
      return !boss;
    });
    return boss;
  }

  private drawArena(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.background, 1);
    g.fillRect(0, 0, WORLD.width, WORLD.height);
    g.lineStyle(1, COLORS.grid, 1);
    const step = 60;
    for (let x = 0; x <= WORLD.width; x += step) g.lineBetween(x, 0, x, WORLD.height);
    for (let y = 0; y <= WORLD.height; y += step) g.lineBetween(0, y, WORLD.width, y);
    g.lineStyle(3, COLORS.grid, 1);
    g.strokeRect(0, 0, WORLD.width, WORLD.height);
  }

  private resetState(): void {
    this.startTime = -1;
    this.elapsedRunMs = 0;
    this.kills = 0;
    this.coins = 0;
    this.bossWarned = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.paused = false;
    this.ended = false;
    this.bossBombTimer = BOSS.bombIntervalMs;
    this.bossBombs = [];
  }
}
