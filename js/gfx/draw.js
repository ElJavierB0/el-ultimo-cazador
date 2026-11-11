/**
 * Utilidades de dibujo: texto pixelado, cajas de diálogo, barras de vida y fondos.
 */
export const FONT = '"Press Start 2P", monospace';

export function text(ctx, str, x, y, { size = 8, color = '#f2efe6', align = 'left', shadow = true } = {}) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, Math.round(x), Math.round(y));
}

/** Corta un texto en líneas que quepan en maxWidth. */
export function wrap(ctx, str, maxWidth, size = 8) {
  ctx.font = `${size}px ${FONT}`;
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Caja con borde doble estilo RPG clásico. */
export function box(ctx, x, y, w, h, { fill = '#f4f1e8', border = '#3a3f4a', inner = '#9aa3ad' } = {}) {
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = inner;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}

/** Barra de vida que cambia de color según el porcentaje. */
export function hpBar(ctx, x, y, w, h, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#545454';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = r > 0.5 ? '#4cd964' : r > 0.2 ? '#f5c242' : '#e5484d';
  ctx.fillRect(x, y, Math.round(w * r), h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y, Math.round(w * r), 1);
}

/** Generador pseudoaleatorio con semilla (para que los fondos siempre se vean igual). */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const THEMES = {
  forest: {
    sky: ['#1b2440', '#3d4a6b', '#c98a5a'], moon: '#f3e9c6',
    far: '#26304a', mid: '#1c2a2a', near: '#122019',
    ground: '#4a3424', groundDark: '#33241a', top: '#4f8a3a', topLight: '#79b34f',
    battle: ['#2b3a55', '#6b5a4a', '#c58a55'], pad: '#5f8f3e', padEdge: '#3e6a29',
  },
  swamp: {
    sky: ['#141f1d', '#2c3e36', '#5f7a5a'], moon: '#d8e6c8',
    far: '#1f2e2a', mid: '#18251f', near: '#0f1a15',
    ground: '#3b3a28', groundDark: '#28271b', top: '#5d6b3a', topLight: '#7f8f4f',
    battle: ['#1d2b26', '#3f5446', '#7a8f6a'], pad: '#5d6b3a', padEdge: '#3c4726',
  },
  castle: {
    sky: ['#12070d', '#3a1020', '#a33a2a'], moon: '#ffcf9a',
    far: '#2a0f18', mid: '#1d0a10', near: '#120609',
    ground: '#4b4650', groundDark: '#2f2b33', top: '#6d6772', topLight: '#8e8894',
    battle: ['#1a0a12', '#4a1a22', '#a0442e'], pad: '#5b5560', padEdge: '#3a353f',
  },
};

/** Fondo con paralaje: cielo, luna y siluetas en tres capas. */
export function drawBackground(ctx, theme, camX, W, H, time = 0) {
  const t = THEMES[theme];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.sky[0]);
  g.addColorStop(0.6, t.sky[1]);
  g.addColorStop(1, t.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Estrellas
  const rnd = seeded(7);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 40; i++) {
    const sx = Math.floor((rnd() * W * 2 - camX * 0.05) % W + W) % W;
    const sy = Math.floor(rnd() * H * 0.5);
    if ((i + Math.floor(time * 2)) % 7 !== 0) ctx.fillRect(sx, sy, 1, 1);
  }

  // Luna
  ctx.fillStyle = t.moon;
  ctx.beginPath();
  ctx.arc(W - 60 - camX * 0.02, 34, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.arc(W - 64 - camX * 0.02, 31, 4, 0, Math.PI * 2);
  ctx.fill();

  if (theme === 'castle') {
    layerCastle(ctx, t.far, camX * 0.15, W, H, 70, 11);
    layerCastle(ctx, t.mid, camX * 0.35, W, H, 100, 23);
  } else {
    layerHills(ctx, t.far, camX * 0.1, W, H, 80, 3);
    layerTrees(ctx, t.mid, camX * 0.3, W, H, 105, 5, theme === 'swamp');
    layerTrees(ctx, t.near, camX * 0.55, W, H, 125, 9, theme === 'swamp');
  }

  if (theme === 'swamp') {
    // Niebla que se mueve lentamente
    ctx.fillStyle = 'rgba(200,220,200,0.06)';
    for (let i = 0; i < 4; i++) {
      const fx = ((time * 8 * (i + 1) - camX * 0.4) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.fillRect(fx, 110 + i * 12, 160, 6);
    }
  }
}

function layerHills(ctx, color, offset, W, H, baseY, seed) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    const wx = x + offset;
    const y = baseY + Math.sin(wx * 0.013 + seed) * 12 + Math.sin(wx * 0.031) * 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.fill();
}

function layerTrees(ctx, color, offset, W, H, baseY, seed, dead) {
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY + 10, W, H);
  const spacing = 22;
  const start = Math.floor(offset / spacing) - 1;
  for (let i = start; i < start + W / spacing + 3; i++) {
    const rnd = seeded(i * 97 + seed);
    const x = i * spacing - offset + rnd() * 10;
    const h = 30 + rnd() * 30;
    if (dead) {
      ctx.fillRect(x, baseY + 10 - h, 3, h);
      ctx.fillRect(x - 5, baseY + 10 - h * 0.7, 6, 2);
      ctx.fillRect(x + 2, baseY + 10 - h * 0.5, 7, 2);
    } else {
      // Pino de tres niveles
      for (let k = 0; k < 3; k++) {
        const w = 14 - k * 4;
        const y = baseY + 10 - h + k * 10;
        ctx.beginPath();
        ctx.moveTo(x - w + 1, y + 16);
        ctx.lineTo(x + 1, y);
        ctx.lineTo(x + w + 1, y + 16);
        ctx.fill();
      }
      ctx.fillRect(x, baseY, 3, 12);
    }
  }
}

function layerCastle(ctx, color, offset, W, H, baseY, seed) {
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY, W, H);
  const spacing = 48;
  const start = Math.floor(offset / spacing) - 1;
  for (let i = start; i < start + W / spacing + 3; i++) {
    const rnd = seeded(i * 31 + seed);
    const x = i * spacing - offset;
    const h = 20 + rnd() * 40;
    const w = 14 + rnd() * 10;
    ctx.fillRect(x, baseY - h, w, h);
    // Almenas
    for (let k = 0; k < w; k += 4) ctx.fillRect(x + k, baseY - h - 3, 2, 3);
    // Ventana iluminada
    if (rnd() > 0.5) {
      ctx.fillStyle = 'rgba(255,170,90,0.6)';
      ctx.fillRect(x + w / 2 - 1, baseY - h + 8, 2, 4);
      ctx.fillStyle = color;
    }
  }
}
