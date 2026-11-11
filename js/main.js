import { Game } from './core/Game.js';
import { loadAll } from './three/assets.js';
import { TitleScene } from './scenes/TitleScene.js';
import { $ } from './ui/ui.js';

/**
 * Punto de entrada: carga tipografías y modelos 3D, y arranca el juego en la pantalla de título.
 */
async function boot() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  } catch { /* si las fuentes no cargan se usan las del sistema */ }

  try {
    await loadAll((p) => {
      $('load-bar').style.width = `${Math.round(p * 100)}%`;
      $('load-text').textContent = `Cargando modelos… ${Math.round(p * 100)}%`;
    });
  } catch (err) {
    $('load-text').textContent = 'No se pudieron cargar los modelos. Abre el juego desde un servidor (ver README).';
    console.error(err);
    return;
  }

  const game = new Game($('stage'));
  game.start(new TitleScene(game));
  $('loading').style.opacity = 0;
  setTimeout(() => $('loading').remove(), 700);
  // Acceso para depurar desde la consola, solo en desarrollo local
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__game = game;
}

boot();
