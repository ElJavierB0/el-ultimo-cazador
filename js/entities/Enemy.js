import { Entity } from './Entity.js';
import { TILE } from '../world/Level.js';
import { BESTIARY } from '../data/bestiary.js';

/**
 * Enemy: física y comportamiento del enemigo en el mapa (coordenadas lógicas).
 * Patrulla de lado a lado alrededor de su punto de origen y da la vuelta en paredes y orillas.
 * Al tocar al jugador inicia una batalla. Su modelo 3D se sincroniza en PlatformScene.
 */
export class Enemy extends Entity {
  constructor(kind, x, y) {
    const data = BESTIARY[kind];
    const scale = data.model.scale || 1;
    super(x, y, 22 * Math.min(scale, 1.3), 46 * Math.min(scale, 1.3));
    this.x = x + (TILE - this.w) / 2;
    this.y = y + TILE - this.h;
    this.kind = kind;
    this.data = data;
    this.speed = data.boss ? 34 : 52;
    this.dir = -1;
    this.homeX = this.x;
    this.stunned = 0;
    this.moving = false;
  }

  get isBoss() { return !!this.data.boss; }

  update(dt, level) {
    if (this.stunned > 0) { this.stunned -= dt; this.vx = 0; this.moving = false; return; }
    this.vx = this.dir * this.speed;
    const range = this.isBoss ? 64 : 96;
    const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
    const footY = this.y + this.h + 1;
    if (this.onGround && !level.isSolid(Math.floor(aheadX / TILE), Math.floor(footY / TILE))) this.dir *= -1;
    else if ((this.x - this.homeX) * this.dir > range) this.dir *= -1;
    this.applyGravity(dt);
    this.moveAndCollide(dt, level);
    if (this.hitWall) this.dir *= -1;
    this.moving = true;
  }
}
