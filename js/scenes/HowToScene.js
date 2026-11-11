import { screen, clearScreen } from '../ui/ui.js';
import { getBackdrop } from './Backdrop.js';

/** HowToScene: instrucciones de juego. */
export class HowToScene {
  constructor(game, back) {
    this.game = game;
    this.back = back;
  }

  enter() {
    this.backdrop = getBackdrop(this.game, 0);
    screen(`<div class="screen dim">
      <h1>Cómo jugar</h1>
      <div class="grid2" style="grid-template-columns:1fr 1fr">
        <div class="panel card"><h3 style="font-family:var(--title);color:var(--gold);margin-bottom:8px">Exploración</h3>
          <table>
            <tr><td>← → / A D</td><td>Moverse</td></tr>
            <tr><td>Espacio / ↑ / W</td><td>Saltar (mantén para más altura)</td></tr>
            <tr><td>P / Esc</td><td>Pausa</td></tr>
            <tr><td>M</td><td>Sonido</td></tr>
          </table></div>
        <div class="panel card"><h3 style="font-family:var(--title);color:var(--gold);margin-bottom:8px">Batalla</h3>
          <table>
            <tr><td>Flechas</td><td>Elegir acción</td></tr>
            <tr><td>Enter</td><td>Confirmar</td></tr>
            <tr><td>Esc</td><td>Regresar</td></tr>
            <tr><td>Clic / toque</td><td>También funciona</td></tr>
          </table></div>
      </div>
      <div class="panel card" style="margin-top:16px">
        <h3 style="font-family:var(--title);color:var(--gold);margin-bottom:8px">Consejos del cazador</h3>
        <p style="line-height:1.7;font-weight:700">• Toca a un enemigo para iniciar la batalla.<br>
        • <b>ACERO</b> es eficaz contra humanos; <b>PLATA</b> contra no-muertos y criaturas arcanas.<br>
        • <b>ASCUA</b> quema e ignora la defensa; <b>ÉGIDA</b> reduce a la mitad el siguiente golpe.<br>
        • Las señales gastan vigor (se recupera 1 por turno). Las hogueras guardan tu avance y te curan.</p>
      </div>
      <p class="prompt">Enter / Esc: volver</p>
    </div>`);
  }

  exit() { clearScreen(); }

  update() {
    const input = this.game.input;
    if (input.pressed('confirm') || input.pressed('back')) {
      this.game.audio.sfx('back');
      this.game.changeScene(this.back);
    }
  }

  frame(dt) { this.backdrop.frame(dt); }
}
