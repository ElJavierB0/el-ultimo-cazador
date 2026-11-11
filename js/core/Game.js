import { Input } from './Input.js';
import { AudioManager } from './AudioManager.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { Hunter } from '../systems/Hunter.js';

export const W = 320;
export const H = 176;
const STEP = 1 / 60;

/**
 * Game: ciclo principal (game loop con paso fijo), escalado de pantalla,
 * cambio de escenas con transición y estado global de la partida.
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.audio = new AudioManager();
    this.scene = null;
    this.next = null;
    this.fade = 0;       // 0 = sin transición, 1 = pantalla negra
    this.fadeDir = 0;
    this.time = 0;
    this.newRun();

    this.input.onAnyPress((action) => {
      this.audio.unlock();
      if (action === 'mute') this.audio.toggleMute();
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /** Reinicia el estado de una partida nueva. */
  newRun() {
    this.hunter = new Hunter();
    this.score = new ScoreSystem();
    this.lives = 3;
    this.levelIndex = 0;
    this.stats = { enemies: 0, deaths: 0, coins: 0 };
  }

  /** Escala el canvas al mayor múltiplo entero que quepa en la ventana (pixeles nítidos). */
  resize() {
    const touch = document.body.classList.contains('touch');
    const availH = window.innerHeight - (touch ? 150 : 0);
    const fit = Math.max(1, Math.floor(Math.min(window.innerWidth / W, availH / H)));
    const scale = Math.max(fit, 1);
    const dpr = window.devicePixelRatio || 1;
    this.renderScale = scale * dpr;
    this.canvas.width = W * this.renderScale;
    this.canvas.height = H * this.renderScale;
    this.canvas.style.width = `${W * scale}px`;
    this.canvas.style.height = `${H * scale}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  start(scene) {
    this.scene = scene;
    scene.enter?.();
    let last = performance.now();
    let acc = 0;
    const loop = (now) => {
      acc += Math.min(0.25, (now - last) / 1000);
      last = now;
      while (acc >= STEP) {
        this.update(STEP);
        acc -= STEP;
      }
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** Cambia de escena con un fundido a negro. */
  changeScene(scene, { fast = false } = {}) {
    if (this.next) return;
    this.next = scene;
    this.fadeDir = 1;
    this.fadeSpeed = fast ? 6 : 3;
  }

  update(dt) {
    this.time += dt;
    if (this.fadeDir !== 0) {
      this.fade += this.fadeDir * this.fadeSpeed * dt;
      if (this.fadeDir > 0 && this.fade >= 1) {
        this.fade = 1;
        this.scene?.exit?.();
        this.scene = this.next;
        this.next = null;
        this.scene.enter?.();
        this.fadeDir = -1;
      } else if (this.fadeDir < 0 && this.fade <= 0) {
        this.fade = 0;
        this.fadeDir = 0;
      }
    } else {
      this.scene?.update(dt);
    }
    this.input.endFrame();
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.scene?.draw(ctx);
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
