import { W, H } from '../core/Game.js';
import { Level, TILE } from '../world/Level.js';
import { LEVELS } from '../data/levels.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Sprites, drawSprite } from '../gfx/sprites.js';
import { drawBackground, text, hpBar } from '../gfx/draw.js';
import { BattleScene } from './BattleScene.js';
import { LevelClearScene } from './LevelClearScene.js';
import { GameOverScene } from './GameOverScene.js';

/**
 * PlatformScene: exploración del nivel estilo plataformas.
 * Eventos: recoger monedas/pociones, encender hogueras, tocar enemigos (inicia batalla),
 * caer al vacío o al agua (pierde vida) y cruzar la puerta del jefe (fin del nivel).
 */
export class PlatformScene {
  constructor(game) {
    this.game = game;
    this.def = LEVELS[game.levelIndex];
    this.level = new Level(this.def);
    this.player = new Player(this.level.startPos.x, this.level.startPos.y, game.hunter);
    this.enemies = this.level.spawns.map((s) => new Enemy(s.kind, s.x, s.y));
    this.respawn = { ...this.level.startPos };
    this.camX = 0;
    this.time = 0;
    this.elapsed = 0;
    this.floaters = [];   // textos flotantes (+10, etc.)
    this.particles = [];
    this.toast = null;    // mensaje temporal en pantalla
    this.paused = false;
    this.battleFlash = 0;
    this.pendingBattle = null;
    this.dying = 0;
    this.medallionPulse = 0;
    this.lockedCooldown = 0;
    game.score.newLevel();
    this.showToast(this.level.name, 2.5);
  }

  enter() {
    this.game.audio.playMusic(this.def.music);
  }

  showToast(msg, secs = 2) {
    this.toast = { msg, t: secs };
  }

  floatText(str, x, y, color = '#ffd34a') {
    this.floaters.push({ str, x, y, t: 1, color });
  }

