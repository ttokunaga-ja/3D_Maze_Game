import * as THREE from 'three';
import { CAMERA_FAR, CAMERA_FOV, CAMERA_NEAR } from '../config/constants';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function createSceneContext(canvas: HTMLCanvasElement): SceneContext {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a14);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0a14, CAMERA_FAR * 0.55, CAMERA_FAR);

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR);

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  return { renderer, scene, camera };
}
