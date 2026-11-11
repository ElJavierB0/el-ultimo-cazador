import { TILE } from '../world/Level.js';

/**
 * Entity: clase base con posición, velocidad, gravedad y colisiones contra los tiles.
 * Player y Enemy heredan de ella (POO: herencia y polimorfismo en update/draw).
 */
export class Entity {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.gravity = 1000;
    this.maxFall = 420;
    this.removed = false;
  }

  get cx() { return this.x + this.w / 2; }
  get bottom() { return this.y + this.h; }

  /** Colisión AABB (cajas alineadas a los ejes) contra otra entidad o rectángulo. */
  overlaps(o) {
    return this.x < o.x + o.w && this.x + this.w > o.x && this.y < o.y + o.h && this.y + this.h > o.y;
  }

  applyGravity(dt) {
    this.vy = Math.min(this.maxFall, this.vy + this.gravity * dt);
  }

  /** Mueve primero en X y luego en Y, resolviendo choques contra tiles sólidos. */
  moveAndCollide(dt, level) {
    this.hitWall = false;
    // Eje X
    this.x += this.vx * dt;
    const top = Math.floor(this.y / TILE);
    const bot = Math.floor((this.y + this.h - 1) / TILE);
    if (this.vx > 0) {
      const tx = Math.floor((this.x + this.w) / TILE);
      for (let ty = top; ty <= bot; ty++) {
        if (level.isSolid(tx, ty)) { this.x = tx * TILE - this.w; this.vx = 0; this.hitWall = true; break; }
      }
    } else if (this.vx < 0) {
      const tx = Math.floor(this.x / TILE);
      for (let ty = top; ty <= bot; ty++) {
        if (level.isSolid(tx, ty)) { this.x = (tx + 1) * TILE; this.vx = 0; this.hitWall = true; break; }
      }
    }

    // Eje Y
    this.y += this.vy * dt;
    this.onGround = false;
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    if (this.vy > 0) {
      const ty = Math.floor((this.y + this.h) / TILE);
      for (let tx = left; tx <= right; tx++) {
        if (level.isSolid(tx, ty)) { this.y = ty * TILE - this.h; this.vy = 0; this.onGround = true; break; }
      }
    } else if (this.vy < 0) {
      const ty = Math.floor(this.y / TILE);
      for (let tx = left; tx <= right; tx++) {
        if (level.isSolid(tx, ty)) { this.y = (ty + 1) * TILE; this.vy = 0; break; }
      }
    }
  }

  update() {}
  draw() {}
}
