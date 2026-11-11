/**
 * UI: utilidades para la interfaz HTML que se dibuja encima del mundo 3D
 * (HUD, avisos, textos flotantes y pantallas completas).
 */
export const $ = (id) => document.getElementById(id);

export function show(id, on = true) {
  $(id).classList.toggle('hidden', !on);
}

let toastTimer = null;
export function toast(msg, secs = 2) {
  const el = $('toast');
  el.textContent = msg;
  show('toast');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => show('toast', false), secs * 1000);
}

export function banner(title, sub = '') {
  const el = $('banner');
  $('banner-title').textContent = title;
  $('banner-sub').textContent = sub;
  show('banner', false);
  void el.offsetWidth; // reinicia la animación
  show('banner');
  setTimeout(() => show('banner', false), 3200);
}

/** Texto flotante sobre una posición 3D (daño, puntos, curación). */
export function popup(engine, text, pos3, color = '#ffffff', big = false) {
  const s = engine.toScreen(pos3);
  if (!s.visible) return;
  const el = document.createElement('div');
  el.className = `pop${big ? ' big' : ''}`;
  el.textContent = text;
  el.style.color = color;
  el.style.left = `${s.x}px`;
  el.style.top = `${s.y}px`;
  $('pops').appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

/** Muestra una pantalla completa con el HTML indicado. */
export function screen(html) {
  const el = $('screen');
  el.innerHTML = html;
  show('screen');
  return el;
}

export function clearScreen() {
  $('screen').innerHTML = '';
  show('screen', false);
}

export function setBar(id, ratio) {
  const el = $(id);
  const r = Math.max(0, Math.min(1, ratio));
  el.style.width = `${r * 100}%`;
  if (!el.parentElement.classList.contains('foe')) {
    el.style.background = r > 0.5 ? 'var(--hp)' : r > 0.2 ? 'var(--hp-mid)' : 'var(--hp-low)';
  }
}

/** Actualiza el HUD de exploración. */
export function updateHud(game, medallionNear) {
  const h = game.hunter;
  $('hud-hearts').innerHTML = [0, 1, 2].map((i) => `<span class="${i < game.lives ? 'on' : 'off'}">♥</span>`).join('');
  $('hud-level').textContent = `Nv ${h.level}`;
  setBar('hud-hp', h.hp / h.maxHp);
  $('hud-hpnum').textContent = `${h.hp}/${h.maxHp}`;
  $('hud-score').textContent = String(game.score.total).padStart(6, '0');
  $('hud-coins').textContent = h.coins;
  $('hud-potions').textContent = h.potions;
  $('hud-medal').classList.toggle('on', !!medallionNear);
}

/** Navegación de menús verticales u horizontales en pantallas HTML. */
export function menuNav(input, count, index, { horizontal = false } = {}) {
  const prev = horizontal ? 'left' : 'up';
  const next = horizontal ? 'right' : 'down';
  if (input.pressed(prev)) return (index + count - 1) % count;
  if (input.pressed(next)) return (index + 1) % count;
  return index;
}

export const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
