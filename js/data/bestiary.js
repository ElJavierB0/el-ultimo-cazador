/**
 * Bestiario: estadísticas de cada monstruo y ataques disponibles.
 * type determina la eficacia de las espadas (ver EFFECTIVENESS).
 */
export const BESTIARY = {
  bandido: {
    name: 'Bandido', type: 'humano', hp: 22, atk: 5, def: 1, xp: 30, score: 100, coins: 3,
    moves: [
      { name: 'Tajo', power: 4, weight: 3 },
      { name: 'Patada sucia', power: 2, weight: 2, effect: 'lowerDef' },
    ],
  },
  lobo: {
    name: 'Lobo', type: 'bestia', hp: 18, atk: 6, def: 0, xp: 35, score: 120, coins: 1,
    moves: [
      { name: 'Mordisco', power: 4, weight: 3 },
      { name: 'Aullido', power: 0, weight: 1, effect: 'raiseAtk' },
    ],
  },
  lodoso: {
    name: 'Lodoso', type: 'monstruo', hp: 28, atk: 6, def: 2, xp: 45, score: 150, coins: 2,
    moves: [
      { name: 'Zarpazo', power: 5, weight: 3 },
      { name: 'Lodo', power: 2, weight: 2, effect: 'lowerDef' },
    ],
  },
  espectro: {
    name: 'Espectro', type: 'espectro', hp: 26, atk: 7, def: 3, xp: 55, score: 200, coins: 4,
    moves: [
      { name: 'Toque helado', power: 5, weight: 3 },
      { name: 'Lamento', power: 0, weight: 1, effect: 'lowerAtk' },
    ],
  },
  /* ----- Jefes ----- */
  huargo: {
    name: 'Huargo Alfa', type: 'bestia', hp: 55, atk: 7, def: 2, xp: 150, score: 1000, coins: 15, boss: true,
    moves: [
      { name: 'Colmillos', power: 5, weight: 3 },
      { name: 'Aullido', power: 0, weight: 1, effect: 'raiseAtk' },
      { name: 'Embestida', power: 8, weight: 1 },
    ],
  },
  bruja: {
    name: 'Bruja del Pantano', type: 'monstruo', hp: 65, atk: 8, def: 3, xp: 220, score: 1500, coins: 20, boss: true,
    moves: [
      { name: 'Maldición', power: 6, weight: 3 },
      { name: 'Brebaje', power: 0, weight: 1, effect: 'heal' },
      { name: 'Niebla', power: 2, weight: 1, effect: 'lowerAtk' },
    ],
  },
  senor: {
    name: 'Señor de la Ceniza', type: 'espectro', hp: 90, atk: 10, def: 4, xp: 400, score: 2500, coins: 30, boss: true,
    moves: [
      { name: 'Hoja de ceniza', power: 7, weight: 3 },
      { name: 'Llamarada negra', power: 10, weight: 1 },
      { name: 'Lamento', power: 0, weight: 1, effect: 'lowerAtk' },
      { name: 'Absorber', power: 4, weight: 1, effect: 'drain' },
    ],
  },
};

/** Multiplicador de daño: arma o señal contra el tipo del monstruo. */
export const EFFECTIVENESS = {
  acero: { humano: 1.5, bestia: 1.0, monstruo: 0.75, espectro: 0.5 },
  plata: { humano: 0.5, bestia: 1.25, monstruo: 1.5, espectro: 1.5 },
  ascua: { humano: 1.0, bestia: 1.25, monstruo: 1.0, espectro: 1.5 },
};

/** Armas y señales del cazador. */
export const PLAYER_MOVES = {
  acero: { name: 'Espada de acero', short: 'ACERO', power: 6, cost: 0, hint: 'Eficaz contra humanos' },
  plata: { name: 'Espada de plata', short: 'PLATA', power: 6, cost: 0, hint: 'Eficaz contra monstruos' },
  ascua: { name: 'Señal Ascua', short: 'ASCUA', power: 9, cost: 2, hint: 'Fuego: ignora DEF y quema' },
  egida: { name: 'Señal Égida', short: 'ÉGIDA', power: 0, cost: 1, hint: 'Reduce a la mitad el daño' },
};

/** Vestimenta: se desbloquea al completar cada nivel. */
export const ARMORS = [
  { name: 'Jubón de cuero', def: 2 },
  { name: 'Cota de malla', def: 4 },
  { name: 'Armadura de la Orden', def: 6 },
];
