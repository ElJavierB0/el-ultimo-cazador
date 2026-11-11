/**
 * Input: unifica teclado y botones táctiles en "acciones" del juego.
 * - isDown(accion): la acción se mantiene presionada.
 * - pressed(accion): la acción se presionó en este frame (flanco de subida).
 */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump',
  Enter: 'confirm', KeyZ: 'confirm', KeyJ: 'confirm',
  Escape: 'back', KeyX: 'back', KeyK: 'back', Backspace: 'back',
  KeyP: 'pause',
  KeyM: 'mute',
};

export class Input {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();
    this.listeners = [];

    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      e.preventDefault();
      if (!this.down.has(action)) this.press(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (action) this.release(action);
    });
    window.addEventListener('blur', () => this.down.clear());

    this.bindTouch();
  }

  press(action) {
    this.down.add(action);
    this.justPressed.add(action);
    this.listeners.forEach((fn) => fn(action));
  }

  release(action) {
    this.down.delete(action);
  }

  /** Avisa en cada pulsación (se usa para desbloquear el audio del navegador). */
  onAnyPress(fn) {
    this.listeners.push(fn);
  }

  /** Botones en pantalla para celular / tablet. */
  bindTouch() {
    document.querySelectorAll('[data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      const start = (e) => { e.preventDefault(); if (!this.down.has(action)) this.press(action); btn.classList.add('active'); };
      const end = (e) => { e.preventDefault(); this.release(action); btn.classList.remove('active'); };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('pointercancel', end);
    });
  }

  isDown(action) {
    if (action === 'up' && this.down.has('jump')) return true;
    if (action === 'jump' && this.down.has('up')) return true;
    return this.down.has(action);
  }

  pressed(action) {
    if (action === 'jump') return this.justPressed.has('jump') || this.justPressed.has('up');
    if (action === 'confirm') return this.justPressed.has('confirm') || this.justPressed.has('jump');
    return this.justPressed.has(action);
  }

  /** Se llama al final de cada frame lógico. */
  endFrame() {
    this.justPressed.clear();
  }
}
