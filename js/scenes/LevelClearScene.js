import { W, H } from '../core/Game.js';
import { text } from '../gfx/draw.js';
import { LEVELS } from '../data/levels.js';
import { STORY } from '../data/story.js';
import { StoryScene } from './StoryScene.js';
import { PlatformScene } from './PlatformScene.js';
import { VictoryScene } from './VictoryScene.js';

const LABELS = {
  COIN: 'Monedas',
  POTION_PICKUP: 'Pociones',
  CHECKPOINT: 'Hogueras',
  ENEMY_DEFEATED: 'Monstruos',
  EFFECTIVE_HIT: 'Golpes certeros',
  CRITICAL_HIT: 'Críticos',
  FLAWLESS_BATTLE: 'Batallas sin daño',
  FLEE: 'Huidas',
  LIFE_LOST: 'Vidas perdidas',
  LEVEL_CLEAR: 'Nivel completado',
  TIME_BONUS: 'Bono de tiempo',
};

/**
 * LevelClearScene: desglose del puntaje del nivel y recompensa de vestimenta.
 */
export class LevelClearScene {
  constructor(game, elapsed) {
    this.game = game;
    this.elapsed = elapsed;
    game.score.add('LEVEL_CLEAR');
    game.score.timeBonus(elapsed);
    this.rows = Object.entries(game.score.summary()).map(([k, v]) => [LABELS[k] || k, v]);
    this.armor = game.hunter.unlockArmor(game.levelIndex + 1);
    game.hunter.fullHeal();
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.time > 1 && this.game.input.pressed('confirm')) {
      const g = this.game;
      g.audio.sfx('select');
      const finished = g.levelIndex;
      g.levelIndex++;
      if (g.levelIndex >= LEVELS.length) {
        g.changeScene(new StoryScene(g, STORY.ending, () => g.changeScene(new VictoryScene(g)), { title: 'EPÍLOGO' }));
      } else {
        g.changeScene(new StoryScene(g, STORY.afterLevel[finished], () => g.changeScene(new PlatformScene(g)), { title: LEVELS[g.levelIndex].name.toUpperCase() }));
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#0e1016';
    ctx.fillRect(0, 0, W, H);
    text(ctx, '¡NIVEL COMPLETADO!', W / 2, 10, { align: 'center', color: '#c9a227', size: 12 });
    const mins = Math.floor(this.elapsed / 60);
    const secs = String(Math.floor(this.elapsed % 60)).padStart(2, '0');
    text(ctx, `Tiempo ${mins}:${secs}`, W / 2, 28, { align: 'center', color: '#9aa3ad', size: 7 });

    const shown = Math.floor(this.time * 8);
    this.rows.slice(0, shown).forEach(([label, pts], i) => {
      const y = 40 + i * 8;
      text(ctx, label, 40, y, { size: 6 });
      text(ctx, `${pts >= 0 ? '+' : ''}${pts}`, W - 40, y, { size: 6, align: 'right', color: pts >= 0 ? '#7dffb0' : '#ff8080' });
    });
    if (shown >= this.rows.length) {
      text(ctx, `TOTAL  ${this.game.score.total}`, W / 2, H - 38, { align: 'center', color: '#ffd34a' });
      if (this.armor) text(ctx, `Nueva vestimenta: ${this.armor.name}`, W / 2, H - 26, { align: 'center', color: '#9fd3ff', size: 6 });
      if (Math.floor(this.time * 2) % 2) text(ctx, 'ENTER para continuar', W / 2, H - 14, { align: 'center', color: '#9aa3ad', size: 6 });
    }
  }
}
