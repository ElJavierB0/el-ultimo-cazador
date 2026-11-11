import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * Engine: renderer WebGL, cámara y posprocesado (bloom para que brillen fuego, ojos y monedas).
 * Una sola escena 3D se reutiliza: cada nivel la limpia y la vuelve a construir.
 */
export class Engine {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  /** Elimina todo de la escena y libera la memoria de geometrías y materiales propios. */
  clear() {
    const keep = [];
    this.scene.traverse((o) => {
      if (o.userData.shared) return;
      if (o.geometry && !o.geometry.userData.shared) keep.push(o.geometry);
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { if (!m.userData.shared) keep.push(m); });
    });
    keep.forEach((x) => x.dispose());
    this.scene.clear();
    this.scene.fog = null;
  }

  /** Convierte una posición 3D en coordenadas de pantalla (para textos flotantes). */
  toScreen(v3) {
    const v = v3.clone().project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight, visible: v.z < 1 };
  }

  render() {
    this.composer.render();
  }
}
