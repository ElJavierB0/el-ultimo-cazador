import { Entity } from './Entity.js';
import { Sprites, drawSprite } from '../gfx/sprites.js';

const RUN_SPEED = 95;
const ACCEL = 900;
const FRICTION = 1100;
const JUMP_VELOCITY = -335;
const COYOTE_TIME = 0.1;   // margen para saltar justo después de dejar una orilla
const JUMP_BUFFER = 0.12;  // margen para saltar si se presionó un poco antes de tocar el suelo

/**
 * Player: el cazador en el mapa de plataformas.
 * Comportamientos: correr, saltar (salto variable), animación y parpadeo de invulnerabilidad.
 */
export class Player extends Entity {
  constructor(x, y, hunter) {
    super(x, y, 10, 15);
    this.hunter = hunter;
    this.facing = 1;
    this.animTime = 0;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.invulnerable = 0;
  }

  update(dt, input, level, audio) {
    // Movimiento horizontal con aceleración y fricción
    const dir = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    if (dir !== 0) {
      this.vx += dir * ACCEL * dt;
      this.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, this.vx));
      this.facing = dir;
    } else {
      const f = FRICTION * dt;
      this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - Math.sign(this.vx) * f;
    }

    // Salto con coyote time y buffer
    this.coyote = this.onGround ? COYOTE_TIME : this.coyote - dt;
    this.jumpBuffer = input.pressed('jump') ? JUMP_BUFFER : this.jumpBuffer - dt;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = JUMP_VELOCITY;
      this.coyote = 0;
      this.jumpBuffer = 0;
      audio.sfx('jump');
    }
    // Salto variable: si se suelta el botón, el salto se corta
    if (!input.isDown('jump') && this.vy < -120) this.vy = -120;

    this.applyGravity(dt);
    this.moveAndCollide(dt, level);

    this.x = Math.max(0, Math.min(level.widthPx - this.w, this.x));
    this.animTime += dt;
    if (this.invulnerable > 0) this.invulnerable -= dt;
  }

  frame() {
    if (!this.onGround) return 'jump';
    if (Math.abs(this.vx) > 10) return Math.floor(this.animTime * 10) % 2 ? 'run1' : 'run2';
    return 'idle';
  }

  draw(ctx, camX) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 20) % 2) return;
    const img = Sprites.hunter(this.frame(), this.hunter.armor);
    drawSprite(ctx, img, this.x - 3 - camX, this.y, { flip: this.facing < 0 });
  }
}
