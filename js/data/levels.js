/**
 * Definición de niveles con un pequeño "constructor" (builder).
 * Coordenadas en tiles de 16 px. El mapa tiene 11 filas (0 = arriba, 10 = abajo).
 * ground(x0, x1, h): suelo desde la columna x0 hasta x1 (sin incluir) con h filas de alto.
 * Un enemigo/objeto en la fila y está parado sobre el tile de la fila y + 1.
 */
export const LEVELS = [
  {
    name: 'Bosque de Velmora',
    theme: 'forest',
    music: 'forest',
    width: 112,
    boss: 'huargo',
    build(b) {
      b.start(2, 8);
      b.ground(0, 20, 2);
      b.coins(6, 6, 3);
      b.enemy('bandido', 15, 8);

      b.ground(23, 32, 2);
      b.platform(25, 6, 4);
      b.coins(25, 5, 4);
      b.ground(32, 41, 3);
      b.potion(39, 7);

      b.ground(41, 56, 2);
      b.checkpoint(43, 8);
      b.platform(47, 6, 3);
      b.platform(51, 4, 3);
      b.coins(51, 3, 3);

      b.ground(59, 76, 2);
      b.enemy('saqueador', 66, 8);
      b.coins(62, 6, 3);

      b.platform(77, 7, 3);
      b.ground(81, 112, 2);
      b.checkpoint(84, 8);
      b.potion(88, 8);
      b.enemy('caballero', 98, 8);
      b.exit(107, 8);
    },
  },
  {
    name: 'Pantano de Bruma',
    theme: 'swamp',
    music: 'swamp',
    width: 120,
    boss: 'bruja',
    build(b) {
      b.start(2, 8);
      b.ground(0, 14, 2);
      b.coins(5, 6, 3);

      b.water(14, 17);
      b.ground(17, 30, 2);
      b.enemy('esqueleto', 22, 8);
      b.platform(24, 5, 3);
      b.potion(25, 4);

      b.water(30, 36);
      b.platform(32, 7, 2);
      b.ground(36, 50, 2);
      b.checkpoint(38, 8);
      b.coins(42, 6, 4);

      b.ground(50, 54, 3);
      b.ground(54, 60, 4);

      b.water(60, 64);
      b.ground(64, 80, 2);
      b.enemy('asesino', 72, 8);
      b.platform(70, 6, 4);
      b.coins(70, 5, 4);

      b.water(80, 83);
      b.ground(83, 120, 2);
      b.checkpoint(86, 8);
      b.potion(90, 8);
      b.enemy('bruja', 106, 8);
      b.exit(115, 8);
    },
  },
  {
    name: 'Castillo de Ceniza',
    theme: 'castle',
    music: 'castle',
    width: 120,
    boss: 'senor',
    build(b) {
      b.start(2, 8);
      b.ground(0, 16, 2);
      b.coins(6, 6, 3);

      b.ground(19, 34, 2);
      b.platform(24, 6, 3);
      b.coins(24, 5, 3);

      b.ground(34, 42, 3);
      b.ground(42, 50, 4);
      b.potion(46, 5);

      b.ground(53, 70, 2);
      b.checkpoint(55, 8);
      b.platform(58, 5, 4);
      b.coins(58, 4, 4);
      b.enemy('hechicero', 64, 8);

      b.platform(71, 7, 2);
      b.ground(74, 92, 2);
      b.coins(80, 6, 4);

      b.ground(95, 120, 2);
      b.checkpoint(97, 8);
      b.potion(100, 8);
      b.enemy('senor', 108, 8);
      b.exit(116, 8);
    },
  },
];
