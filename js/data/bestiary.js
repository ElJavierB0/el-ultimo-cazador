/**
 * Bestiario: estadísticas, ataques y apariencia 3D de cada enemigo.
 * Cada enemigo usa un modelo distinto (no se repiten) con una paleta oscura propia.
 * type determina la eficacia de las armas (ver EFFECTIVENESS).
 */
export const BESTIARY = {
  /* ----- Nivel 1: Bosque de Velmora ----- */
  bandido: {
    name: 'Bandido', type: 'humano', hp: 22, atk: 5, def: 1, xp: 35, score: 100, coins: 3,
    model: { file: 'Rogue', height: 1.6, hide: ['1H_Crossbow', '2H_Crossbow', 'Throwable'], palette: { hue: 0.02, sat: 0.55, light: 0.62 } },
    moves: [
      { name: 'Tajo', power: 4, weight: 3 },
      { name: 'Patada sucia', power: 2, weight: 2, effect: 'lowerDef' },
    ],
  },
  saqueador: {
    name: 'Saqueador', type: 'humano', hp: 30, atk: 6, def: 2, xp: 50, score: 150, coins: 5,
    model: { file: 'Barbarian', height: 1.7, hide: ['2H_Axe', 'Mug', '1H_Axe_Offhand'], palette: { hue: -0.03, sat: 0.5, light: 0.58 } },
    moves: [
      { name: 'Hachazo', power: 5, weight: 3 },
      { name: 'Grito de guerra', power: 0, weight: 1, effect: 'raiseAtk' },
    ],
  },
  caballero: {
    name: 'Caballero Caído', type: 'humano', hp: 60, atk: 7, def: 3, xp: 160, score: 1000, coins: 15, boss: true,
    model: { file: 'Knight', height: 1.75, scale: 1.35, hide: ['1H_Sword_Offhand', 'Badge_Shield', 'Rectangle_Shield', 'Round_Shield', '2H_Sword'], palette: { hue: 0.0, sat: 0.18, light: 0.48, tint: '#5a1010', tintAmount: 0.25 } },
    moves: [
      { name: 'Estocada', power: 5, weight: 3 },
      { name: 'Embestida con escudo', power: 8, weight: 1 },
      { name: 'Juramento roto', power: 0, weight: 1, effect: 'raiseAtk' },
    ],
  },
  /* ----- Nivel 2: Pantano de Bruma ----- */
  esqueleto: {
    name: 'Esqueleto Errante', type: 'nomuerto', hp: 24, atk: 6, def: 1, xp: 45, score: 120, coins: 2,
    model: { file: 'Skeleton_Minion', height: 1.6, palette: { hue: 0.0, sat: 0.4, light: 0.72, tint: '#4a7a3a', tintAmount: 0.3 }, eyes: '#7dff6a' },
    moves: [
      { name: 'Garra ósea', power: 4, weight: 3 },
      { name: 'Chasquido', power: 2, weight: 2, effect: 'lowerDef' },
    ],
  },
  asesino: {
    name: 'Asesino Óseo', type: 'nomuerto', hp: 28, atk: 7, def: 2, xp: 55, score: 180, coins: 4,
    model: { file: 'Skeleton_Rogue', height: 1.6, palette: { hue: 0.0, sat: 0.35, light: 0.6, tint: '#2a3a5a', tintAmount: 0.3 }, eyes: '#6ad8ff' },
    moves: [
      { name: 'Puñalada', power: 5, weight: 3 },
      { name: 'Velo de sombras', power: 0, weight: 1, effect: 'lowerAtk' },
    ],
  },
  bruja: {
    name: 'Bruja del Pantano', type: 'arcano', hp: 65, atk: 8, def: 3, xp: 220, score: 1500, coins: 20, boss: true,
    model: { file: 'Mage', height: 1.7, scale: 1.3, hide: ['Spellbook', 'Spellbook_open', '1H_Wand'], palette: { hue: 0.35, sat: 0.7, light: 0.55, tint: '#3a5a2a', tintAmount: 0.2 } },
    moves: [
      { name: 'Maldición', power: 6, weight: 3, anim: 'cast' },
      { name: 'Brebaje', power: 0, weight: 1, effect: 'heal', anim: 'raise' },
      { name: 'Niebla', power: 2, weight: 1, effect: 'lowerAtk', anim: 'cast' },
    ],
  },
  /* ----- Nivel 3: Castillo de Ceniza ----- */
  hechicero: {
    name: 'Hechicero Esquelético', type: 'nomuerto', hp: 30, atk: 8, def: 2, xp: 70, score: 220, coins: 6,
    model: { file: 'Skeleton_Mage', height: 1.65, palette: { hue: 0.75, sat: 0.6, light: 0.55, tint: '#3a1a5a', tintAmount: 0.3 }, eyes: '#c27aff' },
    moves: [
      { name: 'Rayo sombrío', power: 6, weight: 3, anim: 'cast' },
      { name: 'Lamento', power: 0, weight: 1, effect: 'lowerAtk', anim: 'raise' },
    ],
  },
  senor: {
    name: 'Señor de la Ceniza', type: 'nomuerto', hp: 90, atk: 10, def: 4, xp: 400, score: 2500, coins: 30, boss: true,
    model: { file: 'Skeleton_Warrior', height: 1.8, scale: 1.6, palette: { hue: 0.0, sat: 0.6, light: 0.45, tint: '#7a1a0a', tintAmount: 0.45 }, eyes: '#ff7a1a' },
    moves: [
      { name: 'Hoja de ceniza', power: 7, weight: 3 },
      { name: 'Llamarada negra', power: 10, weight: 1, anim: 'cast' },
      { name: 'Absorber', power: 4, weight: 1, effect: 'drain' },
    ],
  },
};

