import { W, H } from '../core/Game.js';
import { text } from '../gfx/draw.js';
import { CREDITS } from '../data/credits.js';

/** CreditsScene: créditos con desplazamiento vertical. */
export class CreditsScene {
  constructor(game, onDone) {
    this.game = game;
    this.onDone = onDone;
    this.offset = 0;
  }

  update(dt) {
    const input = this.game.input;
    this.offset += dt * (input.isDown('confirm') || input.isDown('down') ? 60 : 18);
    const total = CREDITS.length * 14 + H;
    if (input.pressed('back') || this.offset > total) {
      if (this.done) return;
      this.done = true;
      this.game.audio.sfx('back');
      this.onDone();
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#0b0b10';
    ctx.fillRect(0, 0, W, H);
    CREDITS.forEach(([line, kind], i) => {
      const y = H - this.offset + i * 14;
      if (y < -12 || y > H) return;
      const style = kind === 'h'
        ? { size: 8, color: '#c9a227' }
        : kind === 't' ? { size: 12, color: '#cfd8dc' } : { size: 6, color: '#f2efe6' };
      text(ctx, line, W / 2, y, { align: 'center', ...style });
    });
    text(ctx, 'ESC: salir', 6, H - 10, { size: 5, color: '#555' });
  }
}
