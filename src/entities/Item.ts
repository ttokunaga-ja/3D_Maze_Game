import * as THREE from 'three';
import { BLOCK_SIZE, PLAYER_EYE_Y } from '../config/constants';
import type { ItemKind } from '../types';

export interface ItemEntity {
  group: THREE.Group;
  kind: ItemKind;
  bobPhase: number;
  basePosition: THREE.Vector3;
  ring: THREE.Mesh;
}

const RING_COLORS: Record<ItemKind, number> = {
  wallBreaker: 0xffa040,
  healPotion: 0xff4060,
  timeBonus: 0x40b0ff,
};

function createRing(color: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(BLOCK_SIZE * 0.32, BLOCK_SIZE * 0.42, 24),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -BLOCK_SIZE * 0.45;
  return ring;
}

function buildWallBreaker(): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(BLOCK_SIZE * 0.04, BLOCK_SIZE * 0.04, BLOCK_SIZE * 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b3d1f, roughness: 0.8 }),
  );
  g.add(handle);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(BLOCK_SIZE * 0.28, BLOCK_SIZE * 0.18, BLOCK_SIZE * 0.18),
    new THREE.MeshStandardMaterial({
      color: 0xc8c8d0,
      roughness: 0.35,
      metalness: 0.8,
      emissive: 0x303040,
      emissiveIntensity: 0.3,
    }),
  );
  head.position.y = BLOCK_SIZE * 0.2;
  g.add(head);
  g.rotation.z = Math.PI / 6;
  return g;
}

function buildHealPotion(): THREE.Group {
  const g = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
    metalness: 0.2,
  });
  const flask = new THREE.Mesh(new THREE.SphereGeometry(BLOCK_SIZE * 0.18, 16, 12), glassMat);
  flask.position.y = -BLOCK_SIZE * 0.04;
  g.add(flask);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(BLOCK_SIZE * 0.06, BLOCK_SIZE * 0.08, BLOCK_SIZE * 0.12, 12),
    glassMat,
  );
  neck.position.y = BLOCK_SIZE * 0.14;
  g.add(neck);
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(BLOCK_SIZE * 0.15, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0xff3060,
      emissive: 0xff1040,
      emissiveIntensity: 1.0,
      roughness: 0.4,
    }),
  );
  liquid.position.y = -BLOCK_SIZE * 0.04;
  g.add(liquid);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(BLOCK_SIZE * 0.08, BLOCK_SIZE * 0.08, BLOCK_SIZE * 0.04, 12),
    new THREE.MeshStandardMaterial({ color: 0x664020, roughness: 0.8 }),
  );
  cap.position.y = BLOCK_SIZE * 0.22;
  g.add(cap);
  return g;
}

function buildTimeBonus(): THREE.Group {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xb8a050,
    roughness: 0.4,
    metalness: 0.7,
  });
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x60c8ff,
    emissive: 0x2070c0,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.04, BLOCK_SIZE * 0.3),
    frameMat,
  );
  topPlate.position.y = BLOCK_SIZE * 0.22;
  g.add(topPlate);
  const bottomPlate = new THREE.Mesh(
    new THREE.BoxGeometry(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.04, BLOCK_SIZE * 0.3),
    frameMat,
  );
  bottomPlate.position.y = -BLOCK_SIZE * 0.22;
  g.add(bottomPlate);
  const upper = new THREE.Mesh(
    new THREE.ConeGeometry(BLOCK_SIZE * 0.14, BLOCK_SIZE * 0.22, 16, 1, false),
    sandMat,
  );
  upper.position.y = BLOCK_SIZE * 0.09;
  upper.rotation.x = Math.PI;
  g.add(upper);
  const lower = new THREE.Mesh(
    new THREE.ConeGeometry(BLOCK_SIZE * 0.14, BLOCK_SIZE * 0.22, 16, 1, false),
    sandMat,
  );
  lower.position.y = -BLOCK_SIZE * 0.09;
  g.add(lower);
  return g;
}

export function createItem(kind: ItemKind, position: THREE.Vector3): ItemEntity {
  const group = new THREE.Group();
  let inner: THREE.Group;
  switch (kind) {
    case 'wallBreaker':
      inner = buildWallBreaker();
      break;
    case 'healPotion':
      inner = buildHealPotion();
      break;
    case 'timeBonus':
      inner = buildTimeBonus();
      break;
  }
  group.add(inner);

  const ring = createRing(RING_COLORS[kind]);
  group.add(ring);

  const basePosition = position.clone();
  basePosition.y = PLAYER_EYE_Y;
  group.position.copy(basePosition);

  return {
    group,
    kind,
    bobPhase: Math.random() * Math.PI * 2,
    basePosition,
    ring,
  };
}

export function updateItemAnimation(item: ItemEntity, elapsed: number): void {
  const bob = Math.sin(elapsed * 2 + item.bobPhase) * BLOCK_SIZE * 0.06;
  item.group.position.y = item.basePosition.y + bob;
  item.group.rotation.y = elapsed * 1.4;
  const ringScale = 1 + Math.sin(elapsed * 3 + item.bobPhase) * 0.06;
  item.ring.scale.setScalar(ringScale);
}