/** El cazador: capa negra, cuero gris oscuro y espada de plata. */
export const HUNTER_MODEL = {
  id: 'hunter', file: 'Rogue_Hooded', height: 1.65, sword: true,
  hide: ['1H_Crossbow', '2H_Crossbow', 'Throwable', 'Knife_Offhand'],
};
/** Paleta del cazador según la vestimenta equipada. */
export const HUNTER_PALETTES = [
  { hue: 0.0, sat: 0.3, light: 0.82 },                                    // Jubón de cuero: gris carbón
  { hue: 0.0, sat: 0.2, light: 0.95, tint: '#8a9ab4', tintAmount: 0.35 },   // Cota de malla: acero azulado
  { hue: 0.0, sat: 0.12, light: 0.62, tint: '#6a0a1a', tintAmount: 0.4 },   // Armadura de la Orden: negro con rojo
];

/** Etiqueta visible de cada tipo. */
export const TYPE_LABEL = { humano: 'Humano', nomuerto: 'No-muerto', arcano: 'Arcano' };

/** Multiplicador de daño: arma o señal contra el tipo del enemigo. */
export const EFFECTIVENESS = {
  acero: { humano: 1.5, nomuerto: 0.5, arcano: 1.0 },
  plata: { humano: 0.5, nomuerto: 1.5, arcano: 1.25 },
  ascua: { humano: 1.0, nomuerto: 1.5, arcano: 0.75 },
};

/** Armas y señales del cazador. */
export const PLAYER_MOVES = {
  acero: { name: 'Espada de acero', short: 'ACERO', power: 6, cost: 0, hint: 'Eficaz contra humanos' },
  plata: { name: 'Espada de plata', short: 'PLATA', power: 6, cost: 0, hint: 'Eficaz contra no-muertos y criaturas arcanas' },
  ascua: { name: 'Señal Ascua', short: 'ASCUA', power: 9, cost: 2, hint: 'Fuego: ignora la defensa y quema' },
  egida: { name: 'Señal Égida', short: 'ÉGIDA', power: 0, cost: 1, hint: 'Reduce a la mitad el siguiente golpe' },
};

/** Vestimenta: se desbloquea al completar cada nivel. */
export const ARMORS = [
  { name: 'Jubón de cuero', def: 2 },
  { name: 'Cota de malla', def: 4 },
  { name: 'Armadura de la Orden', def: 6 },
];
