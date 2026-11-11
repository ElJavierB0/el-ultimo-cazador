import * as THREE from 'three';
import { BESTIARY, EFFECTIVENESS, PLAYER_MOVES, TYPE_LABEL } from '../data/bestiary.js';
import { $, show, popup, setBar } from '../ui/ui.js';

const MENU = [
  { key: 'espada', label: 'ESPADA' },
  { key: 'senal', label: 'SEÑAL' },
  { key: 'pocion', label: 'POCIÓN' },
  { key: 'huir', label: 'HUIR' },
];
const SUBMENUS = { espada: ['acero', 'plata'], senal: ['ascua', 'egida'] };
const MAX_VIGOR = 3;
const GAP = 1.9; // distancia de cada combatiente al centro

/**
 * BattleScene: combate por turnos con cámara cinematográfica, en el mismo mundo 3D del nivel.
 * El turno se escribe como una secuencia asíncrona: mensaje → animación → daño → turno enemigo.
 */
export class BattleScene {
  constructor(game, origin, enemyEntity) {
    this.game = game;
    this.origin = origin;
    this.engine = game.engine;
    this.world = origin.world;
    this.enemyEntity = enemyEntity;
    this.hero = origin.hero;
    this.foeActor = enemyEntity.actor;
    const data = BESTIARY[enemyEntity.kind];
    const li = game.levelIndex;
    const maxHp = Math.round(data.hp * (1 + 0.25 * li));
    this.data = data;
    this.foe = {
      name: data.name, type: data.type, boss: !!data.boss, maxHp, hp: maxHp,
      atk: data.atk + li * 2, def: data.def + li, level: (data.boss ? 5 : 2) + li * 4,
      moves: data.moves, burn: 0, atkMod: 0,
    };
    this.vigor = MAX_VIGOR;
    this.shield = false;
    this.pAtkMod = 0;
    this.pDefMod = 0;
    this.damageTaken = 0;
    this.mode = 'busy';
    this.menuIndex = 0;
    this.subKind = null;
    this.subIndex = 0;
    this.waiter = null;
    this.tweens = [];
    this.shake = 0;
    this.over = false;
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
  }

