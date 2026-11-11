import { W, H } from '../core/Game.js';
import { text, wrap } from '../gfx/draw.js';

/**
 * StoryScene: muestra páginas del guion con efecto de máquina de escribir.
 * ENTER avanza (o completa el texto); ESC salta toda la historia.
 */
export class StoryScene {
  constructor(game, pages, onDone, { music = 'title', title = '' } = {}) {
    this.game = game;
    this.pages = pages;
    this.onDone = onDone;
    this.music = music;
    this.title = title;
    this.page = 0;
    this.chars = 0;
    this.time = 0;
  }

  enter() { this.game.audio.playMusic(this.music); }

  update(dt) {
    const input = this.game.input;
    this.time += dt;
    const current = this.pages[this.page];
    if (input.pressed('back')) { this.done(); return; }
    if (this.chars < current.length) {
      this.chars += dt * 40;
      if (input.pressed('confirm')) this.chars = current.length;
      return;
    }
    if (input.pressed('confirm')) {
      this.game.audio.sfx('select');
      this.page++;
      this.chars = 0;
      if (this.page >= this.pages.length) this.done();
    }
  }

  done() {
    if (this.finished) return;
    this.finished = true;
    this.onDone();
  }

  draw(ctx) {
    ctx.fillStyle = '#0b0b10';
    ctx.fillRect(0, 0, W, H);
    // Ceniza que cae
    ctx.fillStyle = 'rgba(200,200,200,0.25)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 53 + Math.sin(this.time + i) * 10) % W;
      const y = (i * 37 + this.time * (10 + (i % 5) * 4)) % H;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    if (this.title) text(ctx, this.title, W / 2, 18, { align: 'center', color: '#c9a227' });
    const page = this.pages[Math.min(this.page, this.pages.length - 1)];
    const lines = wrap(ctx, page.slice(0, Math.floor(this.chars)), W - 48);
    lines.forEach((l, i) => text(ctx, l, 24, 52 + i * 14));
    if (this.chars >= page.length && Math.floor(this.time * 2) % 2) {
      text(ctx, 'ENTER', W - 24, H - 20, { align: 'right', color: '#9aa3ad' });
    }
    text(ctx, 'ESC: saltar', 24, H - 20, { color: '#555', size: 6 });
  }
}