  burst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 50;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, t: 0.5 + Math.random() * 0.3, color });
    }
  }

  update(dt) {
    const { input, audio } = this.game;
    this.time += dt;

    if (input.pressed('pause') || input.pressed('back')) {
      this.paused = !this.paused;
      audio.sfx('select');
    }
    if (this.paused) return;

    // Transición de entrada a batalla (destellos)
    if (this.pendingBattle) {
      this.battleFlash -= dt;
      if (this.battleFlash <= 0) {
        const enemy = this.pendingBattle;
        this.pendingBattle = null;
        this.game.changeScene(new BattleScene(this.game, this, enemy), { fast: true });
      }
      return;
    }

    // Animación de muerte (caída al vacío o al agua)
    if (this.dying > 0) {
      this.dying -= dt;
      if (this.dying <= 0) this.loseLife();
      return;
    }

    this.elapsed += dt;
    this.player.update(dt, input, this.level, audio);
    this.enemies.forEach((e) => e.update(dt, this.level));
    this.checkCollisions();
    this.updateMedallion(dt);

    // Cámara que sigue al jugador
    const target = this.player.cx - W / 2 + this.player.facing * 20;
    this.camX += (target - this.camX) * Math.min(1, dt * 6);
    this.camX = Math.max(0, Math.min(this.level.widthPx - W, this.camX));

    this.floaters.forEach((f) => { f.t -= dt; f.y -= 20 * dt; });
    this.floaters = this.floaters.filter((f) => f.t > 0);
    this.particles.forEach((p) => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; });
    this.particles = this.particles.filter((p) => p.t > 0);
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
  }

  /** Detección de colisiones con objetos, peligros, enemigos y la salida. */
  checkCollisions() {
    const { audio, score, hunter } = this.game;
    const p = this.player;

    // Objetos
    for (const it of this.level.items) {
      if (it.taken) continue;
      if (p.overlaps({ x: it.x, y: it.y, w: 8, h: 8 })) {
        it.taken = true;
        if (it.kind === 'coin') {
          hunter.coins++;
          this.game.stats.coins++;
          const pts = score.add('COIN');
          audio.sfx('coin');
          this.floatText(`+${pts}`, it.x, it.y);
          this.burst(it.x + 4, it.y + 4, '#f4c542', 5);
        } else {
          hunter.potions++;
          const pts = score.add('POTION_PICKUP');
          audio.sfx('potion');
          this.floatText(`+${pts} POCIÓN`, it.x - 10, it.y, '#ff8fa3');
        }
      }
    }

    // Hogueras: guardan el punto de reaparición y curan por completo
    for (const cp of this.level.checkpoints) {
      if (!cp.lit && p.overlaps({ x: cp.x, y: cp.y, w: TILE, h: TILE })) {
        cp.lit = true;
        this.respawn = { x: cp.x + 3, y: cp.y };
        hunter.fullHeal();
        const pts = score.add('CHECKPOINT');
        audio.sfx('checkpoint');
        this.floatText(`+${pts}`, cp.x, cp.y - 6);
        this.showToast('Hoguera encendida: vida restaurada', 2);
      }
    }

    // Peligros: agua o caída fuera del mapa
    if (this.level.isWaterAt(p.cx, p.bottom - 2) || p.y > H + 16) {
      this.dying = 0.8;
      audio.sfx('death');
      this.burst(p.cx, Math.min(p.y, H - 8), '#7fb39a', 12);
      return;
    }

    // Enemigos: tocar uno inicia la batalla
    if (p.invulnerable <= 0) {
      for (const e of this.enemies) {
        if (!e.removed && e.stunned <= 0 && p.overlaps(e)) {
          this.startBattle(e);
          return;
        }
      }
    }

    // Salida: solo se abre tras vencer al jefe
    const ex = this.level.exit;
    if (ex && p.overlaps(ex)) {
      if (this.level.exitOpen) {
        this.completeLevel();
      } else if (this.time > this.lockedCooldown) {
        this.lockedCooldown = this.time + 2;
        audio.sfx('locked');
        this.showToast('Puerta sellada: vence al guardián', 2);
      }
    }
  }

  /** El medallón vibra cuando hay un monstruo cerca. */
  updateMedallion(dt) {
    const near = this.enemies.some((e) => !e.removed && Math.abs(e.cx - this.player.cx) < 90);
    this.medallionNear = near;
    if (near) {
      this.medallionPulse -= dt;
      if (this.medallionPulse <= 0) { this.game.audio.sfx('medallion'); this.medallionPulse = 0.6; }
    }
  }

  startBattle(enemy) {
    this.game.audio.stopMusic();
    this.game.audio.sfx('battleStart');
    this.pendingBattle = enemy;
    this.battleFlash = 0.6;
  }

  /** Llamado por BattleScene cuando termina el combate. */
  onBattleEnd(result, enemy) {
    const p = this.player;
    if (result === 'win') {
      enemy.removed = true;
      this.burst(enemy.cx, enemy.y + enemy.h / 2, '#ffffff', 14);
      p.invulnerable = 1;
      if (enemy.isBoss) {
        this.level.exitOpen = true;
        this.showToast('¡La puerta se ha abierto!', 2.5);
      }
    } else if (result === 'flee') {
      enemy.stunned = 2;
      p.invulnerable = 2;
      p.x -= p.facing * 20;
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
    if (g.lives <= 0) {
      g.changeScene(new GameOverScene(g));
      return;
    }
    g.hunter.fullHeal();
    this.player.x = this.respawn.x;
    this.player.y = this.respawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerable = 2;
    this.camX = Math.max(0, this.player.x - W / 2);
    this.showToast(`Te quedan ${g.lives} vida${g.lives === 1 ? '' : 's'}`, 2);
    if (fromBattle) g.changeScene(this);
  }

  completeLevel() {
    const g = this.game;
    g.audio.stopMusic();
    g.audio.sfx('clear');
    g.changeScene(new LevelClearScene(g, this.elapsed));
  }

  /* ---------- Dibujo ---------- */
  draw(ctx) {
    const camX = Math.round(this.camX);
    drawBackground(ctx, this.level.theme, camX, W, H, this.time);
    this.level.draw(ctx, camX, W, this.time);
    this.enemies.forEach((e) => { if (!e.removed) e.draw(ctx, camX); });
    if (this.dying <= 0) this.player.draw(ctx, camX);

    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), 2, 2);
    }
    for (const f of this.floaters) {
      text(ctx, f.str, f.x - camX, f.y, { color: f.color });
    }

    this.drawHud(ctx);

    if (this.toast) {
      const alpha = Math.min(1, this.toast.t * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 66, W, 20);
      text(ctx, this.toast.msg, W / 2, 72, { align: 'center' });
      ctx.globalAlpha = 1;
    }

    if (this.pendingBattle && Math.floor(this.battleFlash * 15) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(0, 0, W, H);
    }

    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      text(ctx, 'PAUSA', W / 2, 60, { size: 16, align: 'center' });
      text(ctx, 'P / ESC para continuar', W / 2, 92, { align: 'center', color: '#bbb' });
      text(ctx, 'M: sonido on/off', W / 2, 108, { align: 'center', color: '#bbb' });
    }
  }

  drawHud(ctx) {
    const g = this.game;
    const h = g.hunter;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, 16);

    // Vidas
    for (let i = 0; i < g.lives; i++) drawSprite(ctx, Sprites.heart(), 4 + i * 9, 5);
    // Vida (PV)
    text(ctx, 'PV', 34, 5, { size: 8 });
    hpBar(ctx, 52, 6, 40, 5, h.hp / h.maxHp);
    // Medallón (vibra si hay monstruos cerca)
    const shake = this.medallionNear ? Math.round(Math.sin(this.time * 50)) : 0;
    drawSprite(ctx, Sprites.medallion(), 98 + shake, 4);
    // Monedas y pociones
    drawSprite(ctx, Sprites.coin(), 114, 4);
    text(ctx, String(h.coins).padStart(2, '0'), 124, 5);
    drawSprite(ctx, Sprites.potion(), 146, 3);
    text(ctx, String(h.potions), 156, 5);
    // Puntaje
    text(ctx, String(g.score.total).padStart(6, '0'), W - 4, 5, { align: 'right' });
    text(ctx, `Nv${h.level}`, 172, 5, { color: '#9fd3ff' });
    if (g.audio.muted) text(ctx, 'MUDO', 210, 5, { color: '#e5484d' });
  }
}
