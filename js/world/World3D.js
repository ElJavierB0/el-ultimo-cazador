import * as THREE from 'three';
import { TILE, ROWS, T } from './Level.js';
import { createProp } from '../three/assets.js';

/** Convierte coordenadas lógicas (px, y hacia abajo) a coordenadas 3D (unidades, y hacia arriba). */
export const toWorld = (px, py) => new THREE.Vector3(px / TILE, (ROWS * TILE - py) / TILE, 0);

/** Generador pseudoaleatorio con semilla (la escenografía siempre queda igual). */
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Ambientación oscura de cada región. */
export const THEMES = {
  forest: {
    sky: '#070a16', fog: '#111729', fogDensity: 0.04, exposure: 1.3,
    hemi: ['#6a7ac0', '#1a120c', 0.8], moon: ['#9fb4ff', 1.8], rim: ['#6a8aff', 1.6], moonColor: '#dfe6ff',
    top: '#2b3f24', side: '#2e2219', platform: '#3e2a1c', mountain: '#141a30', particles: { color: '#ffe27a', count: 140, kind: 'firefly' },
  },
  swamp: {
    sky: '#050d0b', fog: '#0e1d17', fogDensity: 0.048, exposure: 1.3,
    hemi: ['#4f7b65', '#0c0a06', 0.8], moon: ['#bfe6c8', 1.5], rim: ['#5affb0', 1.2], moonColor: '#d8f5d0',
    top: '#2f3b22', side: '#241f16', platform: '#3a2c1c', mountain: '#0f1f1a', particles: { color: '#7dffb0', count: 120, kind: 'wisp' },
  },
  castle: {
    sky: '#0c0406', fog: '#1c090c', fogDensity: 0.044, exposure: 1.3,
    hemi: ['#8a4a4a', '#0a0405', 0.75], moon: ['#ffb08a', 1.6], rim: ['#ff5a3a', 1.5], moonColor: '#ffcfa0',
    top: '#46414d', side: '#2a2630', platform: '#4a4550', mountain: '#24090e', particles: { color: '#ff8a3a', count: 160, kind: 'ember' },
  },
};

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true, ...opts });

/**
 * World3D: construye la escena 3D de un nivel a partir de los datos lógicos (Level)
 * y anima sus elementos (monedas, fuego, portal, partículas).
 */
export class World3D {
  constructor(engine, level) {
    this.engine = engine;
    this.level = level;
    this.theme = THEMES[level.theme];
    this.scene = engine.scene;
    this.time = 0;
    this.itemMeshes = [];
    this.fires = [];
    this.bursts = [];
    engine.clear();
    engine.currentWorld = this;
    this.build();
  }

