import { screen, clearScreen, escapeHtml } from '../ui/ui.js';
import { CREDITS } from '../data/credits.js';
import { getBackdrop } from './Backdrop.js';

/** CreditsScene: créditos con desplazamiento vertical sobre el fondo 3D. */
export class CreditsScene {
  constructor(game, onDone) {
    this.game = game;
    this.onDone = onDone;
    this.offset = 0;
  }

  enter() {
    this.backdrop = getBackdrop(this.game, 0);
    const html = CREDITS.map(([line, kind]) => {
      if (kind === 't') return `<h2>${escapeHtml(line)}</h2>`;
      if (kind === 'h') return `<h3>${escapeHtml(line)}</h3>`;
      return line ? `<p>${escapeHtml(line)}</p>` : '<br>';
    }).join('');
    const el = screen(`<div class="credits"><div class="roll" id="roll">${html}</div>
      <div class="footbar"><span>Esc: salir · mantén Enter para acelerar</span><span></span></div></div>`);
    this.roll = el.querySelector('#roll');
    this.offset = 0;
  }

  exit() { clearScreen(); }

  update(dt) {
    const input = this.game.input;
    this.offset += dt * (input.isDown('confirm') || input.isDown('down') ? 160 : 45);
    this.roll.style.transform = `translateY(${window.innerHeight - this.offset}px)`;
    if (input.pressed('back') || this.offset > window.innerHeight + this.roll.offsetHeight) {
      if (this.done) return;
      this.done = true;
      this.game.audio.sfx('back');
      this.onDone();
    }
  }

  frame(dt) { this.backdrop.frame(dt); }
}
