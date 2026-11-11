import { W, H } from '../core/Game.js';
import { BESTIARY, EFFECTIVENESS, PLAYER_MOVES } from '../data/bestiary.js';
import { Sprites, drawSprite } from '../gfx/sprites.js';
import { THEMES, text, wrap, box, hpBar } from '../gfx/draw.js';

const MENU = ['ESPADA', 'SEÑAL', 'POCIÓN', 'HUIR'];
const SUBMENUS = { espada: ['acero', 'plata'], senal: ['ascua', 'egida'] };
const MAX_VIGOR = 3;

/**
 * BattleScene: combate por turnos.
 * El jugador elige una acción; después actúa el monstruo. Todo lo que sucede se agrega a una
 * cola de pasos (mensaje, animación o función) que se reproduce en orden.
 */
export class BattleScene {
  constructor(game, origin, enemyEntity) {
    this.game = game;
    this.origin = origin;
    this.enemyEntity = enemyEntity;
    const data = BESTIARY[enemyEntity.kind];
    const li = game.levelIndex;
    const maxHp = Math.round(data.hp * (1 + 0.25 * li));
    this.data = data;
    this.foe = {
      name: data.name, kind: enemyEntity.kind, type: data.type, boss: !!data.boss,
      maxHp, hp: maxHp, atk: data.atk + li * 2, def: data.def + li,
      level: (data.boss ? 5 : 2) + li * 4, moves: data.moves, burn: 0, atkMod: 0,
    };
    this.vigor = MAX_VIGOR;
    this.shield = false;
    this.pAtkMod = 0;
    this.pDefMod = 0;
    this.damageTaken = 0;

    this.queue = [];
    this.cur = null;
    this.mode = 'queue';
    this.menuIndex = 0;
    this.subKind = null;
    this.subIndex = 0;
    this.msg = '';
    this.chars = 0;
    this.hold = 0;
    this.anim = null;
    this.particles = [];
    this.shake = 0;
    this.time = 0;
    this.introT = 0;
    this.over = false;

    this.foeHpTarget = this.foe.hp;
    this.foeHpShown = this.foe.hp;
    this.pHpTarget = game.hunter.hp;
    this.pHpShown = game.hunter.hp;

    const typeLabel = { humano: 'humano: usa ACERO', bestia: 'una bestia', monstruo: 'un monstruo: usa PLATA', espectro: 'un espectro: usa PLATA' };
    this.say(this.foe.boss ? `¡${this.foe.name} defiende su territorio!` : `¡Un ${this.foe.name} te cierra el paso!`);
    this.say(`El medallón vibra... es ${typeLabel[this.foe.type]}.`);
  }

  enter() {
    this.game.audio.playMusic(this.foe.boss ? 'boss' : 'battle');
  }

  /* ---------- Cola de pasos ---------- */
  say(str) { this.queue.push({ type: 'msg', text: str }); }
  play(name, dur, sfx) { this.queue.push({ type: 'anim', name, dur, sfx }); }
  call(fn) { this.queue.push({ type: 'call', fn }); }

  nextStep() {
    this.cur = this.queue.shift() || null;
    if (!this.cur) {
      if (!this.over) { this.mode = 'menu'; this.msg = ''; }
      return;
    }
    if (this.cur.type === 'msg') {
      this.msg = this.cur.text;
      this.chars = 0;
      this.hold = 0;
    } else if (this.cur.type === 'anim') {
      this.anim = { name: this.cur.name, t: 0, dur: this.cur.dur };
      if (this.cur.sfx) this.game.audio.sfx(this.cur.sfx);
      this.spawnAnimParticles(this.cur.name);
    } else if (this.cur.type === 'call') {
      this.cur.fn();
      this.cur = null;
    }
  }

