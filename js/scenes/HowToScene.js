import { W, H } from '../core/Game.js';
import { text } from '../gfx/draw.js';

const LINES = [
  ['MAPA', '#c9a227'],
  ['Flechas / A D : moverse', null],
  ['Espacio / W / Arriba : saltar', null],
  ['P / ESC : pausa     M : sonido', null],
  ['Toca un monstruo para iniciar batalla.', '#9aa3ad'],
  ['Hogueras: guardan avance y curan.', '#9aa3ad'],
  ['', null],
  ['BATALLA', '#c9a227'],
  ['Flechas: elegir   ENTER: confirmar', null],
  ['ESC: regresar al menú anterior', null],
  ['ACERO > humanos   PLATA > monstruos', '#9fd3ff'],
  ['ASCUA quema   ÉGIDA reduce el daño', '#9fd3ff'],
  ['Las señales gastan VIGOR (+1 por turno).', '#9aa3ad'],
];

/** HowToScene: instrucciones de juego. */
export class HowToScene {
  constructor(game, back) {
    this.game = game;
    this.back = back;
  }

  update() {
    const input = this.game.input;
    if (input.pressed('confirm') || input.pressed('back')) {
      this.game.audio.sfx('back');
      this.game.changeScene(this.back);
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#0e1016';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'CÓMO JUGAR', W / 2, 8, { align: 'center', size: 10, color: '#cfd8dc' });
    LINES.forEach(([l, c], i) => text(ctx, l, 14, 26 + i * 10, { size: 6, color: c || '#f2efe6' }));
    text(ctx, 'ENTER / ESC: volver', W / 2, H - 10, { align: 'center', size: 5, color: '#666' });
  }
}
