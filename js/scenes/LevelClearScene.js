import { screen, clearScreen, escapeHtml } from '../ui/ui.js';
import { LEVELS } from '../data/levels.js';
import { STORY } from '../data/story.js';
import { StoryScene } from './StoryScene.js';
import { PlatformScene } from './PlatformScene.js';
import { VictoryScene } from './VictoryScene.js';

const LABELS = {
  COIN: 'Monedas', POTION_PICKUP: 'Pociones', CHECKPOINT: 'Hogueras', ENEMY_DEFEATED: 'Enemigos derrotados',
  EFFECTIVE_HIT: 'Golpes certeros', CRITICAL_HIT: 'Golpes críticos', FLAWLESS_BATTLE: 'Batallas sin daño',
  FLEE: 'Huidas', LIFE_LOST: 'Vidas perdidas', LEVEL_CLEAR: 'Nivel completado', TIME_BONUS: 'Bono de tiempo',
};

/** LevelClearScene: desglose del puntaje del nivel y recompensa de vestimenta (sobre el nivel en 3D). */
export class LevelClearScene {
  constructor(game, elapsed, platform) {
    this.game = game;
    this.elapsed = elapsed;
    this.platform = platform;
    this.levelName = LEVELS[game.levelIndex].name;
    game.score.add('LEVEL_CLEAR');
    game.score.timeBonus(elapsed);
    this.rows = Object.entries(game.score.summary()).map(([k, v]) => [LABELS[k] || k, v]);
    this.armor = game.hunter.unlockArmor(game.levelIndex + 1);
    game.hunter.fullHeal();
    this.time = 0;
  }

  enter() {
    const mins = Math.floor(this.elapsed / 60);
    const secs = String(Math.floor(this.elapsed % 60)).padStart(2, '0');
    const rows = this.rows.map(([label, pts]) => `<tr><td>${escapeHtml(label)}</td><td class="${pts >= 0 ? 'pos' : 'neg'}">${pts >= 0 ? '+' : ''}${pts}</td></tr>`).join('');
    screen(`<div class="screen dim">
      <h1>¡Nivel completado!</h1>
      <p class="sub">${escapeHtml(this.levelName)} · Tiempo ${mins}:${secs}</p>
      <div class="grid2">
        <div class="panel card"><table>${rows}<tr class="total"><td>TOTAL</td><td>${this.game.score.total}</td></tr></table></div>
        <div class="panel card reward">
          <h3>${this.armor ? 'Nueva vestimenta' : 'Cazador'}</h3>
          <div class="big">${this.armor ? escapeHtml(this.armor.name) : `Nivel ${this.game.hunter.level}`}</div>
          ${this.armor ? `<div class="def">Defensa +${this.armor.def}</div>` : ''}
          <div class="def">Vida restaurada</div>
        </div>
      </div>
      <p class="prompt">Enter para continuar</p>
    </div>`);
  }

  exit() { clearScreen(); }

  update(dt) {
    this.time += dt;
    if (this.time < 0.8 || !this.game.input.pressed('confirm')) return;
    const g = this.game;
    g.audio.sfx('select');
    const finished = g.levelIndex;
    g.levelIndex++;
    if (g.levelIndex >= LEVELS.length) {
      g.changeScene(new StoryScene(g, STORY.ending, () => g.changeScene(new VictoryScene(g)), { title: 'Epílogo', backdropLevel: 0 }));
    } else {
      const next = LEVELS[g.levelIndex];
      g.changeScene(new StoryScene(g, STORY.afterLevel[finished], () => g.changeScene(new PlatformScene(g)), { title: next.name, backdropLevel: g.levelIndex }));
    }
  }

  frame(dt) { this.platform.world.update(dt, this.platform.hero.group.position); this.platform.hero.update(dt); }
}
