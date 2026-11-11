import * as THREE from 'three';
import { Level, TILE } from '../world/Level.js';
import { World3D, toWorld } from '../world/World3D.js';
import { LEVELS } from '../data/levels.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { makeHunter, makeEnemy } from '../three/characters.js';
import { show, toast, banner, popup, updateHud, screen, clearScreen } from '../ui/ui.js';
import { BattleScene } from './BattleScene.js';
import { LevelClearScene } from './LevelClearScene.js';
import { GameOverScene } from './GameOverScene.js';

/**
 * PlatformScene: exploración del nivel en 3D (plataformas de desplazamiento lateral).
 * La lógica usa coordenadas 2D (Player/Enemy/Level) y los modelos 3D se sincronizan cada cuadro.
 * Eventos: monedas, pociones, hogueras, peligros (vacío/agua), enemigos (batalla) y puerta del jefe.
 */
export class PlatformScene {
  constructor(game) {
    this.game = game;
    this.def = LEVELS[game.levelIndex];
    this.level = new Level(this.def);
    this.player = new Player(this.level.startPos.x, this.level.startPos.y, game.hunter);
    this.enemies = this.level.spawns.map((s) => new Enemy(s.kind, s.x, s.y));
    this.respawn = { ...this.level.startPos };
    this.elapsed = 0;
    this.paused = false;
    this.dying = 0;
    this.pendingBattle = null;
    this.medallionNear = false;
    this.medallionPulse = 0;
    this.lockedCooldown = 0;
    this.built = false;
    this.camTarget = new THREE.Vector3();
    game.score.newLevel();
  }

  /** Construye el mundo 3D la primera vez que se entra al nivel. */
  build() {
    const engine = this.game.engine;
    this.world = new World3D(engine, this.level);
    this.heroArmor = this.game.hunter.armor;
    this.hero = makeHunter(this.heroArmor);
    engine.scene.add(this.hero.group);
    this.enemies.forEach((e) => {
      e.actor = makeEnemy(e.kind);
      engine.scene.add(e.actor.group);
      if (e.isBoss) {
        // Aura roja que delata al guardián
        const aura = new THREE.PointLight('#ff3a3a', 4, 5, 1.8);
        aura.position.set(0, 2.2, -1.2);
        e.actor.group.add(aura);
      }
    });
    this.syncActors(0);
    const p = this.hero.group.position;
    engine.camera.position.set(p.x + 1.5, p.y + 2.4, 9.5);
    this.built = true;
    banner(this.level.name, `Región ${this.game.levelIndex + 1} de ${LEVELS.length}`);
  }

  enter() {
    if (!this.built) this.build();
    this.game.audio.playMusic(this.def.music);
    show('hud');
    show('battle', false);
    updateHud(this.game, this.medallionNear);
  }

  exit() {
    show('hud', false);
    clearScreen();
  }

  update(dt) {
    const { input, audio } = this.game;
    if (input.pressed('pause') || input.pressed('back')) {
      this.paused = !this.paused;
      audio.sfx('select');
      if (this.paused) {
        screen(`<div class="screen dim"><h1>Pausa</h1><p class="sub">P / Esc para continuar · M para el sonido</p>
          <p class="sub">${this.game.audio.muted ? 'Sonido apagado' : 'Sonido encendido'}</p></div>`);
      } else clearScreen();
    }
    if (this.paused) return;

    if (this.pendingBattle) {
      this.pendingBattle.t -= dt;
      if (this.pendingBattle.t <= 0) {
        const enemy = this.pendingBattle.enemy;
        this.pendingBattle = null;
        this.game.changeScene(new BattleScene(this.game, this, enemy));
      }
      return;
    }

    if (this.dying > 0) {
      this.dying -= dt;
      if (this.dying <= 0) this.loseLife();
      return;
    }

    this.elapsed += dt;
    this.player.update(dt, input, this.level, audio);
    this.enemies.forEach((e) => { if (!e.removed) e.update(dt, this.level); });
    this.checkCollisions();
    this.updateMedallion(dt);
    updateHud(this.game, this.medallionNear);
  }

  /** Animación visual (cada cuadro): modelos, cámara y mundo. */
  frame(dt) {
    if (!this.built) return;
    this.syncActors(dt);
    const p = this.hero.group.position;
    const cam = this.game.engine.camera;
    const minX = 6;
    const maxX = this.level.cols - 6;
    this.camTarget.set(Math.max(minX, Math.min(maxX, p.x + this.player.facing * 1.6)), Math.max(3.4, p.y + 2.1), 10.5);
    cam.position.lerp(this.camTarget, Math.min(1, dt * 3.2));
    cam.lookAt(cam.position.x, cam.position.y - 0.55, 0);
    this.world.update(dt, p);
  }

