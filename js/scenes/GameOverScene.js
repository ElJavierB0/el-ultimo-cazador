import { screen, clearScreen } from '../ui/ui.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { TitleScene } from './TitleScene.js';

/** GameOverScene: se muestra al perder todas las vidas (sobre el último escenario, oscurecido). */
export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.record = ScoreSystem.saveHighScore(game.score.total);
  }

  enter() {
    this.game.audio.stopMusic();
    this.game.audio.sfx('defeat');
    screen(`<div class="screen dim" style="background:radial-gradient(ellipse at center, rgba(40,0,6,0.55), rgba(10,0,2,0.95))">
      <h1>Has caído</h1>
      <p class="sub">La ceniza vuelve a cubrir Velmora...</p>
      <div class="panel card" style="width:auto;text-align:center"><div class="label">PUNTAJE</div><div class="score">${this.game.score.total}</div></div>
      ${this.record ? '<p class="sub" style="color:#8dffb0;margin-top:12px">¡Nuevo récord!</p>' : ''}
      <p class="prompt">Enter para volver al título</p>
    </div>`);
  }

  exit() { clearScreen(); }

  update(dt) {
    this.time += dt;
    if (this.time > 1.2 && this.game.input.pressed('confirm')) {
      this.game.audio.sfx('select');
      this.game.newRun();
      this.game.changeScene(new TitleScene(this.game));
    }
  }
}
