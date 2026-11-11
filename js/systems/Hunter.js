import { ARMORS } from '../data/bestiary.js';

/**
 * Hunter: estadísticas persistentes del cazador (nivel, experiencia, vida, ataque y armadura).
 * Se conservan entre el mapa de plataformas y las batallas.
 */
export class Hunter {
  constructor() {
    this.name = 'Kaelen';
    this.level = 1;
    this.xp = 0;
    this.maxHp = 40;
    this.hp = this.maxHp;
    this.baseAtk = 6;
    this.armor = 0;
    this.potions = 2;
    this.coins = 0;
  }

  get atk() { return this.baseAtk; }
  get def() { return ARMORS[this.armor].def; }
  get armorName() { return ARMORS[this.armor].name; }
  get xpToNext() { return this.level * 100; }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  fullHeal() { this.hp = this.maxHp; }

  /** Suma experiencia y devuelve cuántos niveles subió. */
  gainXp(amount) {
    this.xp += amount;
    let ups = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.maxHp += 8;
      this.baseAtk += 2;
      this.hp = Math.min(this.maxHp, this.hp + 8);
      ups++;
    }
    return ups;
  }

  unlockArmor(index) {
    if (index > this.armor && index < ARMORS.length) {
      this.armor = index;
      return ARMORS[index];
    }
    return null;
  }
}
