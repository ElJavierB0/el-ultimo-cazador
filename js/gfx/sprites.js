/**
 * Pixel art definido como texto. Cada carácter es un color de la paleta y "." es transparente.
 * Los sprites se convierten una sola vez a canvas fuera de pantalla (caché) para dibujarlos rápido.
 */

/* ---------- Paletas ---------- */
const HUNTER_BASE = { H: '#e8e4dc', S: '#e0b48c', E: '#c9a227', W: '#cfd8dc', B: '#3b2a1e' };
export const ARMOR_PALETTES = [
  { ...HUNTER_BASE, A: '#7a5230', a: '#4e341e' }, // Jubón de cuero
  { ...HUNTER_BASE, A: '#8a939b', a: '#5b636a' }, // Cota de malla
  { ...HUNTER_BASE, A: '#2c3440', a: '#b8c4cc' }, // Armadura de la Orden
];

const PALETTES = {
  bandido: { R: '#8e2b2b', S: '#d9a77c', E: '#1a1a1a', K: '#222', T: '#6b4a2b', k: '#3a2a1a', B: '#2a1d14', W: '#cfd8dc' },
  lobo: { G: '#8d8d8d', g: '#5a5a5a', E: '#f2c14e', n: '#111' },
  huargo: { G: '#3a3a44', g: '#1f1f26', E: '#ff3b3b', n: '#000' },
  lodoso: { M: '#5d6b3a', m: '#2f3a1c', d: '#46532a', E: '#e8f06a' },
  espectro: { V: '#7d7a9a', v: '#55526e', k: '#15141c', Y: '#9ff3ff' },
  senor: { V: '#5a1f1f', v: '#2e0f0f', k: '#0b0606', Y: '#ffb347' },
  bruja: { h: '#2d2235', L: '#9a9a9a', S: '#a7b88a', E: '#ff5e5e', R: '#3f2f4f', r: '#261c30', s: '#7d8f63', t: '#6b4a2b', Y: '#7dffb0' },
};

/* ---------- Cazador (vista lateral, mirando a la derecha) ---------- */
const HUNTER_TOP = [
  '..W.............',
  '..WW.HHHHH......',
  '...WHHHHHHH.....',
  '....HHSSSSS.....',
  '....HHSSESS.....',
  '....HHSSSSS.....',
  '.....HAASS......',
  '....AAAAAAA.....',
  '...SAAaAAAAS....',
  '...BAAaAAAAB....',
  '....AAaAAAA.....',
  '....BBBBBBB.....',
];
const LEGS = {
  idle: ['....aa...aa.....', '....aa...aa.....', '...BBB...BBB....', '................'],
  run1: ['...aa.....aa....', '..aa.......aa...', '.BB.........BB..', '................'],
  run2: ['.....aaaa.......', '.....aa.aa......', '.....BB.BB......', '................'],
  jump: ['....aaaaaa......', '.....BB.BB......', '................', '................'],
};

/* ---------- Cazador de espaldas (pantalla de batalla) ---------- */
const HUNTER_BACK = [
  '............W...',
  '.....HHHHH.WW...',
  '....HHHHHHWW....',
  '....HHHHHWWH....',
  '....HHHHWWHH....',
  '.....HHWWHH.....',
  '....AAWWAAAA....',
  '...AAWWAAAAAA...',
  '..AAAWAAAAAAAA..',
  '..SAAAAAAAAAAS..',
  '..SAaAAAAAAaAS..',
  '...AaAAAAAAaA...',
  '...BBBBBBBBBB...',
  '...AAAAAAAAAA...',
  '...AaAAAAAAaA...',
  '...AaAAAAAAaA...',
];

