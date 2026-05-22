import * as THREE from 'three';
import { BLOCK_SIZE, ENEMY_INITIAL_HP, PLAYER_EYE_Y } from '../config/constants';

export interface Enemy {
  group: THREE.Group;
  hp: number;
  maxHp: number;
  lastAttackTime: number;
  lastSeenPlayerPosition: THREE.Vector3 | null;
  hpBar: THREE.Sprite;
  body: THREE.Mesh;
  bodyMat: THREE.MeshStandardMaterial;
  state: 'idle' | 'chasing';
  bobPhase: number;
}

const ENEMY_SIZE = BLOCK_SIZE * 0.55;

function makeHpSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 24;
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.14, 1);
  (sprite.userData as { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }) = {
    canvas,
    texture: tex,
  };
  return sprite;
}

export function updateHpBar(sprite: THREE.Sprite, ratio: number): void {
  const { canvas, texture } = sprite.userData as {
    canvas: HTMLCanvasElement;
    texture: THREE.CanvasTexture;
  };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = ratio > 0.5 ? '#5cff5c' : ratio > 0.25 ? '#ffd44c' : '#ff5c5c';
  ctx.fillRect(2, 2, (canvas.width - 4) * Math.max(0, Math.min(1, ratio)), canvas.height - 4);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  texture.needsUpdate = true;
}

export function createEnemy(position: THREE.Vector3): Enemy {
  const group = new THREE.Group();
  group.position.copy(position);
  group.position.y = PLAYER_EYE_Y;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc73838,
    emissive: 0x441010,
    emissiveIntensity: 0.4,
    roughness: 0.6,
    metalness: 0.2,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x882020,
    roughness: 0.6,
    metalness: 0.3,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffe04c,
    emissive: 0xff8c00,
    emissiveIntensity: 1.5,
  });
  const limbMat = new THREE.MeshStandardMaterial({ color: 0x4a1010, roughness: 0.7 });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(ENEMY_SIZE, ENEMY_SIZE * 0.9, ENEMY_SIZE * 0.7),
    bodyMat,
  );
  body.position.y = 0;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(ENEMY_SIZE * 0.6, ENEMY_SIZE * 0.5, ENEMY_SIZE * 0.55),
    headMat,
  );
  head.position.y = ENEMY_SIZE * 0.75;
  group.add(head);

  const eyeGeom = new THREE.SphereGeometry(ENEMY_SIZE * 0.08, 10, 8);
  const eye1 = new THREE.Mesh(eyeGeom, eyeMat);
  eye1.position.set(ENEMY_SIZE * 0.15, ENEMY_SIZE * 0.78, -ENEMY_SIZE * 0.28);
  group.add(eye1);
  const eye2 = new THREE.Mesh(eyeGeom, eyeMat);
  eye2.position.set(-ENEMY_SIZE * 0.15, ENEMY_SIZE * 0.78, -ENEMY_SIZE * 0.28);
  group.add(eye2);

  // 3 spikes on top for silhouette
  const spikeGeom = new THREE.ConeGeometry(ENEMY_SIZE * 0.1, ENEMY_SIZE * 0.45, 6);
  for (let i = -1; i <= 1; i++) {
    const spike = new THREE.Mesh(spikeGeom, limbMat);
    spike.position.set(i * ENEMY_SIZE * 0.18, ENEMY_SIZE * 1.15, 0);
    group.add(spike);
  }

  // Arms
  const armGeom = new THREE.BoxGeometry(ENEMY_SIZE * 0.18, ENEMY_SIZE * 0.6, ENEMY_SIZE * 0.18);
  const armL = new THREE.Mesh(armGeom, limbMat);
  armL.position.set(-ENEMY_SIZE * 0.5, 0, 0);
  group.add(armL);
  const armR = new THREE.Mesh(armGeom, limbMat);
  armR.position.set(ENEMY_SIZE * 0.5, 0, 0);
  group.add(armR);

  const hpBar = makeHpSprite();
  hpBar.position.set(0, ENEMY_SIZE * 1.7, 0);
  updateHpBar(hpBar, 1);
  group.add(hpBar);

  return {
    group,
    hp: ENEMY_INITIAL_HP,
    maxHp: ENEMY_INITIAL_HP,
    lastAttackTime: 0,
    lastSeenPlayerPosition: null,
    hpBar,
    body,
    bodyMat,
    state: 'idle',
    bobPhase: Math.random() * Math.PI * 2,
  };
}

export function setEnemyState(enemy: Enemy, state: 'idle' | 'chasing'): void {
  if (enemy.state === state) return;
  enemy.state = state;
  if (state === 'chasing') {
    enemy.bodyMat.color.setHex(0xff4040);
    enemy.bodyMat.emissive.setHex(0x771010);
  } else {
    enemy.bodyMat.color.setHex(0xc7a838);
    enemy.bodyMat.emissive.setHex(0x443010);
  }
}
