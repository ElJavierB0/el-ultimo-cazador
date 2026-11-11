import { W, H } from '../core/Game.js';
import { text, drawBackground } from '../gfx/draw.js';
import { Sprites, drawSprite } from '../gfx/sprites.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { STORY } from '../data/story.js';
import { StoryScene } from './StoryScene.js';
import { PlatformScene } from './PlatformScene.js';
import { HowToScene } from './HowToScene.js';
import { CreditsScene } from './CreditsScene.js';
import { cursor } from './BattleScene.js';

const OPTIONS = ['JUGAR', 'CÓMO JUGAR', 'CRÉDITOS'];

/** TitleScene: pantalla de inicio (splash) con menú principal. */
export class TitleScene {
  constructor(game) {
    this.game = game;
    this.index = 0;
    this.time = 0;
    this.highScore = ScoreSystem.loadHighScore();
  }

  enter() { this.game.audio.playMusic('title'); }

  update(dt) {
    const { input, audio } = this.game;
    this.time += dt;
    if (input.pressed('up')) { this.index = (this.index + OPTIONS.length - 1) % OPTIONS.length; audio.sfx('move'); }
    if (input.pressed('down')) { this.index = (this.index + 1) % OPTIONS.length; audio.sfx('move'); }
    if (!input.pressed('confirm')) return;
    audio.sfx('select');
    const g = this.game;
    if (this.index === 0) {
      g.newRun();
      g.changeScene(new StoryScene(g, STORY.intro, () => g.changeScene(new PlatformScene(g)), { title: 'PRÓLOGO' }));
    } else if (this.index === 1) {
      g.changeScene(new HowToScene(g, this));
    } else {
      g.changeScene(new CreditsScene(g, () => g.changeScene(this)));
    }
  }

  draw(ctx) {
    const camX = this.time * 12;
    drawBackground(ctx, 'forest', camX, W, H, this.time);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);

    // Acantilado con el cazador mirando la luna
    ctx.fillStyle = '#0c120e';
    ctx.fillRect(0, 140, 110, 36);
    ctx.fillRect(0, 132, 80, 8);
    drawSprite(ctx, Sprites.hunter('idle', 0), 40, 100, { scale: 2 });

    text(ctx, 'EL ÚLTIMO', W / 2 + 30, 26, { align: 'center', size: 12, color: '#cfd8dc' });
    text(ctx, 'CAZADOR', W / 2 + 30, 44, { align: 'center', size: 20, color: '#c9a227' });
    text(ctx, 'Plata para las bestias. Acero para los hombres.', W / 2, 72, { align: 'center', size: 5, color: '#9aa3ad' });

    OPTIONS.forEach((o, i) => {
      const y = 96 + i * 14;
      text(ctx, o, 170, y, { color: i === this.index ? '#ffd34a' : '#f2efe6' });
      if (i === this.index) cursor(ctx, 158, y);
    });

    text(ctx, `RÉCORD ${String(this.highScore).padStart(6, '0')}`, W - 6, H - 12, { align: 'right', size: 6, color: '#9aa3ad' });
    text(ctx, 'M: sonido', 6, H - 12, { size: 6, color: '#666' });
  }
}
