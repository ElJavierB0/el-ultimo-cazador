import { screen, clearScreen, $, escapeHtml } from '../ui/ui.js';
import { getBackdrop } from './Backdrop.js';

/**
 * StoryScene: páginas del guion con efecto de máquina de escribir sobre el fondo 3D.
 * Enter avanza (o completa el texto); Esc salta toda la historia.
 */
export class StoryScene {
  constructor(game, pages, onDone, { music = 'title', title = '', backdropLevel = 0 } = {}) {
    this.game = game;
    this.pages = pages;
    this.onDone = onDone;
    this.music = music;
    this.title = title;
    this.backdropLevel = backdropLevel;
    this.page = 0;
    this.chars = 0;
  }

  enter() {
    this.backdrop = getBackdrop(this.game, this.backdropLevel);
    this.game.audio.playMusic(this.music);
    screen(`<div class="screen dim">
        <h1>${escapeHtml(this.title)}</h1>
        <div class="panel card"><p id="story-text" class="story"></p></div>
        <div class="dots">${this.pages.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
        <p id="story-prompt" class="prompt" style="visibility:hidden">Enter ▸</p>
        <div class="foot"><span>Esc: saltar</span><span></span></div>
      </div>`);
    this.renderDots();
  }

  exit() { clearScreen(); }

  renderDots() {
    document.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i === this.page));
  }

  update(dt) {
    const input = this.game.input;
    if (input.pressed('back')) { this.done(); return; }
    const current = this.pages[this.page];
    if (this.chars < current.length) {
      this.chars = Math.min(current.length, this.chars + dt * 45);
      if (input.pressed('confirm')) this.chars = current.length;
      $('story-text').textContent = current.slice(0, Math.floor(this.chars));
      $('story-prompt').style.visibility = this.chars >= current.length ? 'visible' : 'hidden';
      return;
    }
    if (input.pressed('confirm')) {
      this.game.audio.sfx('select');
      this.page++;
      this.chars = 0;
      if (this.page >= this.pages.length) { this.done(); return; }
      this.renderDots();
      $('story-prompt').style.visibility = 'hidden';
    }
  }

  done() {
    if (this.finished) return;
    this.finished = true;
    this.onDone();
  }

  frame(dt) { this.backdrop.frame(dt); }
}
