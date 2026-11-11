import { Input } from './Input.js';
import { AudioManager } from './AudioManager.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { Hunter } from '../systems/Hunter.js';
import { Engine } from '../three/engine.js';
import { $ } from '../ui/ui.js';

const STEP = 1 / 60;
const FADE_MS = 350;

/**
 * Game: ciclo principal (lógica con paso fijo y render en cada cuadro), cambio de escenas
 * con fundido a negro y estado global de la partida.
 * Cada escena implementa: enter(), exit(), update(dt) y opcionalmente frame(dt) (animación visual).
 */
export class Game {
  constructor(container) {
    this.engine = new Engine(container);
    this.input = new Input();
    this.audio = new AudioManager();
    this.scene = null;
    this.switching = false;
    this.time = 0;
    this.newRun();

    this.input.onAnyPress((action) => {
      this.audio.unlock();
      if (action === 'mute') this.audio.toggleMute();
    });
  }

  /** Reinicia el estado de una partida nueva. */
  newRun() {
    this.hunter = new Hunter();
    this.score = new ScoreSystem();
    this.lives = 3;
    this.levelIndex = 0;
    this.stats = { enemies: 0, deaths: 0, coins: 0 };
  }

  start(scene) {
    this.scene = scene;
    scene.enter?.();
    let last = performance.now();
    let acc = 0;
    const loop = (now) => {
      requestAnimationFrame(loop); // se agenda primero: un error en una escena no detiene el juego
      const frameDt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += frameDt;
      try {
        while (acc >= STEP) {
          if (!this.switching) this.scene?.update(STEP);
          this.input.endFrame();
          acc -= STEP;
        }
        this.time += frameDt;
        this.scene?.frame?.(frameDt);
        this.engine.render();
      } catch (err) {
        acc = 0;
        console.error(err);
      }
    };
    requestAnimationFrame(loop);
  }

  /** Cambia de escena con un fundido a negro. */
  changeScene(next) {
    if (this.switching) return;
    this.switching = true;
    $('fade').classList.add('on');
    setTimeout(() => {
      this.scene?.exit?.();
      this.scene = next;
      next.enter?.();
      this.input.endFrame();
      requestAnimationFrame(() => {
        $('fade').classList.remove('on');
        this.switching = false;
      });
    }, FADE_MS);
  }
}
