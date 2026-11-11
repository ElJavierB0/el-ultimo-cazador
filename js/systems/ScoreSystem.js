/**
 * ScoreSystem: calcula el puntaje a partir de eventos del juego.
 * Cada evento suma (o resta) puntos según la tabla POINTS y queda registrado
 * para mostrar el desglose al final de cada nivel.
 */
export const POINTS = {
  COIN: 10,                 // Recoger una moneda
  POTION_PICKUP: 25,        // Recoger una poción
  CHECKPOINT: 50,           // Encender una hoguera
  EFFECTIVE_HIT: 10,        // Golpe eficaz (arma correcta contra el tipo de monstruo)
  CRITICAL_HIT: 15,         // Golpe crítico
  FLAWLESS_BATTLE: 50,      // Ganar una batalla sin recibir daño
  LEVEL_CLEAR: 500,         // Completar un nivel
  TIME_LIMIT: 240,          // Segundos de referencia para el bono de tiempo
  TIME_BONUS_PER_SEC: 5,    // Puntos por cada segundo por debajo del límite
  LIFE_BONUS: 1000,         // Por cada vida restante al terminar el juego
  FLEE: -25,                // Huir de una batalla
  LIFE_LOST: -200,          // Perder una vida
};

export class ScoreSystem {
  constructor() {
    this.total = 0;
    this.levelLog = [];
  }

  /** Registra un evento; enemy recibe los puntos propios del monstruo. */
  add(event, amount = null) {
    const pts = amount ?? POINTS[event] ?? 0;
    this.total = Math.max(0, this.total + pts);
    this.levelLog.push({ event, pts });
    return pts;
  }

  enemyDefeated(enemyData) {
    return this.add('ENEMY_DEFEATED', enemyData.score);
  }

  timeBonus(seconds) {
    const bonus = Math.max(0, Math.floor(POINTS.TIME_LIMIT - seconds)) * POINTS.TIME_BONUS_PER_SEC;
    return this.add('TIME_BONUS', bonus);
  }

  lifeBonus(lives) {
    return this.add('LIFE_BONUS', lives * POINTS.LIFE_BONUS);
  }

  /** Suma los puntos del nivel actual agrupados por evento. */
  summary() {
    const out = {};
    for (const { event, pts } of this.levelLog) out[event] = (out[event] || 0) + pts;
    return out;
  }

  newLevel() {
    this.levelLog = [];
  }

  static loadHighScore() {
    try { return parseInt(localStorage.getItem('ultimoCazador.highScore') || '0', 10); } catch { return 0; }
  }

  static saveHighScore(score) {
    try {
      if (score > ScoreSystem.loadHighScore()) {
        localStorage.setItem('ultimoCazador.highScore', String(score));
        return true;
      }
    } catch { /* almacenamiento no disponible */ }
    return false;
  }
}
