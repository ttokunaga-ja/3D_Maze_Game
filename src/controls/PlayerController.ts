import * as THREE from 'three';
import { BLOCK_SIZE, MOVE_SPEED, ROTATE_SPEED } from '../config/constants';
import type { MapGrid } from '../types';
import { canStandAtWorld } from '../world/MapUtils';
import type { InputState } from './InputState';

// プレイヤーは ±zForward 方向を向いている前提（rotation.y=0 で -Z 方向）
const FORWARD = new THREE.Vector3(0, 0, -1);
const PLAYER_RADIUS = BLOCK_SIZE * 0.35;

export interface PlayerControllerOptions {
  group: THREE.Group;
  input: InputState;
  map: MapGrid;
}

export class PlayerController {
  private group: THREE.Group;
  private input: InputState;
  private map: MapGrid;
  isMoving = false;

  constructor(opts: PlayerControllerOptions) {
    this.group = opts.group;
    this.input = opts.input;
    this.map = opts.map;
  }

  setMap(map: MapGrid): void {
    this.map = map;
  }

  update(dt: number): void {
    const rotateLeft = this.input.isPressed('a');
    const rotateRight = this.input.isPressed('d');
    const forward = this.input.isPressed('w');
    const backward = this.input.isPressed('s');

    // 押した時間に線形比例して回転（速度一定）
    if (rotateLeft) this.group.rotation.y += ROTATE_SPEED * dt;
    if (rotateRight) this.group.rotation.y -= ROTATE_SPEED * dt;

    let move = 0;
    if (forward) move += 1;
    if (backward) move -= 1;

    if (move !== 0) {
      const dir = FORWARD.clone().applyEuler(new THREE.Euler(0, this.group.rotation.y, 0));
      const step = MOVE_SPEED * dt * move;
      this.tryMove(dir.x * step, dir.z * step);
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
  }

  private tryMove(dx: number, dz: number): void {
    const px = this.group.position.x;
    const pz = this.group.position.z;
    const nx = px + dx;
    const nz = pz + dz;

    // Axis-separated movement: try X then Z so we slide along walls.
    if (this.canStandWithRadius(nx, pz)) {
      this.group.position.x = nx;
    }
    if (this.canStandWithRadius(this.group.position.x, nz)) {
      this.group.position.z = nz;
    }
  }

  private canStandWithRadius(x: number, z: number): boolean {
    const r = PLAYER_RADIUS;
    return (
      canStandAtWorld(this.map, x, z) &&
      canStandAtWorld(this.map, x + r, z) &&
      canStandAtWorld(this.map, x - r, z) &&
      canStandAtWorld(this.map, x, z + r) &&
      canStandAtWorld(this.map, x, z - r)
    );
  }

  /** カメラ方向（前方向）の単位ベクトルを返す */
  getForwardDirection(target: THREE.Vector3): THREE.Vector3 {
    return target.copy(FORWARD).applyEuler(new THREE.Euler(0, this.group.rotation.y, 0));
  }
}
