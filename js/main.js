import { Game } from './core/Game.js';
import { TitleScene } from './scenes/TitleScene.js';

/**
 * Punto de entrada: espera a que cargue la fuente pixelada y arranca el juego.
 */
async function boot() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  try {
    await Promise.race([
      document.fonts.load('8px "Press Start 2P"'),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* si la fuente no carga se usa monospace */ }
  const game = new Game(document.getElementById('game'));
  game.start(new TitleScene(game));
  // Acceso para depurar desde la consola, solo en desarrollo local
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__game = game;
}

boot();
