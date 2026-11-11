import * as THREE from 'three';
import { createCharacter } from './assets.js';

/** Nombres de animación según la familia del modelo (aventurero o esqueleto). */
const ANIMS = {
  adventurer: {
    idle: 'Idle', combat: '2H_Melee_Idle', walk: 'Walking_A', run: 'Running_A',
    jumpStart: 'Jump_Start', jumpAir: 'Jump_Idle', jumpLand: 'Jump_Land',
    attack: '1H_Melee_Attack_Slice_Diagonal', attack2: '1H_Melee_Attack_Chop', cast: 'Spellcast_Shoot', raise: 'Spellcast_Raise',
    hit: 'Hit_A', death: 'Death_A', item: 'Use_Item', block: 'Block', dodge: 'Dodge_Backward', cheer: 'Cheer', taunt: 'Cheer',
  },
  skeleton: {
    idle: 'Idle_Combat', combat: 'Idle_Combat', walk: 'Walking_D_Skeletons', run: 'Running_A',
    jumpStart: 'Jump_Start', jumpAir: 'Jump_Idle', jumpLand: 'Jump_Land',
    attack: '1H_Melee_Attack_Chop', attack2: 'Unarmed_Melee_Attack_Punch_A', cast: 'Spellcast_Shoot', raise: 'Spellcast_Raise',
    hit: 'Hit_B', death: 'Death_C_Skeletons', item: 'Use_Item', block: 'Block', dodge: 'Dodge_Backward', cheer: 'Taunt', taunt: 'Taunt',
  },
};

/**
 * Actor: personaje 3D animado. Envuelve el modelo, su AnimationMixer y transiciones suaves entre animaciones.
 */
export class Actor {
  constructor(spec) {
    const { root, clips } = createCharacter(spec);
    this.spec = spec;
    this.root = root;
    this.group = new THREE.Group();
    this.group.add(root);
    this.family = spec.file.startsWith('Skeleton') ? 'skeleton' : 'adventurer';
    this.names = ANIMS[this.family];
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = Object.fromEntries(clips.map((c) => [c.name, c]));
    this.current = null;
    this.currentKey = null;
    this.facing = 1;
    this.heading = Math.PI / 2;
  }

  /** Reproduce una animación en bucle (o una vez si loop = false). key es el nombre lógico (idle, run, attack...). */
  play(key, { loop = true, fade = 0.2, speed = 1, force = false } = {}) {
    const clip = this.clips[this.names[key] || key];
    if (!clip) return null;
    const action = this.mixer.clipAction(clip);
    // Si ya es la animación actual no se reinicia (las de una sola vez se quedan en su último cuadro)
    if (this.current === action && !force && (!loop || action.isRunning())) return action;
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.timeScale = speed;
    action.enabled = true;
    action.setEffectiveWeight(1);
    if (this.current && this.current !== action) this.current.crossFadeTo(action, fade, false);
    action.play();
    this.current = action;
    this.currentKey = key;
    return action;
  }

  /** Reproduce una vez y regresa a la animación "back" (si se indica). Devuelve una promesa. */
  once(key, back = null, speed = 1) {
    return new Promise((resolve) => {
      const action = this.play(key, { loop: false, fade: 0.12, speed, force: true });
      if (!action) { resolve(); return; }
      const done = (e) => {
        if (e.action !== action) return;
        this.mixer.removeEventListener('finished', done);
        if (back) this.play(back, { fade: 0.25 });
        resolve();
      };
      this.mixer.addEventListener('finished', done);
    });
  }

  /** Gira suavemente hacia la izquierda (-1) o la derecha (1). */
  face(dir) {
    this.facing = dir;
  }

  update(dt) {
    this.mixer.update(dt);
    const target = this.facing * Math.PI / 2;
    this.heading += (target - this.heading) * Math.min(1, dt * 14);
    this.root.rotation.y = this.heading;
  }
}
