import * as THREE from 'three';
import { BLOCK_SIZE, MAP_SIZE } from '../config/constants';

export function setupLights(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x202028, 0.45);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.4);
  dir.position.set(MAP_SIZE * BLOCK_SIZE * 0.3, BLOCK_SIZE * 12, MAP_SIZE * BLOCK_SIZE * 0.2);
  scene.add(dir);
}
