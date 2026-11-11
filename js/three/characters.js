import { Actor } from './Actor.js';
import { BESTIARY, HUNTER_MODEL, HUNTER_PALETTES } from '../data/bestiary.js';

/** Crea el modelo 3D del cazador con la paleta de la vestimenta equipada. */
export function makeHunter(armor = 0) {
  return new Actor({ ...HUNTER_MODEL, id: `hunter${armor}`, palette: HUNTER_PALETTES[armor] });
}

/** Crea el modelo 3D de un enemigo del bestiario (cada uno con modelo y paleta propios). */
export function makeEnemy(kind) {
  const m = BESTIARY[kind].model;
  return new Actor({ ...m, id: kind, height: m.height * (m.scale || 1) });
}