  update(dt) {
    const input = this.game.input;
    this.time += dt;
    this.introT = Math.min(1, this.introT + dt * 1.8);
    if (this.shake > 0) this.shake -= dt;

    // Barras de vida animadas
    this.foeHpShown += Math.sign(this.foeHpTarget - this.foeHpShown) * Math.min(Math.abs(this.foeHpTarget - this.foeHpShown), dt * 40);
    this.pHpShown += Math.sign(this.pHpTarget - this.pHpShown) * Math.min(Math.abs(this.pHpTarget - this.pHpShown), dt * 40);

    this.particles.forEach((p) => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    this.particles = this.particles.filter((p) => p.t > 0);

    if (this.introT < 1) return;

    if (this.mode === 'menu') return this.updateMenu(input);
    if (this.mode === 'sub') return this.updateSub(input);

    // Modo cola: reproduce el paso actual
    if (!this.cur) { this.nextStep(); return; }
    if (this.cur.type === 'msg') {
      if (this.chars < this.msg.length) {
        this.chars += dt * 60;
        if (input.pressed('confirm')) this.chars = this.msg.length;
      } else {
        this.hold += dt;
        if (this.hold > 1.1 || input.pressed('confirm')) this.cur = null;
      }
    } else if (this.cur.type === 'anim') {
      this.anim.t += dt;
      if (this.anim.t >= this.anim.dur) { this.anim = null; this.cur = null; }
    }
  }

  updateMenu(input) {
    const audio = this.game.audio;
    const col = this.menuIndex % 2;
    const row = Math.floor(this.menuIndex / 2);
    if (input.pressed('left') || input.pressed('right')) { this.menuIndex = row * 2 + (1 - col); audio.sfx('move'); }
    if (input.pressed('up') || input.pressed('down')) { this.menuIndex = (1 - row) * 2 + col; audio.sfx('move'); }
    if (!input.pressed('confirm')) return;
    audio.sfx('select');
    switch (this.menuIndex) {
      case 0: this.openSub('espada'); break;
      case 1: this.openSub('senal'); break;
      case 2:
        if (this.game.hunter.potions > 0) this.executeTurn('potion');
        else this.notice('No te quedan pociones.');
        break;
      case 3: this.executeTurn('flee'); break;
      default: break;
    }
  }

  openSub(kind) {
    this.subKind = kind;
    this.subIndex = 0;
    this.mode = 'sub';
  }

  updateSub(input) {
    const audio = this.game.audio;
    if (input.pressed('up') || input.pressed('down')) { this.subIndex = 1 - this.subIndex; audio.sfx('move'); }
    if (input.pressed('back')) { this.mode = 'menu'; audio.sfx('back'); return; }
    if (!input.pressed('confirm')) return;
    const key = SUBMENUS[this.subKind][this.subIndex];
    if (this.vigor < PLAYER_MOVES[key].cost) {
      audio.sfx('locked');
      this.notice('No tienes suficiente vigor.');
      return;
    }
    audio.sfx('select');
    this.executeTurn(key);
  }

  /** Muestra un aviso sin gastar el turno. */
  notice(str) {
    this.mode = 'queue';
    this.say(str);
  }

  /* ---------- Lógica del combate ---------- */
  calcDamage(power, atk, def, mult, ignoreDef = false) {
    const variance = 0.85 + Math.random() * 0.15;
    const dmg = (power + atk) * mult * variance - (ignoreDef ? 0 : def);
    return Math.max(1, Math.round(dmg));
  }

  executeTurn(action) {
    this.mode = 'queue';
    const result = this.playerAct(action);
    if (result === 'end' || result === 'noturn') return;
    if (this.foeAct()) return;
    this.endOfTurn();
  }

  playerAct(action) {
    const h = this.game.hunter;
    const foe = this.foe;
    const score = this.game.score;

    if (action === 'potion') {
      h.potions--;
      const healed = h.heal(Math.max(20, Math.round(h.maxHp * 0.5)));
      this.say('Kaelen bebe una poción.');
      this.play('heal', 0.6, 'heal');
      this.call(() => { this.pHpTarget = h.hp; });
      this.say(`Recupera ${healed} PV.`);
      return 'ok';
    }

    if (action === 'flee') {
      if (foe.boss) {
        this.say('¡No puedes huir de un guardián!');
        return 'noturn';
      }
      if (Math.random() < 0.7) {
        score.add('FLEE');
        this.say('Kaelen escapa entre las sombras.');
        this.call(() => this.finish('flee'));
        return 'end';
      }
      this.say('¡No pudiste escapar!');
      return 'ok';
    }

    const mv = PLAYER_MOVES[action];
    this.vigor -= mv.cost;

    if (action === 'egida') {
      this.shield = true;
      this.say('Kaelen traza la señal Égida.');
      this.play('shield', 0.6, 'shield');
      this.say('Un escudo mágico lo rodea.');
      return 'ok';
    }

    this.say(`Kaelen usa ${mv.name}.`);
    const sfx = action === 'ascua' ? 'fire' : action === 'plata' ? 'silver' : 'slash';
    this.play(action === 'ascua' ? 'fire' : 'playerLunge', action === 'ascua' ? 0.6 : 0.35, sfx);

    if (action !== 'ascua' && Math.random() < 0.05) {
      this.play('none', 0.1, 'miss');
      this.say('¡El ataque falló!');
      return 'ok';
    }

    const mult = EFFECTIVENESS[action][foe.type];
    const crit = action !== 'ascua' && Math.random() < 0.1;
    const dmg = this.calcDamage(mv.power, h.atk + this.pAtkMod, foe.def, mult * (crit ? 1.5 : 1), action === 'ascua');
    foe.hp = Math.max(0, foe.hp - dmg);
    this.play('foeHit', 0.5, crit ? 'crit' : 'hit');
    this.call(() => { this.foeHpTarget = foe.hp; });

    if (crit) { score.add('CRITICAL_HIT'); this.say('¡Golpe crítico!'); }
    if (mult > 1) { score.add('EFFECTIVE_HIT'); this.say('¡Es un golpe certero!'); }
    if (mult < 1) this.say('No es muy eficaz...');
    if (action === 'ascua' && foe.hp > 0) {
      foe.burn = 2;
      this.call(() => { this.burnShown = true; });
      this.say(`${foe.name} arde en llamas.`);
    }

    if (foe.hp <= 0) { this.victory(); return 'end'; }
    return 'ok';
  }

  pickFoeMove() {
    const total = this.foe.moves.reduce((s, m) => s + m.weight, 0);
    let r = Math.random() * total;
    for (const m of this.foe.moves) {
      r -= m.weight;
      if (r <= 0) return m;
    }
    return this.foe.moves[0];
  }

  /** Turno del monstruo. Devuelve true si el combate terminó. */
  foeAct() {
    const h = this.game.hunter;
    const foe = this.foe;
    const mv = this.pickFoeMove();
    this.say(`${foe.name} usa ${mv.name}.`);
    this.play('foeLunge', 0.35, 'enemyAttack');

    if (mv.effect === 'raiseAtk') {
      foe.atkMod = Math.min(6, foe.atkMod + 2);
      this.say(`¡El ataque de ${foe.name} aumenta!`);
    }
    if (mv.effect === 'heal') {
      const amount = Math.round(foe.maxHp * 0.25);
      foe.hp = Math.min(foe.maxHp, foe.hp + amount);
      this.play('foeHeal', 0.5, 'heal');
      this.call(() => { this.foeHpTarget = foe.hp; });
      this.say(`${foe.name} recupera vida.`);
    }

    if (mv.power > 0) {
      if (Math.random() < 0.1) {
        this.play('none', 0.1, 'miss');
        this.say('¡Kaelen esquiva el golpe!');
      } else {
        let dmg = this.calcDamage(mv.power, foe.atk + foe.atkMod, Math.max(0, h.def + this.pDefMod), 1);
        if (this.shield) dmg = Math.ceil(dmg / 2);
        h.hp = Math.max(0, h.hp - dmg);
        this.damageTaken += dmg;
        this.play('playerHit', 0.5, 'hit');
        this.call(() => { this.pHpTarget = h.hp; this.shake = 0.3; });
        this.say(this.shield ? `La Égida protege. Recibes ${dmg} de daño.` : `Kaelen recibe ${dmg} de daño.`);
        if (mv.effect === 'drain' && foe.hp > 0) {
          foe.hp = Math.min(foe.maxHp, foe.hp + Math.ceil(dmg / 2));
          this.call(() => { this.foeHpTarget = foe.hp; });
          this.say(`${foe.name} absorbe tu energía.`);
        }
      }
    }
    if (mv.effect === 'lowerDef') {
      this.pDefMod = Math.max(-3, this.pDefMod - 1);
      this.say('La defensa de Kaelen baja.');
    }
    if (mv.effect === 'lowerAtk') {
      this.pAtkMod = Math.max(-4, this.pAtkMod - 2);
      this.say('El ataque de Kaelen baja.');
    }
    this.shield = false;

    if (h.hp <= 0) { this.defeat(); return true; }
    return false;
  }

  endOfTurn() {
    const foe = this.foe;
    if (foe.burn > 0) {
      const dmg = Math.max(2, Math.round(foe.maxHp * 0.06));
      foe.hp = Math.max(0, foe.hp - dmg);
      foe.burn--;
      const stillBurning = foe.burn > 0;
      this.play('foeHit', 0.4, 'fire');
      this.call(() => { this.foeHpTarget = foe.hp; this.burnShown = stillBurning; });
      this.say(`${foe.name} sufre por las quemaduras.`);
      if (foe.hp <= 0) { this.victory(); return; }
    }
    this.vigor = Math.min(MAX_VIGOR, this.vigor + 1);
  }

  victory() {
    const g = this.game;
    const h = g.hunter;
    this.over = true;
    this.play('foeFaint', 0.8, 'victory');
    this.say(`¡${this.foe.name} ha sido derrotado!`);
    let pts = g.score.enemyDefeated(this.data);
    if (this.damageTaken === 0) pts += g.score.add('FLAWLESS_BATTLE');
    h.coins += this.data.coins;
    g.stats.enemies++;
    this.say(`+${pts} puntos y +${this.data.coins} monedas.`);
    const ups = h.gainXp(this.data.xp);
    this.say(`Kaelen gana ${this.data.xp} de experiencia.`);
    if (ups > 0) {
      this.call(() => { g.audio.sfx('levelUp'); this.pHpTarget = h.hp; });
      this.say(`¡Kaelen sube al nivel ${h.level}! Más PV y ataque.`);
    }
    this.call(() => this.finish('win'));
  }

  defeat() {
    this.over = true;
    this.play('playerFaint', 0.8, 'defeat');
    this.say('Kaelen ha caído...');
    this.call(() => this.finish('lose'));
  }

  finish(result) {
    this.game.audio.stopMusic();
    this.origin.onBattleEnd(result, this.enemyEntity);
  }

  spawnAnimParticles(name) {
    const add = (x, y, color, n, spread = 20, vy = -20) => {
      for (let i = 0; i < n; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread,
          vx: (Math.random() - 0.5) * 30, vy: vy - Math.random() * 30, t: 0.4 + Math.random() * 0.4, color,
        });
      }
    };
    if (name === 'fire') add(236, 54, '#ff7a1a', 30, 40, -40);
    if (name === 'fire') add(236, 54, '#ffd34a', 15, 30, -30);
    if (name === 'heal') add(80, 96, '#7dffb0', 20, 40, -30);
    if (name === 'foeHeal') add(236, 54, '#7dffb0', 20, 40, -30);
    if (name === 'shield') add(80, 96, '#9fd3ff', 20, 50, -10);
  }

  /* ---------- Dibujo ---------- */
  draw(ctx) {
    const theme = THEMES[this.origin.level.theme];
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));

    // Fondo
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.battle[0]);
    g.addColorStop(0.5, theme.battle[1]);
    g.addColorStop(1, theme.battle[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 6; i++) ctx.fillRect(0, 40 + i * 16 + ((this.time * 6 + i * 5) % 8), W, 2);

    // Plataformas
    this.pad(ctx, 236, 80, 54, 11, theme);
    this.pad(ctx, 80, 130, 66, 13, theme);

    this.drawFoe(ctx);
    this.drawHunter(ctx);

    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    if (this.introT >= 1) {
      this.drawFoeBox(ctx);
      this.drawHunterBox(ctx);
    }
    ctx.restore();
    this.drawTextBox(ctx);
  }

  pad(ctx, cx, cy, rx, ry, theme) {
    ctx.fillStyle = theme.padEdge;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.pad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, rx - 4, ry - 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  animProgress(name) {
    return this.anim && this.anim.name === name ? this.anim.t / this.anim.dur : null;
  }

  drawFoe(ctx) {
    const img = Sprites.enemy(this.foe.kind);
    const scale = this.foe.boss ? 4 : 3;
    let x = 236 - (img.width * scale) / 2;
    let y = 82 - img.height * scale;
    let alpha = 1;
    x += (1 - this.introT) * -260; // entra desde la izquierda

    const lunge = this.animProgress('foeLunge');
    if (lunge !== null) { x -= Math.sin(lunge * Math.PI) * 16; y += Math.sin(lunge * Math.PI) * 6; }
    const hit = this.animProgress('foeHit');
    if (hit !== null) { x += Math.sin(hit * 40) * 3; if (Math.floor(hit * 10) % 2) return; }
    const faint = this.animProgress('foeFaint');
    if (faint !== null) { y += faint * 30; alpha = 1 - faint; }
    if (this.over && !this.anim && this.cur?.type !== 'anim' && this.foe.hp <= 0) return;
    if (this.foe.kind === 'espectro' || this.foe.kind === 'senor') y += Math.sin(this.time * 2.5) * 3;

    // El monstruo mira hacia el cazador (izquierda)
    drawSprite(ctx, img, x, y, { scale, flip: true, alpha });
  }

  drawHunter(ctx) {
    const img = Sprites.hunterBack(this.game.hunter.armor);
    let x = 48;
    let y = 68;
    let alpha = 1;
    x += (1 - this.introT) * 260; // entra desde la derecha
    const lunge = this.animProgress('playerLunge');
    if (lunge !== null) { x += Math.sin(lunge * Math.PI) * 24; y -= Math.sin(lunge * Math.PI) * 10; }
    const hit = this.animProgress('playerHit');
    if (hit !== null && Math.floor(hit * 10) % 2) return;
    const faint = this.animProgress('playerFaint');
    if (faint !== null) { y += faint * 40; alpha = 1 - faint; }
    if (this.over && this.game.hunter.hp <= 0 && faint === null) return;
    drawSprite(ctx, img, x, y, { scale: 4, alpha });

    if (this.shield || this.animProgress('shield') !== null) {
      ctx.strokeStyle = `rgba(159,211,255,${0.5 + Math.sin(this.time * 6) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 32, y + 30, 40, 34, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawFoeBox(ctx) {
    const f = this.foe;
    box(ctx, 8, 10, 152, 34);
    text(ctx, f.name.toUpperCase(), 14, 16, { color: '#303030', shadow: false, size: f.name.length > 12 ? 6 : 8 });
    text(ctx, `Nv${f.level}`, 154, 16, { color: '#303030', shadow: false, align: 'right', size: 6 });
    text(ctx, 'PV', 14, 30, { color: '#c27c0e', shadow: false, size: 6 });
    hpBar(ctx, 30, 31, 120, 4, this.foeHpShown / f.maxHp);
    if (this.burnShown) text(ctx, 'QUEMADO', 14, 38, { color: '#d9480f', shadow: false, size: 6 });
  }

  drawHunterBox(ctx) {
    const h = this.game.hunter;
    box(ctx, 170, 90, 144, 40);
    text(ctx, h.name.toUpperCase(), 177, 96, { color: '#303030', shadow: false });
    text(ctx, `Nv${h.level}`, 308, 97, { color: '#303030', shadow: false, align: 'right', size: 6 });
    text(ctx, 'PV', 177, 109, { color: '#c27c0e', shadow: false, size: 6 });
    hpBar(ctx, 193, 110, 112, 4, this.pHpShown / h.maxHp);
    text(ctx, `${Math.ceil(this.pHpShown)}/${h.maxHp}`, 177, 119, { color: '#303030', shadow: false, size: 6 });
    text(ctx, 'VIGOR', 250, 119, { color: '#3a5a8c', shadow: false, size: 6 });
    for (let i = 0; i < MAX_VIGOR; i++) {
      ctx.fillStyle = i < this.vigor ? '#3a7bd5' : '#c9c9c9';
      ctx.fillRect(282 + i * 8, 119, 6, 6);
    }
  }

  drawTextBox(ctx) {
    const dark = '#303030';
    if (this.mode === 'menu' || this.mode === 'sub') {
      box(ctx, 4, 132, 170, 42);
      box(ctx, 174, 132, 142, 42);
      if (this.mode === 'menu') {
        const lines = wrap(ctx, `¿Qué hará ${this.game.hunter.name}?`, 150);
        lines.forEach((l, i) => text(ctx, l, 12, 142 + i * 12, { color: dark, shadow: false }));
        MENU.forEach((label, i) => {
          const x = 186 + (i % 2) * 72;
          const y = 142 + Math.floor(i / 2) * 14;
          const extra = i === 2 ? ` ${this.game.hunter.potions}` : '';
          text(ctx, label + extra, x, y, { color: dark, shadow: false, size: 7 });
          if (i === this.menuIndex) cursor(ctx, x - 9, y);
        });
      } else {
        const keys = SUBMENUS[this.subKind];
        const mv = PLAYER_MOVES[keys[this.subIndex]];
        const lines = wrap(ctx, mv.hint, 150, 7);
        lines.forEach((l, i) => text(ctx, l, 12, 140 + i * 11, { color: dark, shadow: false, size: 7 }));
        text(ctx, mv.cost ? `Vigor: ${mv.cost}` : 'Sin costo', 12, 162, { color: '#3a5a8c', shadow: false, size: 6 });
        keys.forEach((k, i) => {
          const m = PLAYER_MOVES[k];
          const y = 142 + i * 14;
          const disabled = this.vigor < m.cost;
          text(ctx, m.short, 192, y, { color: disabled ? '#999' : dark, shadow: false, size: 7 });
          if (i === this.subIndex) cursor(ctx, 183, y);
        });
        text(ctx, 'ESC: volver', 248, 164, { color: '#777', shadow: false, size: 5 });
      }
      return;
    }

    box(ctx, 4, 132, 312, 42);
    const shown = this.msg.slice(0, Math.floor(this.chars));
    const lines = wrap(ctx, shown, 292);
    lines.slice(0, 3).forEach((l, i) => text(ctx, l, 12, 141 + i * 11, { color: dark, shadow: false }));
    if (this.cur?.type === 'msg' && this.chars >= this.msg.length && Math.floor(this.time * 3) % 2) {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(300, 163, 6, 2);
      ctx.fillRect(301, 165, 4, 1);
      ctx.fillRect(302, 166, 2, 1);
    }
  }
}

/** Cursor triangular de selección (pixel art). */
export function cursor(ctx, x, y) {
  ctx.fillStyle = '#c0392b';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 1, 7 - i * 2);
}
