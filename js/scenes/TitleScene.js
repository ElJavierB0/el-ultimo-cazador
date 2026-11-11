import { screen, clearScreen, menuNav } from '../ui/ui.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { STORY } from '../data/story.js';
import { getBackdrop } from './Backdrop.js';
import { StoryScene } from './StoryScene.js';
import { PlatformScene } from './PlatformScene.js';
import { HowToScene } from './HowToScene.js';
import { CreditsScene } from './CreditsScene.js';

const OPTIONS = ['Jugar', 'Cómo jugar', 'Créditos'];

/** TitleScene: pantalla de inicio sobre el bosque en 3D, con el cazador junto a la hoguera. */
export class TitleScene {
  constructor(game) {
    this.game = game;
    this.index = 0;
  }

  enter() {
    this.backdrop = getBackdrop(this.game, 0);
    this.game.audio.playMusic('title');
    this.render();
  }

  exit() { clearScreen(); }

  render() {
    const record = String(ScoreSystem.loadHighScore()).padStart(6, '0');
    const el = screen(`
      <div class="title-screen">
        <div class="t1">EL ÚLTIMO</div>
        <div class="title-xl">CAZADOR</div>
        <div class="tag">Plata para los muertos. Acero para los hombres.</div>
        <div class="opts">${OPTIONS.map((o, i) => `<button data-i="${i}" class="${i === this.index ? 'sel' : ''}">${o}</button>`).join('')}</div>
      </div>
      <div class="footbar">
        <span>↑ ↓ elegir · Enter confirmar · M sonido</span><span>Récord ${record}</span>
      </div>`);
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { this.index = Number(b.dataset.i); this.choose(); }));
  }

  update() {
    const input = this.game.input;
    const next = menuNav(input, OPTIONS.length, this.index);
    if (next !== this.index) { this.index = next; this.game.audio.sfx('move'); this.render(); }
    if (input.pressed('confirm')) this.choose();
  }

  choose() {
    const g = this.game;
    g.audio.sfx('select');
    if (this.index === 0) {
      g.newRun();
      g.changeScene(new StoryScene(g, STORY.intro, () => g.changeScene(new PlatformScene(g)), { title: 'Prólogo' }));
    } else if (this.index === 1) {
      g.changeScene(new HowToScene(g, this));
    } else {
      g.changeScene(new CreditsScene(g, () => g.changeScene(this)));
    }
  }

  frame(dt) { this.backdrop.frame(dt); }
}
