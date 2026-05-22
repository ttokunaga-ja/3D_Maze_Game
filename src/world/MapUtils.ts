import { BLOCK_SIZE, MAP_SIZE } from '../config/constants';
import type { MapGrid } from '../types';

export function worldToCell(value: number): number {
  return Math.round(value / BLOCK_SIZE + MAP_SIZE / 2);
}

export function cellToWorld(cell: number): number {
  return (cell - MAP_SIZE / 2) * BLOCK_SIZE;
}

export function isWall(map: MapGrid, cellX: number, cellZ: number): boolean {
  if (cellX < 0 || cellX >= MAP_SIZE || cellZ < 0 || cellZ >= MAP_SIZE) return true;
  const v = map[cellX][cellZ];
  return v === 1 || v === 3;
}

export function isGoal(map: MapGrid, cellX: number, cellZ: number): boolean {
  if (cellX < 0 || cellX >= MAP_SIZE || cellZ < 0 || cellZ >= MAP_SIZE) return false;
  return map[cellX][cellZ] === 2;
}

export function canStandAtWorld(map: MapGrid, x: number, z: number): boolean {
  const cellX = worldToCell(x);
  const cellZ = worldToCell(z);
  if (cellX < 0 || cellX >= MAP_SIZE || cellZ < 0 || cellZ >= MAP_SIZE) return false;
  const v = map[cellX][cellZ];
  return v === 0 || v === 2;
}

export function hasWallBetween(
  map: MapGrid,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): boolean {
  const startX = worldToCell(ax);
  const startZ = worldToCell(az);
  const endX = worldToCell(bx);
  const endZ = worldToCell(bz);

  if (startX < 0 || startX >= MAP_SIZE || startZ < 0 || startZ >= MAP_SIZE) return true;
  if (endX < 0 || endX >= MAP_SIZE || endZ < 0 || endZ >= MAP_SIZE) return true;
  if (isWall(map, startX, startZ)) return true;
  if (isWall(map, endX, endZ)) return true;

  const dx = Math.abs(endX - startX);
  const dz = Math.abs(endZ - startZ);
  const sx = startX < endX ? 1 : -1;
  const sz = startZ < endZ ? 1 : -1;
  let err = dx - dz;
  let x = startX;
  let z = startZ;

  while (x !== endX || z !== endZ) {
    const e2 = 2 * err;
    if (e2 > -dz) {
      err -= dz;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      z += sz;
    }
    if (isWall(map, x, z)) return true;
  }
  return false;
}