/* ---------- Enemigos (mirando a la derecha) ---------- */
const BANDIDO = [
  '................',
  '......RRRR......',
  '.....RRRRRR.....',
  '.....RSSSSR.....',
  '.....RSSESS.....',
  '.....RRSSSS.....',
  '......KKKK......',
  '.....TTTTTT.....',
  '....STTTTTTS..W.',
  '....STTkTTTSWW..',
  '.....TTkTTT.....',
  '.....BBBBBB.....',
  '.....kk..kk.....',
  '.....kk..kk.....',
  '....BBB..BBB....',
  '................',
];
const LOBO = [
  '................',
  '................',
  '................',
  '...........g....',
  '..........gGg...',
  '.........GGGGG..',
  'g.......GGGGEGG.',
  'gg.....GGGGGGGGn',
  '.gGGGGGGGGGGGgg.',
  '..GGGGGGGGGGGg..',
  '..GGGGGGGGGGG...',
  '..gGGGGGgGGGg...',
  '..gG.gG...gG.gG.',
  '..gg.gg...gg.gg.',
  '..gg.gg...gg.gg.',
  '................',
];
const LODOSO = [
  '................',
  '................',
  '......MMMM......',
  '.....MMMMMM.....',
  '.....MMMEME.....',
  '.....MMMMMMM....',
  '......MmmmM.....',
  '....MMMMMMMM....',
  '...MMMMdMMMMM...',
  '..MM.MMdMMM.MM..',
  '..M..MMdMMM..M..',
  '.mm..MMMMMM..mm.',
  '.....MM..MM.....',
  '.....MM..MM.....',
  '....mmm..mmm....',
  '................',
];
const ESPECTRO = [
  '................',
  '......VVVV......',
  '.....VVVVVV.....',
  '....VVkkkkVV....',
  '....VkkYkkYV....',
  '....VkkkkkkV....',
  '....VVkkkkVV....',
  '...VVVVVVVVVV...',
  '..VVVVVVVVVVVV..',
  '..vVVVVVVVVVVv..',
  '..v.VVVVVVVV.v..',
  '....VVVVVVVV....',
  '....VvVVVVvV....',
  '.....v.VV.v.....',
  '.......v........',
  '................',
];
const BRUJA = [
  '.......h........',
  '......hhh.......',
  '.....hhhhh......',
  '...hhhhhhhhh..Y.',
  '.....LSSSL....t.',
  '.....LSSES....t.',
  '.....LSSSL....t.',
  '....LLRRRLL...t.',
  '...RRRRRRRRR..t.',
  '...RRRRRRRRRsst.',
  '...RRRRRRRRR..t.',
  '..RRRRRRRRRRR.t.',
  '..RRRRrRRRRRR.t.',
  '.RRRRRrRRRRRRRt.',
  '.rrrrrrrrrrrrrt.',
  '................',
];

/* ---------- Objetos ---------- */
const COIN = [
  '..yyyy..',
  '.yYYYYy.',
  'yYYyyYYy',
  'yYyYYyYy',
  'yYyYYyYy',
  'yYYyyYYy',
  '.yYYYYy.',
  '..yyyy..',
];
const POTION = [
  '...cc...',
  '...gg...',
  '..gRRg..',
  '.gRRRRg.',
  '.gRwRRg.',
  '.gRRRRg.',
  '..gggg..',
  '........',
];
const HEART = [
  '.rr.rr.',
  'rRRrRRr',
  'rRRRRRr',
  '.rRRRr.',
  '..rRr..',
  '...r...',
];
const MEDALLION = [
  '...cc...',
  '..c..c..',
  '.ssssss.',
  'ssdsdsss',
  'sdssssds',
  'sssdssss',
  '.ssssss.',
  '..ssss..',
];

const ITEM_PALETTE = {
  y: '#a8781a', Y: '#f4c542', c: '#8a6a3a', g: '#cfd8dc', R: '#d0344a', w: '#ffffff',
  r: '#5a0f17', s: '#b8c4cc', d: '#4a545c',
};
const HEART_PALETTE = { r: '#5a0f17', R: '#e03a4e' };

/* ---------- Construcción y caché ---------- */
const cache = new Map();

function build(rows, palette) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function get(key, rows, palette) {
  if (!cache.has(key)) cache.set(key, build(rows, palette));
  return cache.get(key);
}

export const Sprites = {
  hunter(frame, armor = 0) {
    return get(`hunter-${frame}-${armor}`, [...HUNTER_TOP, ...LEGS[frame]], ARMOR_PALETTES[armor]);
  },
  hunterBack(armor = 0) {
    return get(`hunterBack-${armor}`, HUNTER_BACK, ARMOR_PALETTES[armor]);
  },
  enemy(kind) {
    const shapes = { bandido: BANDIDO, lobo: LOBO, huargo: LOBO, lodoso: LODOSO, espectro: ESPECTRO, senor: ESPECTRO, bruja: BRUJA };
    return get(`enemy-${kind}`, shapes[kind], PALETTES[kind]);
  },
  coin() { return get('coin', COIN, ITEM_PALETTE); },
  potion() { return get('potion', POTION, ITEM_PALETTE); },
  heart() { return get('heart', HEART, HEART_PALETTE); },
  medallion() { return get('medallion', MEDALLION, ITEM_PALETTE); },
};

/** Dibuja un sprite con escala entera, opcionalmente volteado horizontalmente. */
export function drawSprite(ctx, img, x, y, { scale = 1, flip = false, alpha = 1 } = {}) {
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(Math.round(x) + w, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  }
  ctx.restore();
}