  /* ---------- Preparación ---------- */
  enter() {
    this.game.audio.playMusic(this.foe.boss ? 'boss' : 'battle');
    show('hud', false);
    show('battle');
    // Coloca a los combatientes frente a frente
    const fp = this.foeActor.group.position;
    const side = this.hero.group.position.x <= fp.x ? 1 : -1;
    this.side = side;
    this.center = new THREE.Vector3(fp.x - side * GAP, fp.y, 0);
    this.heroHome = new THREE.Vector3(this.center.x - side * GAP, fp.y, 0);
    this.foeHome = new THREE.Vector3(this.center.x + side * GAP, fp.y, 0);
    this.hero.group.position.copy(this.heroHome);
    this.foeActor.group.position.copy(this.foeHome);
    this.hero.group.visible = true;
    this.hero.face(side);
    this.foeActor.face(-side);
    this.hero.play('combat');
    this.foeActor.play('combat');
    this.camPos.set(this.center.x - side * 1.6, fp.y + 1.9, 6.6);
    this.camLook.set(this.center.x + side * 0.25, fp.y + 0.95, 0);
    this.engine.camera.position.copy(this.camPos).add(new THREE.Vector3(-side * 2, 1.2, 3));
    this.shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 24),
      new THREE.MeshBasicMaterial({ color: '#7cc4ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.shieldMesh.position.copy(this.heroHome).add(new THREE.Vector3(0, 0.85, 0));
    this.engine.scene.add(this.shieldMesh);

    $('b-foe-name').textContent = this.foe.name;
    $('b-foe-lvl').textContent = `Nv ${this.foe.level}`;
    this.refresh();
    this.intro();
  }

  exit() {
    show('battle', false);
    this.engine.scene.remove(this.shieldMesh);
    this.shieldMesh.geometry.dispose();
    this.shieldMesh.material.dispose();
  }

  async intro() {
    const hint = { humano: 'es humano: usa ACERO', nomuerto: 'es un no-muerto: usa PLATA', arcano: 'es una criatura arcana' };
    if (this.foe.boss) this.foeActor.once('taunt', 'combat');
    await this.say(this.foe.boss ? `¡${this.foe.name} defiende su territorio!` : `¡${this.foe.name} te cierra el paso!`);
    await this.say(`El medallón vibra... ${hint[this.foe.type]}.`);
    this.openMenu();
  }

  /* ---------- Interfaz ---------- */
  refresh() {
    const h = this.game.hunter;
    $('b-hero-lvl').textContent = `Nv ${h.level}`;
    setBar('b-hero-hp', h.hp / h.maxHp);
    $('b-hero-num').textContent = `${h.hp}/${h.maxHp}`;
    setBar('b-foe-hp', this.foe.hp / this.foe.maxHp);
    $('b-vigor').innerHTML = Array.from({ length: MAX_VIGOR }, (_, i) => `<i class="${i < this.vigor ? 'on' : ''}"></i>`).join('');
    $('b-hero-chips').innerHTML = (this.shield ? '<span class="shield">ÉGIDA</span>' : '') + (this.pAtkMod < 0 ? '<span class="debuff">ATK↓</span>' : '') + (this.pDefMod < 0 ? '<span class="debuff">DEF↓</span>' : '');
    $('b-foe-chips').innerHTML = `<span>${TYPE_LABEL[this.foe.type]}</span>${this.foe.boss ? '<span class="boss">GUARDIÁN</span>' : ''}${this.foe.burn > 0 ? '<span class="burn">QUEMADO</span>' : ''}`;
  }

  openMenu() {
    if (this.over) return;
    this.mode = 'menu';
    $('b-msg').textContent = `¿Qué hará ${this.game.hunter.name}?`;
    this.renderMenu();
  }

  renderMenu() {
    const menu = $('b-menu');
    show('b-menu');
    menu.classList.remove('single');
    if (this.mode === 'menu') {
      menu.innerHTML = MENU.map((m, i) => `<button data-i="${i}" class="${i === this.menuIndex ? 'sel' : ''}">${m.label}${m.key === 'pocion' ? ` ×${this.game.hunter.potions}` : ''}</button>`).join('');
    } else {
      const keys = SUBMENUS[this.subKind];
      menu.classList.add('single');
      menu.innerHTML = keys.map((k, i) => {
        const mv = PLAYER_MOVES[k];
        const off = this.vigor < mv.cost ? ' off' : '';
        return `<button data-i="${i}" class="${i === this.subIndex ? 'sel' : ''}${off}">${mv.short}${mv.cost ? ` · ${mv.cost} vigor` : ''}</button>`;
      }).join('') + `<div class="hint">${PLAYER_MOVES[keys[this.subIndex]].hint} · Esc: volver</div>`;
      $('b-msg').textContent = PLAYER_MOVES[keys[this.subIndex]].name;
    }
    menu.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      if (this.mode === 'menu') this.menuIndex = i; else this.subIndex = i;
      this.confirm();
    }));
  }

  hideMenu() {
    show('b-menu', false);
  }

  /** Escribe un mensaje letra por letra; termina solo o al presionar Enter. */
  say(text, hold = 1.0) {
    return new Promise((resolve) => {
      this.waiter = { text, chars: 0, hold, t: 0, resolve };
      $('b-msg').textContent = '';
    });
  }

  /* ---------- Entrada ---------- */
  update(dt) {
    const input = this.game.input;
    const audio = this.game.audio;
    if (this.waiter) {
      const w = this.waiter;
      if (w.chars < w.text.length) {
        w.chars = Math.min(w.text.length, w.chars + dt * 60);
        if (input.pressed('confirm')) w.chars = w.text.length;
        $('b-msg').textContent = w.text.slice(0, Math.floor(w.chars));
      } else {
        w.t += dt;
        if (w.t > w.hold || input.pressed('confirm')) { this.waiter = null; w.resolve(); }
      }
      return;
    }
    if (this.mode === 'menu') {
      const col = this.menuIndex % 2;
      const row = Math.floor(this.menuIndex / 2);
      if (input.pressed('left') || input.pressed('right')) { this.menuIndex = row * 2 + (1 - col); audio.sfx('move'); this.renderMenu(); }
      if (input.pressed('up') || input.pressed('down')) { this.menuIndex = (1 - row) * 2 + col; audio.sfx('move'); this.renderMenu(); }
      if (input.pressed('confirm')) this.confirm();
    } else if (this.mode === 'sub') {
      if (input.pressed('up') || input.pressed('down') || input.pressed('left') || input.pressed('right')) { this.subIndex = 1 - this.subIndex; audio.sfx('move'); this.renderMenu(); }
      if (input.pressed('back')) { this.mode = 'menu'; audio.sfx('back'); this.openMenu(); }
      if (input.pressed('confirm')) this.confirm();
    }
  }

  async confirm() {
    const audio = this.game.audio;
    if (this.mode === 'menu') {
      audio.sfx('select');
      const key = MENU[this.menuIndex].key;
      if (key === 'espada' || key === 'senal') { this.mode = 'sub'; this.subKind = key; this.subIndex = 0; this.renderMenu(); return; }
      if (key === 'pocion' && this.game.hunter.potions <= 0) { await this.notice('No te quedan pociones.'); return; }
      this.runTurn(key === 'pocion' ? 'potion' : 'flee');
    } else if (this.mode === 'sub') {
      const key = SUBMENUS[this.subKind][this.subIndex];
      if (this.vigor < PLAYER_MOVES[key].cost) { audio.sfx('locked'); await this.notice('No tienes suficiente vigor.'); return; }
      audio.sfx('select');
      this.runTurn(key);
    }
  }

  async notice(text) {
    this.mode = 'busy';
    this.hideMenu();
    await this.say(text, 0.8);
    this.openMenu();
  }

  /* ---------- Turnos ---------- */
  calcDamage(power, atk, def, mult, ignoreDef = false) {
    const variance = 0.85 + Math.random() * 0.15;
    return Math.max(1, Math.round((power + atk) * mult * variance - (ignoreDef ? 0 : def)));
  }

  async runTurn(action) {
    this.mode = 'busy';
    this.hideMenu();
    const result = await this.playerAct(action);
    if (result === 'end') return;
    if (result === 'noturn') { this.openMenu(); return; }
    if (await this.foeAct()) return;
    if (await this.endOfTurn()) return;
    this.openMenu();
  }

  async playerAct(action) {
    const h = this.game.hunter;
    const foe = this.foe;
    const score = this.game.score;
    const audio = this.game.audio;

    if (action === 'potion') {
      h.potions--;
      const healed = h.heal(Math.max(20, Math.round(h.maxHp * 0.5)));
      this.say('Kaelen bebe una poción.', 0.2);
      audio.sfx('heal');
      await this.hero.once('item', 'combat');
      this.world.burst(this.hero.group.position.clone().add(new THREE.Vector3(0, 1, 0)), '#7dffb0', 30);
      this.pop(`+${healed}`, this.hero, '#7dffb0', true);
      this.refresh();
      await this.say(`Recupera ${healed} PV.`, 0.7);
      return 'ok';
    }

    if (action === 'flee') {
      if (foe.boss) { await this.say('¡No puedes huir de un guardián!'); return 'noturn'; }
      if (Math.random() < 0.7) {
        score.add('FLEE');
        audio.sfx('back');
        this.say('Kaelen escapa entre las sombras.', 0.4);
        this.hero.face(-this.side);
        this.hero.play('run');
        await this.move(this.hero, this.heroHome.x - this.side * 4, 0.6);
        this.finish('flee');
        return 'end';
      }
      await this.say('¡No pudiste escapar!');
      return 'ok';
    }

    const mv = PLAYER_MOVES[action];
    this.vigor -= mv.cost;
    this.refresh();

    if (action === 'egida') {
      this.shield = true;
      this.say('Kaelen traza la señal Égida.', 0.2);
      audio.sfx('shield');
      await this.hero.once('block', 'combat');
      this.tween(0.4, (k) => { this.shieldMesh.material.opacity = 0.28 * k; });
      this.refresh();
      await this.say('Un escudo mágico lo rodea.', 0.6);
      return 'ok';
    }

    this.say(`Kaelen usa ${mv.name}.`, 0.1);
    if (action === 'ascua') {
      audio.sfx('fire');
      const cast = this.hero.once('cast', 'combat');
      await this.wait(0.35);
      await this.fireball();
      await cast;
    } else {
      audio.sfx(action === 'plata' ? 'silver' : 'slash');
      this.hero.play('run', { fade: 0.08 });
      await this.move(this.hero, this.foeHome.x - this.side * 1.05, 0.28);
      await this.hero.once('attack', null, 1.25);
      this.hero.play('run', { fade: 0.1 });
      this.move(this.hero, this.heroHome.x, 0.35).then(() => this.hero.play('combat'));
    }

    if (action !== 'ascua' && Math.random() < 0.05) {
      audio.sfx('miss');
      this.foeActor.once('dodge', 'combat');
      this.pop('Falló', this.foeActor, '#cfcfcf');
      await this.say('¡El ataque falló!');
      return 'ok';
    }

    const mult = EFFECTIVENESS[action][foe.type];
    const crit = action !== 'ascua' && Math.random() < 0.1;
    const dmg = this.calcDamage(mv.power, h.atk + this.pAtkMod, foe.def, mult * (crit ? 1.5 : 1), action === 'ascua');
    foe.hp = Math.max(0, foe.hp - dmg);
    audio.sfx(crit ? 'crit' : 'hit');
    this.shake = 0.25;
    this.world.burst(this.foeActor.group.position.clone().add(new THREE.Vector3(0, 1, 0.3)), action === 'ascua' ? '#ff8a2a' : '#e8f4ff', 22);
    this.pop(crit ? `¡${dmg}!` : `-${dmg}`, this.foeActor, crit ? '#ffd34a' : mult > 1 ? '#ffb27a' : '#ffffff', crit || mult > 1);
    this.refresh();
    if (foe.hp > 0) await this.foeActor.once('hit', 'combat');

    if (crit) { score.add('CRITICAL_HIT'); await this.say('¡Golpe crítico!', 0.6); }
    if (mult > 1) { score.add('EFFECTIVE_HIT'); await this.say('¡Es un golpe certero!', 0.6); }
    if (mult < 1) await this.say('No es muy eficaz...', 0.6);
    if (action === 'ascua' && foe.hp > 0) {
      foe.burn = 2;
      this.refresh();
      await this.say(`${foe.name} arde en llamas.`, 0.6);
    }
    if (foe.hp <= 0) { await this.victory(); return 'end'; }
    return 'ok';
  }

  pickFoeMove() {
    const total = this.foe.moves.reduce((s, m) => s + m.weight, 0);
    let r = Math.random() * total;
    for (const m of this.foe.moves) { r -= m.weight; if (r <= 0) return m; }
    return this.foe.moves[0];
  }

  /** Turno del enemigo. Devuelve true si la batalla terminó. */
  async foeAct() {
    const h = this.game.hunter;
    const foe = this.foe;
    const audio = this.game.audio;
    const mv = this.pickFoeMove();
    this.say(`${foe.name} usa ${mv.name}.`, 0.1);
    audio.sfx('enemyAttack');

    if (mv.power > 0 && mv.anim !== 'cast') {
      this.foeActor.play('run', { fade: 0.08 });
      await this.move(this.foeActor, this.heroHome.x + this.side * 1.1, 0.3);
      await this.foeActor.once('attack', null, 1.15);
      this.foeActor.play('run', { fade: 0.1 });
      this.move(this.foeActor, this.foeHome.x, 0.35).then(() => this.foeActor.play('combat'));
    } else {
      await this.foeActor.once(mv.anim || 'taunt', 'combat');
      if (mv.power > 0) await this.darkBolt();
    }

    if (mv.effect === 'raiseAtk') {
      foe.atkMod = Math.min(6, foe.atkMod + 2);
      await this.say(`¡El ataque de ${foe.name} aumenta!`, 0.6);
    }
    if (mv.effect === 'heal') {
      const amount = Math.round(foe.maxHp * 0.25);
      foe.hp = Math.min(foe.maxHp, foe.hp + amount);
      audio.sfx('heal');
      this.world.burst(this.foeActor.group.position.clone().add(new THREE.Vector3(0, 1, 0)), '#7dffb0', 30);
      this.pop(`+${amount}`, this.foeActor, '#7dffb0', true);
      this.refresh();
      await this.say(`${foe.name} recupera vida.`, 0.6);
    }

    if (mv.power > 0) {
      if (Math.random() < 0.1) {
        audio.sfx('miss');
        this.hero.once('dodge', 'combat');
        await this.say('¡Kaelen esquiva el golpe!', 0.6);
      } else {
        let dmg = this.calcDamage(mv.power, foe.atk + foe.atkMod, Math.max(0, h.def + this.pDefMod), 1);
        if (this.shield) dmg = Math.ceil(dmg / 2);
        h.hp = Math.max(0, h.hp - dmg);
        this.damageTaken += dmg;
        audio.sfx('hit');
        this.shake = 0.35;
        this.pop(`-${dmg}`, this.hero, '#ff8a7a', dmg >= 10);
        this.refresh();
        if (h.hp > 0) await this.hero.once('hit', 'combat');
        await this.say(this.shield ? `La Égida protege. Recibes ${dmg} de daño.` : `Kaelen recibe ${dmg} de daño.`, 0.6);
        if (mv.effect === 'drain' && foe.hp > 0) {
          const back = Math.ceil(dmg / 2);
          foe.hp = Math.min(foe.maxHp, foe.hp + back);
          this.pop(`+${back}`, this.foeActor, '#ff9a6a');
          this.refresh();
          await this.say(`${foe.name} absorbe tu energía.`, 0.6);
        }
      }
    }
    if (mv.effect === 'lowerDef') { this.pDefMod = Math.max(-3, this.pDefMod - 1); this.refresh(); await this.say('La defensa de Kaelen baja.', 0.6); }
    if (mv.effect === 'lowerAtk') { this.pAtkMod = Math.max(-4, this.pAtkMod - 2); this.refresh(); await this.say('El ataque de Kaelen baja.', 0.6); }
    if (this.shield) {
      this.shield = false;
      this.tween(0.4, (k) => { this.shieldMesh.material.opacity = 0.28 * (1 - k); });
      this.refresh();
    }

    if (h.hp <= 0) { await this.defeat(); return true; }
    return false;
  }

  /** Quemaduras y recuperación de vigor. Devuelve true si el enemigo murió. */
  async endOfTurn() {
    const foe = this.foe;
    if (foe.burn > 0) {
      const dmg = Math.max(2, Math.round(foe.maxHp * 0.06));
      foe.hp = Math.max(0, foe.hp - dmg);
      foe.burn--;
      this.game.audio.sfx('fire');
      this.world.burst(this.foeActor.group.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ff8a2a', 24);
      this.pop(`-${dmg}`, this.foeActor, '#ff9a3a');
      this.refresh();
      await this.say(`${foe.name} sufre por las quemaduras.`, 0.6);
      if (foe.hp <= 0) { await this.victory(); return true; }
    }
    this.vigor = Math.min(MAX_VIGOR, this.vigor + 1);
    this.refresh();
    return false;
  }

  async victory() {
    const g = this.game;
    const h = g.hunter;
    this.over = true;
    g.audio.sfx('victory');
    await this.foeActor.once('death');
    this.world.burst(this.foeActor.group.position.clone().add(new THREE.Vector3(0, 0.6, 0)), this.data.model.eyes || '#d8d0ff', 40);
    this.hero.play('cheer');
    await this.say(`¡${this.foe.name} ha sido derrotado!`);
    let pts = g.score.enemyDefeated(this.data);
    if (this.damageTaken === 0) pts += g.score.add('FLAWLESS_BATTLE');
    h.coins += this.data.coins;
    g.stats.enemies++;
    await this.say(`+${pts} puntos y +${this.data.coins} monedas.`);
    const ups = h.gainXp(this.data.xp);
    await this.say(`Kaelen gana ${this.data.xp} de experiencia.`);
    if (ups > 0) {
      g.audio.sfx('levelUp');
      this.pop('¡NIVEL!', this.hero, '#9fd3ff', true);
      this.refresh();
      await this.say(`¡Kaelen sube al nivel ${h.level}! Más PV y ataque.`);
    }
    this.finish('win');
  }

  async defeat() {
    this.over = true;
    this.game.audio.sfx('defeat');
    await this.hero.once('death');
    await this.say('Kaelen ha caído...', 1.2);
    this.finish('lose');
  }

  finish(result) {
    this.game.audio.stopMusic();
    if (result !== 'win') this.foeActor.play('idle');
    this.origin.onBattleEnd(result, this.enemyEntity);
  }

  /* ---------- Efectos ---------- */
  pop(text, actor, color, big = false) {
    const h = (actor.spec.height || 1.6) * (actor.spec.scale || 1);
    popup(this.engine, text, actor.group.position.clone().add(new THREE.Vector3(0, h + 0.2, 0)), color, big);
  }

  wait(s) { return new Promise((r) => this.tween(s, () => {}, r)); }

  /** Animación por tiempo: fn(k) con k de 0 a 1. */
  tween(duration, fn, done = null) {
    return new Promise((resolve) => {
      this.tweens.push({ t: 0, duration, fn, resolve: () => { done?.(); resolve(); } });
    });
  }

  /** Desplaza un actor en X hasta targetX en "duration" segundos. */
  move(actor, targetX, duration) {
    const from = actor.group.position.x;
    return this.tween(duration, (k) => {
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      actor.group.position.x = from + (targetX - from) * e;
    });
  }

  /** Bola de fuego con luz propia que viaja del cazador al enemigo. */
  async fireball() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: '#fff1a8' })));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })));
    const light = new THREE.PointLight('#ff7a2a', 30, 8);
    g.add(light);
    const from = this.heroHome.clone().add(new THREE.Vector3(this.side * 0.5, 1.2, 0.2));
    const to = this.foeHome.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.engine.scene.add(g);
    await this.tween(0.45, (k) => {
      g.position.lerpVectors(from, to, k);
      g.position.y += Math.sin(k * Math.PI) * 0.5;
      if (Math.random() < 0.5) this.world.burst(g.position.clone(), '#ff8a2a', 2);
    });
    this.engine.scene.remove(g);
    g.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    this.world.burst(to, '#ffb347', 40);
  }

  /** Proyectil oscuro de los hechiceros. */
  async darkBolt() {
    const color = this.data.model.eyes || '#b07aff';
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color }));
    const light = new THREE.PointLight(color, 20, 6);
    orb.add(light);
    const from = this.foeHome.clone().add(new THREE.Vector3(-this.side * 0.5, 1.3, 0.2));
    const to = this.heroHome.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.engine.scene.add(orb);
    await this.tween(0.45, (k) => { orb.position.lerpVectors(from, to, k); orb.position.y += Math.sin(k * Math.PI) * 0.4; });
    this.engine.scene.remove(orb);
    orb.geometry.dispose();
    orb.material.dispose();
    this.world.burst(to, color, 30);
  }

  /* ---------- Cada cuadro ---------- */
  frame(dt) {
    for (const tw of this.tweens) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.duration);
      tw.fn(k);
      if (k >= 1) tw.resolve();
    }
    this.tweens = this.tweens.filter((tw) => tw.t < tw.duration);
    this.hero.update(dt);
    this.foeActor.update(dt);
    this.shieldMesh.position.copy(this.hero.group.position).add(new THREE.Vector3(0, 0.85, 0));
    const cam = this.engine.camera;
    cam.position.lerp(this.camPos, Math.min(1, dt * 2.5));
    const look = this.camLook.clone();
    if (this.shake > 0) {
      this.shake -= dt;
      look.x += (Math.random() - 0.5) * 0.12;
      look.y += (Math.random() - 0.5) * 0.12;
    }
    cam.lookAt(look);
    this.world.update(dt, this.center);
  }
}
