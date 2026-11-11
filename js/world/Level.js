export const TILE = 32;
export const ROWS = 11;
export const T = { EMPTY: 0, GROUND: 1, PLATFORM: 2, WATER: 3 };

/**
 * Level: datos lógicos del nivel (cuadrícula de tiles, objetos, hogueras, salida y enemigos).
 * Las coordenadas lógicas están en píxeles (tiles de 32 px); World3D las convierte a 3D.
 */
export class Level {
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.theme = def.theme;
    this.cols = def.width;
    this.grid = new Uint8Array(this.cols * ROWS);
    this.items = [];        // { kind: 'coin'|'potion', x, y, taken } (x, y = centro)
    this.checkpoints = [];  // { x, y, lit } (x = esquina del tile, y = parte superior del tile)
    this.spawns = [];       // { kind, x, y }
    this.exit = null;
    this.exitOpen = false;
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
      coins: (x, y, n) => { for (let i = 0; i < n; i++) this.items.push({ kind: 'coin', x: px(x + i) + TILE / 2, y: px(y) + TILE / 2, taken: false }); },
      potion: (x, y) => this.items.push({ kind: 'potion', x: px(x) + TILE / 2, y: px(y) + TILE / 2 + 4, taken: false }),
      enemy: (kind, x, y) => this.spawns.push({ kind, x: px(x), y: px(y) }),
      checkpoint: (x, y) => this.checkpoints.push({ x: px(x), y: px(y), lit: false }),
      exit: (x, y) => { this.exit = { x: px(x) + 4, y: px(y - 1), w: TILE - 8, h: TILE * 2 }; },
      start: (x, y) => { this.startPos = { x: px(x) + 6, y: px(y) - 14 }; },
    };
  }

  tileAt(tx, ty) {
    if (tx < 0 || tx >= this.cols) return T.GROUND; // paredes invisibles en los extremos
    if (ty < 0 || ty >= ROWS) return T.EMPTY;
    return this.grid[ty * this.cols + tx];
  }

  isSolid(tx, ty) {
    const t = this.tileAt(tx, ty);
    return t === T.GROUND || t === T.PLATFORM;
  }

  isWaterAt(px, py) {
    return this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)) === T.WATER;
  }

  /** Recorre la cuadrícula en tramos horizontales del mismo tipo (para construir bloques 3D grandes). */
  runs() {
    const out = [];
    for (let ty = 0; ty < ROWS; ty++) {
      let start = 0;
      for (let tx = 1; tx <= this.cols; tx++) {
        const prev = this.grid[ty * this.cols + tx - 1];
        const cur = tx < this.cols ? this.grid[ty * this.cols + tx] : -1;
        if (cur !== prev) {
          if (prev !== T.EMPTY) out.push({ type: prev, ty, x0: start, x1: tx });
          start = tx;
        }
      }
    }
    return out;
  }
}
