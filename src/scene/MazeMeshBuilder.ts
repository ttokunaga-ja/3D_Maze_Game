import * as THREE from 'three';
import {
  BLOCK_INITIAL_HP,
  BLOCK_SIZE,
  FLOOR_Y,
  MAP_SIZE,
  WALL_HEIGHT,
} from '../config/constants';
import type { MapGrid } from '../types';
import { cellToWorld } from '../world/MapUtils';

const FLOOR_COLORS = [0x6f7077, 0x7e7f86, 0x8d8e95];

export interface MazeMeshHandle {
  group: THREE.Group;
  wallHP: Map<string, number>;
  breakWall: (cellX: number, cellZ: number) => void;
}

const dummy = new THREE.Object3D();

export function buildMazeMeshes(scene: THREE.Scene, map: MapGrid): MazeMeshHandle {
  const group = new THREE.Group();

  let wallCount = 0;
  let goalCount = 0;
  const floorCounts = [0, 0, 0];

  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const v = map[x][z];
      if (v === 1 || v === 3) wallCount++;
      else if (v === 2) goalCount++;
      else if (v === 0) floorCounts[(x + z) % 3]++;
    }
  }

  const wallGeom = new THREE.BoxGeometry(BLOCK_SIZE, WALL_HEIGHT, BLOCK_SIZE);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x6b4326,
    roughness: 0.9,
    metalness: 0.05,
  });
  const wallY = FLOOR_Y + WALL_HEIGHT / 2;

  // Allocate with extra capacity for future floor additions when walls are broken.
  const floorCapacity = floorCounts.map((c) => c + wallCount);

  const wallMesh = new THREE.InstancedMesh(wallGeom, wallMat, wallCount);
  wallMesh.castShadow = false;
  wallMesh.receiveShadow = false;

  const floorGeom = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE * 0.1, BLOCK_SIZE);
  const floorMats = FLOOR_COLORS.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0.0 }),
  );
  const floorMeshes = floorMats.map(
    (m, i) => new THREE.InstancedMesh(floorGeom, m, floorCapacity[i]),
  );
  const floorY = FLOOR_Y - BLOCK_SIZE * 0.05;

  const goalMat = new THREE.MeshStandardMaterial({
    color: 0x4cff70,
    emissive: 0x1a8a3a,
    emissiveIntensity: 0.6,
    roughness: 0.7,
  });
  const goalMesh = new THREE.InstancedMesh(floorGeom, goalMat, goalCount);

  const wallIndexByCell = new Map<string, number>();
  const wallHP = new Map<string, number>();
  const floorWriteIndex = [0, 0, 0];
  const floorCurrentCount = [0, 0, 0];
  let wallWrite = 0;
  let goalWrite = 0;

  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const v = map[x][z];
      const wx = cellToWorld(x);
      const wz = cellToWorld(z);

      if (v === 1 || v === 3) {
        dummy.position.set(wx, wallY, wz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        wallMesh.setMatrixAt(wallWrite, dummy.matrix);
        const key = `${x},${z}`;
        wallIndexByCell.set(key, wallWrite);
        wallHP.set(key, BLOCK_INITIAL_HP);
        wallWrite++;
      } else if (v === 2) {
        dummy.position.set(wx, floorY, wz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        goalMesh.setMatrixAt(goalWrite, dummy.matrix);
        goalWrite++;
      } else if (v === 0) {
        const idx = (x + z) % 3;
        dummy.position.set(wx, floorY, wz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        floorMeshes[idx].setMatrixAt(floorWriteIndex[idx], dummy.matrix);
        floorWriteIndex[idx]++;
        floorCurrentCount[idx]++;
      }
    }
  }

  wallMesh.count = wallWrite;
  goalMesh.count = goalWrite;
  floorMeshes.forEach((m, i) => {
    m.count = floorCurrentCount[i];
    m.instanceMatrix.needsUpdate = true;
  });
  wallMesh.instanceMatrix.needsUpdate = true;
  goalMesh.instanceMatrix.needsUpdate = true;

  group.add(wallMesh);
  group.add(goalMesh);
  floorMeshes.forEach((m) => group.add(m));
  scene.add(group);

  const breakWall = (cellX: number, cellZ: number): void => {
    const key = `${cellX},${cellZ}`;
    const idx = wallIndexByCell.get(key);
    if (idx === undefined) return;

    // Hide the wall instance by scaling to zero.
    dummy.position.set(0, -10000, 0);
    dummy.scale.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    wallMesh.setMatrixAt(idx, dummy.matrix);
    wallMesh.instanceMatrix.needsUpdate = true;
    wallIndexByCell.delete(key);
    wallHP.delete(key);

    // Add a floor instance at the broken cell.
    const floorIdx = (cellX + cellZ) % 3;
    const writeIdx = floorWriteIndex[floorIdx];
    if (writeIdx < floorCapacity[floorIdx]) {
      const wx = cellToWorld(cellX);
      const wz = cellToWorld(cellZ);
      dummy.position.set(wx, floorY, wz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      floorMeshes[floorIdx].setMatrixAt(writeIdx, dummy.matrix);
      floorMeshes[floorIdx].instanceMatrix.needsUpdate = true;
      floorWriteIndex[floorIdx]++;
      floorMeshes[floorIdx].count = floorWriteIndex[floorIdx];
    }
  };

  return { group, wallHP, breakWall };
}