  build() {
    const th = this.theme;
    const scene = this.scene;
    scene.background = new THREE.Color(th.sky);
    scene.fog = new THREE.FogExp2(th.fog, th.fogDensity);
    this.engine.renderer.toneMappingExposure = th.exposure;

    // Luces
    scene.add(new THREE.HemisphereLight(th.hemi[0], th.hemi[1], th.hemi[2]));
    this.moon = new THREE.DirectionalLight(th.moon[0], th.moon[1]);
    this.moon.castShadow = true;
    this.moon.shadow.mapSize.set(2048, 2048);
    Object.assign(this.moon.shadow.camera, { left: -16, right: 16, top: 12, bottom: -6, near: 1, far: 60 });
    this.moon.shadow.bias = -0.0005;
    scene.add(this.moon, this.moon.target);
    this.rim = new THREE.DirectionalLight(th.rim[0], th.rim[1]);
    this.rim.position.set(0, 8, -12);
    scene.add(this.rim, this.rim.target);
    // Luz de relleno que acompaña al personaje enfocado (lo separa de la oscuridad)
    this.fill = new THREE.PointLight('#cdd6ff', 5, 9, 1.4);
    scene.add(this.fill);

    // Luna con halo
    const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 32), new THREE.MeshBasicMaterial({ color: th.moonColor, fog: false }));
    moon.position.set(30, 22, -90);
    this.moonMesh = moon;
    scene.add(moon);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshBasicMaterial({ color: th.moonColor, transparent: true, opacity: 0.08, fog: false, depthWrite: false }));
    halo.position.copy(moon.position).add(new THREE.Vector3(0, 0, -1));
    moon.userData.halo = halo;
    scene.add(halo);

    this.buildTerrain();
    this.buildBackdrop();
    this.buildItems();
    this.buildCheckpoints();
    this.buildExit();
    this.buildParticles();
  }

  /* ---------- Terreno ---------- */
  buildTerrain() {
    const lv = this.level;
    const th = this.theme;
    const topMat = mat(th.top);
    const sideMat = mat(th.side);
    const D = 4;
    // Columnas de suelo: se agrupan las columnas consecutivas con la misma altura
    const tops = [];
    for (let x = 0; x < lv.cols; x++) {
      let top = -1;
      for (let y = 0; y < ROWS; y++) if (lv.grid[y * lv.cols + x] === T.GROUND) { top = y; break; }
      tops.push(top);
    }
    let start = 0;
    for (let x = 1; x <= lv.cols; x++) {
      if (x < lv.cols && tops[x] === tops[start]) continue;
      const top = tops[start];
      if (top >= 0) {
        const w = x - start;
        const h = ROWS - top + 6; // se extiende hacia abajo para que los vacíos se vean profundos
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, D), sideMat);
        body.position.set(start + w / 2, ROWS - top - h / 2, 0);
        body.receiveShadow = true;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.22, D + 0.1), topMat);
        cap.position.set(start + w / 2, ROWS - top - 0.08, 0);
        cap.receiveShadow = true;
        this.scene.add(body, cap);
        if (lv.theme !== 'castle') this.addGrass(start, x, ROWS - top, mat(new THREE.Color(th.top).multiplyScalar(1.6)));
        else this.addBricks(start, x, ROWS - top, h, D);
      }
      start = x;
    }

    // Plataformas y agua
    for (const r of lv.runs()) {
      const w = r.x1 - r.x0;
      if (r.type === T.PLATFORM) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, 1.6), mat(th.platform));
        plank.position.set(r.x0 + w / 2, ROWS - r.ty - 0.16, 0);
        plank.castShadow = plank.receiveShadow = true;
        this.scene.add(plank);
        // Cadenas / soportes
        for (const sx of [r.x0 + 0.2, r.x1 - 0.2]) {
          const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3, 5), mat('#3a3a40', { metalness: 0.6 }));
          chain.position.set(sx, ROWS - r.ty + 1.4, -0.5);
          this.scene.add(chain);
        }
      } else if (r.type === T.WATER && r.ty === ROWS - 2) {
        const water = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.1, 4),
          new THREE.MeshStandardMaterial({ color: '#0f3a30', emissive: '#0a3a2c', emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.88 }),
        );
        water.position.set(r.x0 + w / 2, ROWS - r.ty - 0.35, 0);
        water.userData.water = true;
        this.water = this.water || [];
        this.water.push(water);
        const bed = new THREE.Mesh(new THREE.BoxGeometry(w, 6, 4), mat('#0a1410'));
        bed.position.set(r.x0 + w / 2, ROWS - r.ty - 3.5, 0);
        this.scene.add(water, bed);
      }
    }
  }

  addGrass(x0, x1, y, material) {
    const rnd = seeded(x0 * 17 + y);
    const geo = new THREE.ConeGeometry(0.035, 0.24, 3);
    const count = Math.floor((x1 - x0) * 7);
    const grass = new THREE.InstancedMesh(geo, material, count);
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const s = 0.6 + rnd() * 0.9;
      m.compose(
        new THREE.Vector3(x0 + rnd() * (x1 - x0), y + 0.1 * s, -1.9 + rnd() * 3.6),
        new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4)),
        new THREE.Vector3(s, s, s),
      );
      grass.setMatrixAt(i, m);
    }
    this.scene.add(grass);
  }

  addBricks(x0, x1, top, h, D) {
    // Relieve de ladrillos en la cara frontal del muro del castillo
    const brick = new THREE.BoxGeometry(0.48, 0.24, 0.06);
    const rows = Math.min(8, Math.floor(h));
    const count = Math.ceil((x1 - x0) * 2) * rows * 2;
    const inst = new THREE.InstancedMesh(brick, mat('#37323d'), count);
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < rows * 2 && i < count; r++) {
      const off = r % 2 ? 0.25 : 0;
      for (let x = x0 + off; x < x1 - 0.2 && i < count; x += 0.5) {
        m.makeTranslation(x + 0.25, top - 0.35 - r * 0.28, D / 2 + 0.02);
        inst.setMatrixAt(i++, m);
      }
    }
    inst.count = i;
    this.scene.add(inst);
  }

  /* ---------- Escenografía de fondo ---------- */
  buildBackdrop() {
    const lv = this.level;
    const th = this.theme;
    const W = lv.cols;
    const rnd = seeded(W * 7 + lv.theme.length);

    // Montañas lejanas
    const mMat = new THREE.MeshBasicMaterial({ color: th.mountain });
    for (let x = -20; x < W + 30; x += 14 + rnd() * 10) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(12 + rnd() * 10, 18 + rnd() * 14, 5), mMat);
      m.position.set(x, 2, -55 - rnd() * 15);
      this.scene.add(m);
    }

    if (lv.theme === 'castle') {
      // Muralla del castillo al fondo con torres y ventanas encendidas
      const wallMat = mat('#1d1418');
      const wall = new THREE.Mesh(new THREE.BoxGeometry(W + 60, 9, 2), wallMat);
      wall.position.set(W / 2, 6, -22);
      this.scene.add(wall);
      for (let x = -10; x < W + 20; x += 12 + rnd() * 6) {
        const h = 10 + rnd() * 8;
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, h, 8), wallMat);
        tower.position.set(x, h / 2 + 1, -21);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.5, 8), mat('#2a0d12'));
        roof.position.set(x, h + 2.7, -21);
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.8), new THREE.MeshBasicMaterial({ color: '#ffaa55' }));
        win.position.set(x, h * 0.7, -19.3);
        this.scene.add(tower, roof, win);
      }
      // Pilares y estandartes junto al camino
      for (let x = 3; x < W; x += 7 + rnd() * 4) {
        if (!this.groundAt(x)) continue;
        const pillar = createProp(rnd() > 0.5 ? 'pillar_decorated' : 'column', { scale: 1.1 });
        pillar.position.set(x, this.groundAt(x), -1.6);
        this.scene.add(pillar);
        if (rnd() > 0.4) {
          const banner = createProp('banner_patternA_red', { scale: 0.9, tint: '#6a3030' });
          banner.position.set(x + 1.5, this.groundAt(x) + 0.1, -1.85);
          this.scene.add(banner);
        }
      }
      this.scatter(['rubble_large', 'barrel_large', 'sword_shield_broken'], 0.55, 0.9, rnd);
      this.lights(['candle_lit'], '#ff9a4a', rnd, 6);
    } else {
      // Árboles: pinos oscuros (bosque) o árboles muertos (pantano)
      const pineMats = [mat('#14251c'), mat('#10201a'), mat('#182c20')];
      const trunk = mat('#24170f');
      for (let layer = 0; layer < 3; layer++) {
        const z = [-3.2, -7, -13][layer];
        const step = [2.6, 3.4, 4.2][layer];
        for (let x = -12; x < W + 12; x += step + rnd() * step) {
          if (lv.theme === 'forest' && rnd() > 0.25) {
            const s = (1.3 + rnd() * 0.9) * (1 + layer * 0.35);
            const g = new THREE.Group();
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.2 * s, 6), trunk);
            t.position.y = 0.6 * s;
            g.add(t);
            for (let i = 0; i < 4; i++) {
              const c = new THREE.Mesh(new THREE.ConeGeometry((1.2 - i * 0.24) * s, 1.4 * s, 7), pineMats[i % 3]);
              c.position.y = (1.3 + i * 0.75) * s;
              c.rotation.y = rnd() * 3;
              g.add(c);
            }
            g.position.set(x, this.groundAt(x) || 1, z);
            g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
            this.scene.add(g);
          } else {
            const tree = createProp(['tree_dead_large', 'tree_dead_medium', 'tree_dead_small'][Math.floor(rnd() * 3)], { scale: 1.6 + layer * 0.8 + rnd(), tint: lv.theme === 'swamp' ? '#2a3a2a' : '#2a221c' });
            tree.position.set(x, this.groundAt(x) || 1, z);
            tree.rotation.y = rnd() * Math.PI * 2;
            this.scene.add(tree);
          }
        }
      }
      if (lv.theme === 'forest') {
        this.scatter(['grave_A', 'grave_B', 'gravestone', 'fence_broken'], 0.35, 1, rnd);
        this.lights(['lantern_standing', 'post_lantern'], '#ffb45a', rnd, 5);
      } else {
        this.scatter(['ribcage', 'skull', 'bone_A', 'fence_broken', 'grave_A'], 0.45, 1, rnd);
        const crypt = createProp('crypt', { scale: 2.2, tint: '#3a4a40' });
        crypt.position.set(W * 0.45, 1.5, -9);
        this.scene.add(crypt);
        this.lights(['lantern_standing'], '#7dffb0', rnd, 4);
      }
    }
  }

  /** Altura del suelo (en unidades 3D) en la columna x, o 0 si hay vacío. */
  groundAt(x) {
    const tx = Math.floor(x);
    if (tx < 0 || tx >= this.level.cols) return 2;
    for (let y = 0; y < ROWS; y++) if (this.level.grid[y * this.level.cols + tx] === T.GROUND) return ROWS - y;
    return 0;
  }

  /** Coloca objetos decorativos detrás del camino. */
  scatter(names, density, scale, rnd) {
    for (let x = 2; x < this.level.cols - 2; x += 1.5 + rnd() * 3) {
      if (rnd() > density) continue;
      const g = this.groundAt(x);
      if (!g) continue;
      const prop = createProp(names[Math.floor(rnd() * names.length)], { scale: scale * 0.55 * (0.8 + rnd() * 0.4) });
      prop.position.set(x, g, -1.55 - rnd() * 0.35);
      prop.rotation.y = (rnd() - 0.5) * 1.2;
      this.scene.add(prop);
    }
  }

  /** Faroles o velas con luz cálida que parpadea. */
  lights(names, color, rnd, max) {
    let placed = 0;
    for (let x = 8; x < this.level.cols - 4 && placed < max; x += 14 + rnd() * 8) {
      const g = this.groundAt(x);
      if (!g) continue;
      const prop = createProp(names[placed % names.length], { scale: 0.8 });
      prop.position.set(x, g, -1.7);
      const light = new THREE.PointLight(color, 6, 7, 1.8);
      light.position.set(x, g + 1.4, -1.2);
      this.fires.push({ light, base: 6, seed: rnd() * 10 });
      this.scene.add(prop, light);
      placed++;
    }
  }

  /* ---------- Objetos ---------- */
  buildItems() {
    const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24);
    const coinMat = new THREE.MeshStandardMaterial({ color: '#f4c542', metalness: 0.9, roughness: 0.25, emissive: '#7a5a10', emissiveIntensity: 0.9 });
    const glassMat = new THREE.MeshStandardMaterial({ color: '#e8f0ff', transparent: true, opacity: 0.35, roughness: 0.05 });
    const liquidMat = new THREE.MeshStandardMaterial({ color: '#ff2a55', emissive: '#c0103a', emissiveIntensity: 1.4 });
    for (const it of this.level.items) {
      const p = toWorld(it.x, it.y);
      let mesh;
      if (it.kind === 'coin') {
        mesh = new THREE.Mesh(coinGeo, coinMat);
        mesh.rotation.x = Math.PI / 2;
        mesh.castShadow = true;
      } else {
        mesh = new THREE.Group();
        mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), glassMat));
        const liquid = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), liquidMat);
        liquid.position.y = -0.02;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 8), glassMat);
        neck.position.y = 0.2;
        const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 8), mat('#8a5a32'));
        cork.position.y = 0.29;
        mesh.add(liquid, neck, cork);
      }
      mesh.position.copy(p);
      mesh.userData.baseY = p.y;
      this.scene.add(mesh);
      this.itemMeshes.push(mesh);
    }
  }

  takeItem(index) {
    const mesh = this.itemMeshes[index];
    if (!mesh) return;
    mesh.visible = false;
    const isCoin = this.level.items[index].kind === 'coin';
    this.burst(mesh.position, isCoin ? '#ffd86a' : '#ff6a8a', 18);
  }

  /* ---------- Hogueras ---------- */
  buildCheckpoints() {
    this.bonfires = this.level.checkpoints.map((cp) => {
      const p = toWorld(cp.x + TILE / 2, cp.y + TILE);
      const g = new THREE.Group();
      g.position.set(p.x, p.y, 0.6);
      for (let i = 0; i < 6; i++) {
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), mat('#4a4650'));
        stone.position.set(Math.cos(i) * 0.3, 0.05, Math.sin(i) * 0.3);
        g.add(stone);
      }
      for (const r of [0.7, -0.7]) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), mat('#4a2e1a'));
        log.rotation.z = Math.PI / 2;
        log.rotation.y = r;
        log.position.y = 0.08;
        g.add(log);
      }
      const flameMat = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.9 });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 8), flameMat);
      flame.position.y = 0.38;
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.35, 8), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
      core.position.y = 0.28;
      flame.visible = core.visible = false;
      g.add(flame, core);
      const light = new THREE.PointLight('#ff8a3a', 0, 9, 1.6);
      light.position.y = 0.8;
      g.add(light);
      this.scene.add(g);
      return { group: g, flame, core, light };
    });
  }

  lightBonfire(i) {
    const b = this.bonfires[i];
    if (!b) return;
    b.flame.visible = b.core.visible = true;
    b.lit = true;
    this.fires.push({ light: b.light, base: 14, seed: i * 3 });
    this.burst(b.group.position.clone().add(new THREE.Vector3(0, 0.4, 0)), '#ffa040', 30);
  }

  /* ---------- Puerta del guardián ---------- */
  buildExit() {
    const ex = this.level.exit;
    if (!ex) return;
    const p = toWorld(ex.x + ex.w / 2, ex.y + ex.h);
    const arch = createProp('arch_gate', { scale: 1.3, tint: '#5a5560' });
    arch.position.set(p.x, p.y, -0.2);
    this.scene.add(arch);
    this.portalMat = new THREE.MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const portal = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), this.portalMat);
    portal.position.set(p.x, p.y + 1.1, -0.15);
    this.portal = portal;
    this.portalLight = new THREE.PointLight('#ff3030', 8, 6, 1.6);
    this.portalLight.position.set(p.x, p.y + 1.2, 0.8);
    this.scene.add(portal, this.portalLight);
  }

  openExit() {
    if (!this.portal) return;
    this.portalMat.color.set('#8fdcff');
    this.portalLight.color.set('#7fd0ff');
    this.portalLight.intensity = 14;
    this.burst(this.portal.position, '#9fe8ff', 40);
  }

  /* ---------- Partículas ---------- */
  buildParticles() {
    const cfg = this.theme.particles;
    const W = this.level.cols;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(cfg.count * 3);
    const rnd = seeded(99);
    for (let i = 0; i < cfg.count; i++) {
      pos[i * 3] = -5 + rnd() * (W + 10);
      pos[i * 3 + 1] = 1 + rnd() * 8;
      pos[i * 3 + 2] = -10 + rnd() * 12;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.ambient = new THREE.Points(geo, new THREE.PointsMaterial({
      color: cfg.color, size: cfg.kind === 'ember' ? 0.07 : 0.09, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.ambient.userData.kind = cfg.kind;
    this.scene.add(this.ambient);
  }

  /** Explosión de chispas (al recoger objetos, encender hogueras o vencer enemigos). */
  burst(origin, color, n = 20) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const vel = [];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = origin.x; pos[i * 3 + 1] = origin.y; pos[i * 3 + 2] = origin.z;
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4 + 1, (Math.random() - 0.5) * 4));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.scene.add(pts);
    this.bursts.push({ pts, vel, life: 0.9 });
  }

  /* ---------- Animación ---------- */
  update(dt, focus) {
    this.time += dt;
    const t = this.time;
    for (const m of this.itemMeshes) {
      if (!m.visible) continue;
      m.position.y = m.userData.baseY + Math.sin(t * 3 + m.position.x) * 0.08;
      if (m.isMesh) m.rotation.z = t * 3; else m.rotation.y = t;
    }
    for (const b of this.bonfires) {
      if (!b.lit) continue;
      b.flame.scale.set(1, 1 + Math.sin(t * 14 + b.group.position.x) * 0.18, 1);
      b.core.scale.set(1, 1 + Math.sin(t * 18) * 0.2, 1);
    }
    for (const f of this.fires) f.light.intensity = f.base * (0.85 + Math.sin(t * 11 + f.seed) * 0.08 + Math.sin(t * 7.3 + f.seed) * 0.07);
    if (this.portal) {
      this.portal.rotation.z = t * 0.6;
      this.portal.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
    }
    if (this.water) this.water.forEach((w) => { w.material.emissiveIntensity = 0.5 + Math.sin(t * 2 + w.position.x) * 0.15; });

    // Partículas ambientales
    const pos = this.ambient.geometry.attributes.position;
    const kind = this.ambient.userData.kind;
    for (let i = 0; i < pos.count; i++) {
      if (kind === 'ember') {
        pos.array[i * 3 + 1] += dt * (0.4 + (i % 5) * 0.12);
        pos.array[i * 3] += Math.sin(t + i) * dt * 0.2;
        if (pos.array[i * 3 + 1] > 10) pos.array[i * 3 + 1] = 0.5;
      } else {
        pos.array[i * 3 + 1] += Math.sin(t * 1.3 + i) * dt * 0.25;
        pos.array[i * 3] += Math.cos(t * 0.7 + i) * dt * 0.2;
      }
    }
    pos.needsUpdate = true;
    this.ambient.material.opacity = 0.6 + Math.sin(t * 2.5) * 0.3;

    // Chispas temporales
    for (const b of this.bursts) {
      b.life -= dt;
      const arr = b.pts.geometry.attributes.position.array;
      b.vel.forEach((v, i) => {
        v.y -= 9 * dt;
        arr[i * 3] += v.x * dt; arr[i * 3 + 1] += v.y * dt; arr[i * 3 + 2] += v.z * dt;
      });
      b.pts.geometry.attributes.position.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, b.life / 0.9);
      if (b.life <= 0) { this.scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); }
    }
    this.bursts = this.bursts.filter((b) => b.life > 0);

    // La luz de luna y su sombra siguen al personaje enfocado
    if (focus) {
      this.moon.position.set(focus.x - 6, focus.y + 14, 10);
      this.moon.target.position.set(focus.x, focus.y, 0);
      this.rim.target.position.set(focus.x, focus.y, 0);
      this.rim.position.set(focus.x + 3, focus.y + 8, -12);
      this.fill.position.set(focus.x + 1.2, focus.y + 2.4, 3.2);
      this.moonMesh.position.x = focus.x + 30;
      this.moonMesh.userData.halo.position.x = focus.x + 30;
    }
  }
}
