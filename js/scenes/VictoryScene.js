import { screen, clearScreen, escapeHtml } from '../ui/ui.js';
import { ScoreSystem, POINTS } from '../systems/ScoreSystem.js';
import { getBackdrop } from './Backdrop.js';
import { CreditsScene } from './CreditsScene.js';
import { TitleScene } from './TitleScene.js';

/** VictoryScene: resumen final de la partida al vencer al último guardián. */
export class VictoryScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.lifeBonus = game.score.lifeBonus(game.lives);
    this.record = ScoreSystem.saveHighScore(game.score.total);
  }

  enter() {
    this.backdrop = getBackdrop(this.game, 0);
    this.backdrop.hero.play('cheer');
    this.game.audio.playMusic('title');
    this.game.audio.sfx('clear');
    const g = this.game;
    const rows = [
      ['Enemigos derrotados', g.stats.enemies],
      ['Monedas', g.hunter.coins],
      ['Nivel del cazador', g.hunter.level],
      ['Vestimenta', g.hunter.armorName],
      [`Bono de vidas (${g.lives} × ${POINTS.LIFE_BONUS})`, `+${this.lifeBonus}`],
    ].map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('');
    screen(`<div class="screen dim">
      <h1>¡Velmora está a salvo!</h1>
      <div class="panel card" style="width:min(560px,92vw)"><table>${rows}<tr class="total"><td>PUNTAJE FINAL</td><td>${g.score.total}</td></tr></table></div>
      ${this.record ? '<p class="sub" style="color:#8dffb0;margin-top:12px">¡Nuevo récord!</p>' : ''}
      <p class="prompt">Enter: créditos</p>
    </div>`);
  }

  exit() { clearScreen(); }

  update(dt) {
    this.time += dt;
    if (this.time > 1.2 && this.game.input.pressed('confirm')) {
      const g = this.game;
      g.audio.sfx('select');
      g.changeScene(new CreditsScene(g, () => { g.newRun(); g.changeScene(new TitleScene(g)); }));
    }
  }

  frame(dt) { this.backdrop.frame(dt); }
}
