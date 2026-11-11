import { W, H } from '../core/Game.js';
import { text } from '../gfx/draw.js';
import { ScoreSystem, POINTS } from '../systems/ScoreSystem.js';
import { CreditsScene } from './CreditsScene.js';
import { TitleScene } from './TitleScene.js';

/** VictoryScene: resumen final de la partida al vencer al último jefe. */
export class VictoryScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.lifeBonus = game.score.lifeBonus(game.lives);
    this.record = ScoreSystem.saveHighScore(game.score.total);
  }

  enter() {
    this.game.audio.playMusic('title');
    this.game.audio.sfx('clear');
  }

  update(dt) {
    this.time += dt;
    if (this.time > 1.5 && this.game.input.pressed('confirm')) {
      const g = this.game;
      g.audio.sfx('select');
      g.changeScene(new CreditsScene(g, () => { g.newRun(); g.changeScene(new TitleScene(g)); }));
    }
  }

  draw(ctx) {
    const g = this.game;
    ctx.fillStyle = '#0e1016';
    ctx.fillRect(0, 0, W, H);
    text(ctx, '¡VELMORA ESTÁ A SALVO!', W / 2, 18, { align: 'center', size: 10, color: '#c9a227' });
    const rows = [
      ['Monstruos derrotados', g.stats.enemies],
      ['Monedas', g.hunter.coins],
      ['Nivel del cazador', g.hunter.level],
      ['Vestimenta', g.hunter.armorName],
      [`Bono vidas (${g.lives} x ${POINTS.LIFE_BONUS})`, `+${this.lifeBonus}`],
    ];
    rows.forEach(([k, v], i) => {
      text(ctx, k, 30, 48 + i * 14, { size: 7 });
      text(ctx, String(v), W - 30, 48 + i * 14, { size: 7, align: 'right', color: '#9fd3ff' });
    });
    text(ctx, `PUNTAJE FINAL: ${g.score.total}`, W / 2, 128, { align: 'center', color: '#ffd34a' });
    if (this.record) text(ctx, '¡Nuevo récord!', W / 2, 142, { align: 'center', color: '#7dffb0', size: 7 });
    if (this.time > 1.5 && Math.floor(this.time * 2) % 2) text(ctx, 'ENTER: créditos', W / 2, 158, { align: 'center', size: 6 });
  }
}
