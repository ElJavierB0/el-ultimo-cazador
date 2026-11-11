import { W, H } from '../core/Game.js';
import { text } from '../gfx/draw.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { TitleScene } from './TitleScene.js';

/** GameOverScene: se muestra al perder todas las vidas. */
export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.record = ScoreSystem.saveHighScore(game.score.total);
  }

  enter() {
    this.game.audio.stopMusic();
    this.game.audio.sfx('defeat');
  }

  update(dt) {
    this.time += dt;
    if (this.time > 1.5 && this.game.input.pressed('confirm')) {
      this.game.audio.sfx('select');
      this.game.newRun();
      this.game.changeScene(new TitleScene(this.game));
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#120608';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'HAS CAÍDO', W / 2, 46, { align: 'center', size: 16, color: '#e5484d' });
    text(ctx, 'La niebla cubre Velmora...', W / 2, 74, { align: 'center', color: '#9aa3ad', size: 7 });
    text(ctx, `Puntaje: ${this.game.score.total}`, W / 2, 98, { align: 'center', color: '#ffd34a' });
    if (this.record) text(ctx, '¡Nuevo récord!', W / 2, 112, { align: 'center', color: '#7dffb0', size: 7 });
    if (this.time > 1.5 && Math.floor(this.time * 2) % 2) text(ctx, 'ENTER para volver al título', W / 2, 140, { align: 'center', size: 6 });
  }
}
