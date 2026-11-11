import { Entity } from './Entity.js';

const RUN_SPEED = 190;
const ACCEL = 1800;
const FRICTION = 2200;
const JUMP_VELOCITY = -680;
const JUMP_CUT = -260;
const COYOTE_TIME = 0.1;   // margen para saltar justo después de dejar una orilla
const JUMP_BUFFER = 0.12;  // margen para saltar si se presionó un poco antes de tocar el suelo

/**
 * Player: física del cazador en el mapa (coordenadas lógicas en píxeles).
 * Comportamientos: correr, saltar (salto variable), coyote time, buffer de salto e invulnerabilidad.
 * Su modelo 3D (Actor) se sincroniza en PlatformScene.
 */
export class Player extends Entity {
  constructor(x, y, hunter) {
    super(x, y, 18, 44);
    this.hunter = hunter;
    this.facing = 1;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.invulnerable = 0;
    this.jumped = false;
    this.landed = false;
  }

  update(dt, input, level, audio) {
    const dir = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    if (dir !== 0) {
      this.vx += dir * ACCEL * dt;
      this.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, this.vx));
      this.facing = dir;
    } else {
      const f = FRICTION * dt;
      this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - Math.sign(this.vx) * f;
    }

    const wasGround = this.onGround;
    this.jumped = false;
    this.coyote = this.onGround ? COYOTE_TIME : this.coyote - dt;
    this.jumpBuffer = input.pressed('jump') ? JUMP_BUFFER : this.jumpBuffer - dt;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = JUMP_VELOCITY;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.jumped = true;
      audio.sfx('jump');
    }
    if (!input.isDown('jump') && this.vy < JUMP_CUT) this.vy = JUMP_CUT;

    this.applyGravity(dt);
    this.moveAndCollide(dt, level);
    this.landed = !wasGround && this.onGround;

    this.x = Math.max(0, Math.min(level.widthPx - this.w, this.x));
    if (this.invulnerable > 0) this.invulnerable -= dt;
  }

  /** Animación lógica según el estado físico. */
  pose() {
    if (!this.onGround) return this.vy < 0 ? 'jumpStart' : 'jumpAir';
    if (Math.abs(this.vx) > 20) return 'run';
    return 'idle';
  }
}
