import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/**
 * Assets: carga los modelos 3D (KayKit, CC0), los guarda en caché y crea copias para cada personaje.
 * Cada personaje recibe una paleta propia (más oscura) generada al recolorear su textura.
 */
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const CHAR_PATH = 'assets/models/characters/';
const PROP_PATH = 'assets/models/props/';

export const CHARACTER_FILES = [
  'Rogue_Hooded', 'Rogue', 'Barbarian', 'Knight', 'Mage',
  'Skeleton_Minion', 'Skeleton_Rogue', 'Skeleton_Mage', 'Skeleton_Warrior',
];
export const PROP_FILES = [
  'tree_dead_large', 'tree_dead_medium', 'tree_dead_small', 'grave_A', 'grave_B', 'gravestone', 'fence', 'fence_broken',
  'lantern_standing', 'post_lantern', 'skull', 'ribcage', 'bone_A', 'crypt', 'arch_gate', 'sword_1handed',
  'pillar_decorated', 'column', 'banner_patternA_red', 'rubble_large', 'barrel_large', 'candle_lit', 'sword_shield_broken',
];

const cache = { chars: {}, props: {}, clips: { adventurer: [], skeleton: [] } };

function load(url) {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
}

/** Carga todo con una función de progreso (0 a 1). */
export async function loadAll(onProgress = () => {}) {
  const jobs = [
    ...CHARACTER_FILES.map((n) => [CHAR_PATH, n, 'chars']),
    ...PROP_FILES.map((n) => [PROP_PATH, n, 'props']),
  ];
  let done = 0;
  await Promise.all(jobs.map(async ([path, name, bucket]) => {
    const gltf = await load(`${path}${name}.glb`);
    cache[bucket][name] = gltf;
    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.geometry.userData.shared = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { m.userData.shared = true; });
      }
    });
    onProgress(++done / jobs.length);
  }));
  cache.clips.adventurer = cache.chars.Rogue_Hooded.animations;
  cache.clips.skeleton = cache.chars.Skeleton_Warrior.animations;
}

/* ---------- Recoloreado de texturas (paletas oscuras) ---------- */
const paletteCache = new Map();

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l];
  const hue = (p, q, t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
}

/**
 * Devuelve una copia de la textura con tono, saturación y luz ajustados.
 * tint: color opcional que se mezcla para dar un matiz común (ej. verde enfermizo para no-muertos).
 */
function recolor(texture, { hue = 0, sat = 1, light = 1, tint = null, tintAmount = 0 }, key) {
  if (paletteCache.has(key)) return paletteCache.get(key);
  const img = texture.image;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const t = tint ? new THREE.Color(tint) : null;
  for (let i = 0; i < px.length; i += 4) {
    let [h, s, l] = rgbToHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
    h = (h + hue + 1) % 1;
    s = Math.min(1, s * sat);
    l = Math.min(1, l * light);
    let [r, g, b] = hslToRgb(h, s, l);
    if (t) { r += (t.r * l * 2 - r) * tintAmount; g += (t.g * l * 2 - g) * tintAmount; b += (t.b * l * 2 - b) * tintAmount; }
    px[i] = r * 255; px[i + 1] = g * 255; px[i + 2] = b * 255;
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = texture.flipY;
  tex.colorSpace = texture.colorSpace;
  tex.magFilter = texture.magFilter;
  tex.minFilter = texture.minFilter;
  paletteCache.set(key, tex);
  return tex;
}

/**
 * Crea una copia animable de un personaje.
 * spec: { file, height, hide: [nombres de mallas], palette, eyes: color emisivo, sword: true }
 */
export function createCharacter(spec) {
  const gltf = cache.chars[spec.file];
  const root = SkeletonUtils.clone(gltf.scene);
  const materials = new Map();
  let knife = null;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (spec.hide?.some((h) => o.name === h || o.name.startsWith(h))) o.visible = false;
    if (o.name === 'Knife') knife = o;
    // Material propio con la textura recoloreada
    const base = o.material;
    if (!materials.has(base)) {
      const m = base.clone();
      if (spec.palette && base.map) m.map = recolor(base.map, spec.palette, `${spec.id}:${base.map.uuid}`);
      m.roughness = 0.85;
      materials.set(base, m);
    }
    o.material = materials.get(base);
    if (spec.eyes && /Eyes/.test(o.name)) {
      o.material = o.material.clone();
      o.material.emissive = new THREE.Color(spec.eyes);
      o.material.emissiveIntensity = 3.5;
    }
  });

  // Escala el modelo a la altura indicada (medida sin armas ocultas)
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.isMesh && o.visible) box.expandByObject(o); });
  root.scale.setScalar(spec.height / Math.max(0.01, box.max.y - box.min.y));
  root.updateMatrixWorld(true);

  // El cazador cambia la daga por una espada de plata
  if (spec.sword && knife) {
    const sword = cache.props.sword_1handed.scene.clone();
    sword.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.metalness = 0.9;
        o.material.roughness = 0.25;
        o.material.color = new THREE.Color('#dfe8f0');
        o.material.emissive = new THREE.Color('#3a5a7a');
        o.material.emissiveIntensity = 0.35;
      }
    });
    sword.position.copy(knife.position);
    sword.quaternion.copy(knife.quaternion);
    knife.parent.add(sword);
    knife.visible = false;
    // La espada mide un poco menos de la mitad de la altura del cazador
    root.updateMatrixWorld(true);
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(sword).getSize(size);
    sword.scale.multiplyScalar((spec.height * 0.42) / Math.max(size.x, size.y, size.z));
  }

  const clips = spec.file.startsWith('Skeleton') ? cache.clips.skeleton : cache.clips.adventurer;
  return { root, clips };
}

/** Copia de un objeto de escenario. */
export function createProp(name, { scale = 1, tint = null, emissive = null } = {}) {
  const src = cache.props[name];
  if (!src) return new THREE.Group();
  const obj = src.scene.clone();
  obj.scale.setScalar(scale);
  if (tint || emissive) {
    obj.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      if (tint) o.material.color = new THREE.Color(tint);
      if (emissive) { o.material.emissive = new THREE.Color(emissive); o.material.emissiveIntensity = 1.5; }
    });
  }
  return obj;
}
