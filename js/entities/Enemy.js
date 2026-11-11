import { Entity } from './Entity.js';
import { TILE } from '../world/Level.js';
import { BESTIARY } from '../data/bestiary.js';
import { Sprites, drawSprite } from '../gfx/sprites.js';

const FLYING = new Set(['espectro', 'senor']);

/**
 * Enemy: monstruo en el mapa. Patrulla de lado a lado y da la vuelta
 * al chocar con una pared o al llegar a una orilla. Al tocar al jugador inicia una batalla.
 */
export class Enemy extends Entity {
  constructor(kind, x, y) {
    const data = BESTIARY[kind];
    const scale = data.boss ? 2 : 1;
    super(x, y, 12 * scale, 14 * scale);
    this.y = y + TILE - this.h;
    this.kind = kind;
    this.data = data;
    this.scale = scale;
    this.flying = FLYING.has(kind);
    this.speed = data.boss ? 18 : kind === 'lobo' ? 45 : 28;
    this.dir = -1;
    this.homeX = x;
    this.baseY = this.y;
    this.time = Math.random() * 10;
    this.stunned = 0;
  }

  get isBoss() { return !!this.data.boss; }

  update(dt, level) {
    this.time += dt;
    if (this.stunned > 0) { this.stunned -= dt; return; }

    if (this.flying) {
      // Flota: se mueve en un rango alrededor de su punto de origen y sube/baja suavemente
      this.x += this.dir * this.speed * dt;
      if (Math.abs(this.x - this.homeX) > 40) this.dir *= -1;
      this.y = this.baseY + Math.sin(this.time * 2.5) * 4;
      return;
    }

    if (this.isBoss) {
      // El jefe vigila su arena sin alejarse demasiado
      this.vx = this.dir * this.speed;
      if (Math.abs(this.x + this.vx * dt - this.homeX) > 32) this.dir *= -1;
    } else {
      this.vx = this.dir * this.speed;
      // ¿Hay suelo adelante? Si no, da la vuelta para no caer
      const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      const footY = this.y + this.h + 1;
      if (this.onGround && !level.isSolid(Math.floor(aheadX / TILE), Math.floor(footY / TILE))) this.dir *= -1;
      // Patrulla limitada alrededor de su punto de origen
      else if ((this.x - this.homeX) * this.dir > 56) this.dir *= -1;
    }
    this.applyGravity(dt);
    this.moveAndCollide(dt, level);
    if (this.hitWall) this.dir *= -1;
  }

  draw(ctx, camX) {
    const img = Sprites.enemy(this.kind);
    const alpha = this.stunned > 0 ? 0.5 : 1;
    const drawX = this.x - 2 * this.scale - camX;
    const drawY = this.y + this.h - img.height * this.scale;
    // Lobo/huargo y bandido están dibujados mirando a la derecha
    drawSprite(ctx, img, drawX, drawY, { scale: this.scale, flip: this.dir < 0, alpha });
    if (this.isBoss) {
      // Aura del jefe
      ctx.fillStyle = `rgba(255,60,60,${0.15 + Math.sin(this.time * 3) * 0.08})`;
      ctx.fillRect(Math.round(drawX) - 2, Math.round(drawY) - 2, img.width * this.scale + 4, 2);
    }
  }
}
