import Phaser from 'phaser';
import { BOSS, COLORS, PLAYER_BASE, RUN, WORLD } from '../config/balance';
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
  private kills = 0;
  private coins = 0;
  private bossWarned = false;
  private bossSpawned = false;
  private bossDefeated = false;
  private paused = false;
  private ended = false;

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
      spawnPickup: (x, y, kind, value) => this.spawnPickup(x, y, kind, value),
      floatingText: (x, y, text, color) => this.floatingText(x, y, text, color),
      burst: (x, y, color, count) => this.burst(x, y, color, count),
      addKill: (enemy) => this.onKill(enemy),
      addCoins: (amount) => this.addCoins(amount),
    });
    this.combat.setup();

    this.hud = new HUD(this);

    this.registerEvents();
  }

  update(time: number, delta: number): void {
    if (this.ended || this.paused) return;

    // Run-Start auf den ersten Frame setzen (Scene-Clock ist in create() noch 0).
    if (this.startTime < 0) this.startTime = time;

    const runTimeMs = time - this.startTime;
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

    this.hud.update(this.stats, this.leveling.level, this.leveling.getProgress(), this.coins, runTimeMs);
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.LevelUp, this.onLevelUp, this);
      EventBus.off(GameEvents.PlayerDied, this.onPlayerDied, this);
      this.input2.destroy();
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

  private endRun(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();

    const timeMs = this.time.now - this.startTime;
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
    AudioManager.play(victory ? 'rare' : 'hurt');
    this.cameras.main.fade(600, 5, 6, 10);
    this.time.delayedCall(650, () => this.scene.start('End', { result, victory }));
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

  private spawnPickup(x: number, y: number, kind: PickupKind, value: number): void {
    const pickup = this.pickups.get() as Pickup | null;
    if (pickup) pickup.spawn(x, y, kind, value);
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
        .setScale(Phaser.Math.FloatBetween(0.4, 0.9));
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
    this.kills = 0;
    this.coins = 0;
    this.bossWarned = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.paused = false;
    this.ended = false;
  }
}