  /** Copia la posición lógica de cada entidad a su modelo 3D y elige su animación. */
  syncActors(dt) {
    const pl = this.player;
    // Si cambió la vestimenta, se reemplaza el modelo del cazador
    if (this.heroArmor !== this.game.hunter.armor) {
      this.game.engine.scene.remove(this.hero.group);
      this.heroArmor = this.game.hunter.armor;
      this.hero = makeHunter(this.heroArmor);
      this.game.engine.scene.add(this.hero.group);
    }
    this.hero.group.position.copy(toWorld(pl.cx, pl.bottom));
    this.hero.group.visible = this.dying <= 0 && !(pl.invulnerable > 0 && Math.floor(pl.invulnerable * 12) % 2);
    this.hero.face(pl.facing);
    if (!this.pendingBattle) {
      // Al aterrizar se muestra un instante la animación de caída, salvo que ya esté corriendo
      if (pl.landed) this.landTimer = 0.22;
      this.landTimer = Math.max(0, (this.landTimer || 0) - dt);
      const pose = pl.pose();
      if (this.landTimer > 0 && pose === 'idle') this.hero.play('jumpLand', { loop: false, fade: 0.05 });
      else this.hero.play(pose, { fade: 0.15, loop: pose !== 'jumpStart' });
    }
    this.hero.update(dt);

    for (const e of this.enemies) {
      if (!e.actor) continue;
      e.actor.group.visible = !e.removed;
      if (e.removed) continue;
      e.actor.group.position.copy(toWorld(e.cx, e.bottom));
      e.actor.face(e.dir);
      e.actor.play(e.moving ? 'walk' : 'idle');
      e.actor.update(dt);
    }
  }

  checkCollisions() {
    const { audio, score, hunter } = this.game;
    const engine = this.game.engine;
    const p = this.player;

    this.level.items.forEach((it, i) => {
      if (it.taken || !p.overlaps({ x: it.x - 10, y: it.y - 10, w: 20, h: 20 })) return;
      it.taken = true;
      this.world.takeItem(i);
      const pos = toWorld(it.x, it.y);
      if (it.kind === 'coin') {
        hunter.coins++;
        this.game.stats.coins++;
        popup(engine, `+${score.add('COIN')}`, pos, '#ffe08a');
        audio.sfx('coin');
      } else {
        hunter.potions++;
        popup(engine, `+${score.add('POTION_PICKUP')} Poción`, pos, '#ff9fb2');
        audio.sfx('potion');
      }
    });

    this.level.checkpoints.forEach((cp, i) => {
      if (cp.lit || !p.overlaps({ x: cp.x, y: cp.y, w: TILE, h: TILE })) return;
      cp.lit = true;
      this.world.lightBonfire(i);
      this.respawn = { x: cp.x + 7, y: cp.y + TILE - p.h - 1 };
      hunter.fullHeal();
      popup(engine, `+${score.add('CHECKPOINT')}`, toWorld(cp.x + 16, cp.y - 10), '#ffb04a');
      audio.sfx('checkpoint');
      toast('Hoguera encendida · vida restaurada');
    });

    if (this.level.isWaterAt(p.cx, p.bottom - 4) || p.y > this.level.heightPx + 60) {
      this.dying = 1;
      audio.sfx('death');
      this.world.burst(toWorld(p.cx, Math.min(p.bottom, this.level.heightPx - 40)), '#9fe0d0', 26);
      return;
    }

    if (p.invulnerable <= 0) {
      for (const e of this.enemies) {
        if (!e.removed && e.stunned <= 0 && p.overlaps(e)) { this.startBattle(e); return; }
      }
    }

    const ex = this.level.exit;
    if (ex && p.overlaps(ex)) {
      if (this.level.exitOpen) this.completeLevel();
      else if (this.elapsed > this.lockedCooldown) {
        this.lockedCooldown = this.elapsed + 2;
        audio.sfx('locked');
        toast('La puerta está sellada · vence al guardián');
      }
    }
  }

  updateMedallion(dt) {
    this.medallionNear = this.enemies.some((e) => !e.removed && Math.abs(e.cx - this.player.cx) < 200);
    if (this.medallionNear) {
      this.medallionPulse -= dt;
      if (this.medallionPulse <= 0) { this.game.audio.sfx('medallion'); this.medallionPulse = 0.7; }
    }
  }

  startBattle(enemy) {
    this.game.audio.stopMusic();
    this.game.audio.sfx('battleStart');
    this.pendingBattle = { enemy, t: 0.45 };
    this.player.vx = 0;
    this.hero.play('combat');
  }

  /** Llamado por BattleScene cuando termina el combate. */
  onBattleEnd(result, enemy) {
    const p = this.player;
    if (result === 'win') {
      enemy.removed = true;
      p.invulnerable = 1;
      if (enemy.isBoss) {
        this.level.exitOpen = true;
        this.world.openExit();
        setTimeout(() => toast('¡La puerta se ha abierto!', 2.5), 500);
      }
    } else if (result === 'flee') {
      enemy.stunned = 2;
      p.invulnerable = 2;
      p.x -= p.facing * 50;
    } else if (result === 'lose') {
      this.loseLife(true);
      return;
    }
    this.game.changeScene(this);
  }

  loseLife(fromBattle = false) {
    const g = this.game;
    g.lives--;
    g.stats.deaths++;
    g.score.add('LIFE_LOST');
    if (g.lives <= 0) { g.changeScene(new GameOverScene(g)); return; }
    g.hunter.fullHeal();
    Object.assign(this.player, { x: this.respawn.x, y: this.respawn.y, vx: 0, vy: 0, invulnerable: 2 });
    this.dying = 0;
    toast(`Te quedan ${g.lives} vida${g.lives === 1 ? '' : 's'}`);
    if (fromBattle) g.changeScene(this);
  }

  completeLevel() {
    const g = this.game;
    g.audio.stopMusic();
    g.audio.sfx('clear');
    this.hero.play('cheer');
    g.changeScene(new LevelClearScene(g, this.elapsed, this));
  }
}
