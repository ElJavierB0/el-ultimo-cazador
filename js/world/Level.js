import { THEMES } from '../gfx/draw.js';
import { Sprites, drawSprite } from '../gfx/sprites.js';

export const TILE = 16;
export const ROWS = 11;
export const T = { EMPTY: 0, GROUND: 1, PLATFORM: 2, WATER: 3 };

/**
 * Level: cuadrícula de tiles + listas de objetos (monedas, pociones, hogueras, salida, enemigos).
 * Se construye a partir de la definición de levels.js.
 */
export class Level {
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.theme = def.theme;
    this.cols = def.width;
    this.grid = new Uint8Array(this.cols * ROWS);
    this.items = [];        // { kind: 'coin'|'potion', x, y, taken }
    this.checkpoints = [];  // { x, y, lit }
    this.spawns = [];       // { kind, x, y }
    this.exit = null;
    this.startPos = { x: 0, y: 0 };
    def.build(this.builder());
  }

  get widthPx() { return this.cols * TILE; }
  get heightPx() { return ROWS * TILE; }

  /* ---------- Builder usado por levels.js ---------- */
  builder() {
    const set = (x, y, t) => { if (x >= 0 && x < this.cols && y >= 0 && y < ROWS) this.grid[y * this.cols + x] = t; };
    const px = (tx) => tx * TILE;
    return {
      ground: (x0, x1, h) => { for (let x = x0; x < x1; x++) for (let y = ROWS - h; y < ROWS; y++) set(x, y, T.GROUND); },
      platform: (x, y, len) => { for (let i = 0; i < len; i++) set(x + i, y, T.PLATFORM); },
      water: (x0, x1) => { for (let x = x0; x < x1; x++) { set(x, ROWS - 1, T.WATER); set(x, ROWS - 2, T.WATER); } },
      coins: (x, y, n) => { for (let i = 0; i < n; i++) this.items.push({ kind: 'coin', x: px(x + i) + 4, y: px(y) + 4, taken: false }); },
      potion: (x, y) => this.items.push({ kind: 'potion', x: px(x) + 4, y: px(y) + 8, taken: false }),
      enemy: (kind, x, y) => this.spawns.push({ kind, x: px(x), y: px(y) }),
      checkpoint: (x, y) => this.checkpoints.push({ x: px(x), y: px(y), lit: false }),
      exit: (x, y) => { this.exit = { x: px(x), y: px(y - 1), w: TILE, h: TILE * 2 }; },
      start: (x, y) => { this.startPos = { x: px(x) + 3, y: px(y) }; },
    };
  }

  tileAt(tx, ty) {
    if (tx < 0 || tx >= this.cols) return T.GROUND; // paredes invisibles en los extremos
    if (ty < 0) return T.EMPTY;
    if (ty >= ROWS) return T.EMPTY;
    return this.grid[ty * this.cols + tx];
  }

  isSolid(tx, ty) {
    const t = this.tileAt(tx, ty);
    return t === T.GROUND || t === T.PLATFORM;
  }

  isWaterAt(px, py) {
    return this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)) === T.WATER;
  }

  /* ---------- Dibujo ---------- */
  draw(ctx, camX, W, time) {
    const th = THEMES[this.theme];
    const c0 = Math.max(0, Math.floor(camX / TILE));
    const c1 = Math.min(this.cols - 1, Math.floor((camX + W) / TILE));
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = c0; tx <= c1; tx++) {
        const t = this.grid[ty * this.cols + tx];
        if (!t) continue;
        const x = tx * TILE - Math.round(camX);
        const y = ty * TILE;
        if (t === T.GROUND) this.drawGround(ctx, x, y, tx, ty, th);
        else if (t === T.PLATFORM) this.drawPlatform(ctx, x, y, th);
        else if (t === T.WATER) this.drawWater(ctx, x, y, tx, ty, time);
      }
    }
    this.drawCheckpoints(ctx, camX, time);
    this.drawExit(ctx, camX, time);
    this.drawItems(ctx, camX, time);
  }

  drawGround(ctx, x, y, tx, ty, th) {
    const top = !this.isSolid(tx, ty - 1);
    if (this.theme === 'castle') {
      // Ladrillo de piedra
      ctx.fillStyle = th.ground;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = th.groundDark;
      ctx.fillRect(x, y + 7, TILE, 1);
      ctx.fillRect(x, y + 15, TILE, 1);
      ctx.fillRect(x + (ty % 2 ? 4 : 11), y, 1, 7);
      ctx.fillRect(x + (ty % 2 ? 11 : 4), y + 8, 1, 7);
      if (top) { ctx.fillStyle = th.topLight; ctx.fillRect(x, y, TILE, 2); }
      return;
    }
    ctx.fillStyle = th.ground;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = th.groundDark;
    const r = (tx * 7 + ty * 13) % 5;
    ctx.fillRect(x + 3 + r, y + 6, 2, 2);
    ctx.fillRect(x + 10 - r, y + 11, 2, 2);
    if (top) {
      ctx.fillStyle = th.top;
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = th.topLight;
      ctx.fillRect(x, y, TILE, 2);
      ctx.fillStyle = th.top;
      for (let i = 0; i < TILE; i += 4) ctx.fillRect(x + i + ((tx + i) % 3), y + 5, 2, 2);
    }
  }

  drawPlatform(ctx, x, y, th) {
    if (this.theme === 'castle') {
      ctx.fillStyle = th.top;
      ctx.fillRect(x, y, TILE, 8);
      ctx.fillStyle = th.groundDark;
      ctx.fillRect(x, y + 7, TILE, 1);
      ctx.fillRect(x + 7, y, 1, 7);
      ctx.fillStyle = th.topLight;
      ctx.fillRect(x, y, TILE, 1);
      return;
    }
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(x, y, TILE, 7);
    ctx.fillStyle = '#8a6237';
    ctx.fillRect(x, y, TILE, 2);
    ctx.fillStyle = '#3e2a17';
    ctx.fillRect(x, y + 6, TILE, 1);
    ctx.fillRect(x + 7, y + 2, 1, 4);
  }

  drawWater(ctx, x, y, tx, ty, time) {
    const surface = this.tileAt(tx, ty - 1) !== T.WATER;
    ctx.fillStyle = '#1f3b33';
    ctx.fillRect(x, y, TILE, TILE);
    if (surface) {
      ctx.fillStyle = '#3f6b55';
      const off = Math.floor(time * 6 + tx * 3) % 4;
      ctx.fillRect(x, y + 3, TILE, 2);
      ctx.fillStyle = '#7fb39a';
      ctx.fillRect(x + off * 4, y + 3, 3, 1);
    }
  }

  drawItems(ctx, camX, time) {
    for (const it of this.items) {
      if (it.taken) continue;
      const bob = Math.round(Math.sin(time * 4 + it.x * 0.1) * 1.5);
      const img = it.kind === 'coin' ? Sprites.coin() : Sprites.potion();
      drawSprite(ctx, img, it.x - camX, it.y + bob);
    }
  }

  drawCheckpoints(ctx, camX, time) {
    for (const cp of this.checkpoints) {
      const x = Math.round(cp.x - camX);
      const y = cp.y;
      // Troncos de la hoguera
      ctx.fillStyle = '#4a3020';
      ctx.fillRect(x + 2, y + 13, 12, 3);
      ctx.fillStyle = '#6b4a2b';
      ctx.fillRect(x + 4, y + 11, 8, 2);
      if (cp.lit) {
        const f = Math.floor(time * 10) % 3;
        ctx.fillStyle = '#ff7a1a';
        ctx.fillRect(x + 5, y + 5 + f, 6, 7 - f);
        ctx.fillStyle = '#ffd34a';
        ctx.fillRect(x + 6, y + 8, 4, 4);
        ctx.fillStyle = 'rgba(255,150,50,0.15)';
        ctx.beginPath();
        ctx.arc(x + 8, y + 10, 16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#555';
        ctx.fillRect(x + 6, y + 10, 4, 1);
      }
    }
  }

  drawExit(ctx, camX, time) {
    if (!this.exit) return;
    const x = Math.round(this.exit.x - camX);
    const y = this.exit.y;
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(x - 3, y - 4, TILE + 6, TILE * 2 + 4);
    ctx.fillStyle = this.exitOpen ? `rgba(160,220,255,${0.6 + Math.sin(time * 4) * 0.2})` : '#14141a';
    ctx.fillRect(x, y, TILE, TILE * 2);
    if (!this.exitOpen) {
      // Sello rojo en la puerta
      ctx.fillStyle = '#a3262e';
      ctx.fillRect(x + 5, y + 12, 6, 6);
    }
  }
}
