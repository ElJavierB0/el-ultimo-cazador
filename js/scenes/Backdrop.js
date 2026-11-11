import { Level } from '../world/Level.js';
import { World3D, toWorld } from '../world/World3D.js';
import { LEVELS } from '../data/levels.js';
import { makeHunter } from '../three/characters.js';

/**
 * Backdrop: escena 3D de fondo para el menú y las pantallas de historia:
 * el cazador descansa junto a una hoguera mientras la cámara se mueve lentamente.
 */
export class Backdrop {
  constructor(game, levelIndex = 0) {
    this.game = game;
    this.level = new Level(LEVELS[levelIndex]);
    this.world = new World3D(game.engine, this.level);
    const cp = this.level.checkpoints[0];
    this.world.lightBonfire(0);
    this.hero = makeHunter(game.hunter.armor);
    const p = toWorld(cp.x + 50, cp.y + 32);
    this.hero.group.position.set(p.x, p.y, 0.4);
    this.hero.face(-1);
    this.hero.play('idle');
    game.engine.scene.add(this.hero.group);
    this.focus = p.clone();
    this.time = 0;
  }

  frame(dt) {
    this.time += dt;
    const cam = this.game.engine.camera;
    const a = this.time * 0.08;
    cam.position.set(this.focus.x + 3.5 + Math.sin(a) * 1.5, this.focus.y + 1.6 + Math.sin(a * 0.7) * 0.2, 6.2 + Math.cos(a) * 0.8);
    cam.lookAt(this.focus.x + 1.4, this.focus.y + 1, -0.5);
    this.hero.update(dt);
    this.world.update(dt, this.focus);
  }
}

/** Devuelve el fondo compartido (se crea solo una vez mientras se navega entre menús). */
export function getBackdrop(game, levelIndex = 0) {
  const b = game.backdrop;
  if (!b || b.levelIndex !== levelIndex || game.engine.currentWorld !== b.world) {
    game.backdrop = new Backdrop(game, levelIndex);
    game.backdrop.levelIndex = levelIndex;
  }
  return game.backdrop;
}
