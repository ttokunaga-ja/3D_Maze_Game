import * as THREE from 'three';
import {
  ATTACK_RANGE,
  BLOCK_DAMAGE,
  BREAK_RANGE,
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_LOOK_AHEAD,
  ENEMY_DAMAGE,
  ENEMY_DAMAGE_INTERVAL_MS,
  ENEMY_MOVE_SPEED,
  ENEMY_ROTATE_SPEED,
  ENEMY_STOP_DISTANCE,
  ENEMY_VIEW_RANGE,
  HEAL_AMOUNT,
  INITIAL_HP,
  ITEM_PICKUP_RADIUS,
  MAP_SIZE,
  MAX_HP,
  PLAYER_DAMAGE,
  PLAYER_EYE_Y,
  TIME_BONUS_SECONDS,
  TIME_LIMIT_SECONDS,
  WALL_BREAKER_CHARGES_PER_PICKUP,
} from './config/constants';
import { InputState } from './controls/InputState';
import { PlayerController } from './controls/PlayerController';
import { animateLegs, createRobot, type Robot } from './entities/Robot';
import { createEnemy, setEnemyState, updateHpBar, type Enemy } from './entities/Enemy';
import { createItem, updateItemAnimation, type ItemEntity } from './entities/Item';
import { generateMaze, type MazeResult } from './maze/MazeGenerator';
import { buildMazeMeshes, type MazeMeshHandle } from './scene/MazeMeshBuilder';
import { setupLights } from './scene/Lighting';
import { createSceneContext, type SceneContext } from './scene/Renderer';
import type { GameResult, Inventory, ItemKind } from './types';
import { HUD } from './ui/HUD';
import { Minimap } from './ui/Minimap';
import {
  canStandAtWorld,
  cellToWorld,
  hasWallBetween,
  isWall,
  worldToCell,
} from './world/MapUtils';

const ITEM_SPAWN_TABLE: { kind: ItemKind; count: number }[] = [
  { kind: 'wallBreaker', count: 5 },
  { kind: 'healPotion', count: 3 },
  { kind: 'timeBonus', count: 2 },
];
const ENEMY_COUNT = 5;

const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();

export class Game {
  private ctx: SceneContext;
  private hud: HUD;
  private minimap: Minimap;
  private input: InputState;
  private clock = new THREE.Clock();

  private maze!: MazeResult;
  private mazeMesh!: MazeMeshHandle;
  private robot!: Robot;
  private controller!: PlayerController;

  private items: ItemEntity[] = [];
  private enemies: Enemy[] = [];

  private inventory: Inventory = { wallBreaker: 0 };
  private hp = INITIAL_HP;
  private timeRemaining = TIME_LIMIT_SECONDS;
  private finished = false;

  private lastTimerTick = 0;

  constructor(
    canvas: HTMLCanvasElement,
    hudRoot: HTMLElement,
    minimapCanvas: HTMLCanvasElement,
    mobileActionButton: HTMLElement,
  ) {
    this.ctx = createSceneContext(canvas);
    setupLights(this.ctx.scene);
    this.hud = new HUD(hudRoot);
    this.minimap = new Minimap(minimapCanvas);
    this.input = new InputState();

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.input.triggerAction();
    });
    mobileActionButton.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.input.triggerAction();
    });
  }

  start(): void {
    this.spawnMaze();
    this.spawnRobot();
    this.spawnEntities();
    this.placeCameraBehindRobot(0);
    this.lastTimerTick = performance.now();
    this.tick();
  }

  private spawnMaze(): void {
    this.maze = generateMaze();
    this.mazeMesh = buildMazeMeshes(this.ctx.scene, this.maze.map);
  }

  private spawnRobot(): void {
    this.robot = createRobot();
    const start = this.maze.startArea.room;
    const spawn =
      this.findFloorCellIn(start.left, start.top, start.right, start.bottom) ??
      this.findAnyFloorCell();
    this.robot.group.position.set(cellToWorld(spawn.x), PLAYER_EYE_Y, cellToWorld(spawn.z));
    this.robot.group.rotation.y = 0;
    this.ctx.scene.add(this.robot.group);

    this.controller = new PlayerController({
      group: this.robot.group,
      input: this.input,
      map: this.maze.map,
    });
  }

  private findFloorCellIn(
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): { x: number; z: number } | null {
    const cx = Math.floor((left + right) / 2);
    const cz = Math.floor((top + bottom) / 2);
    if (cx >= 0 && cx < MAP_SIZE && cz >= 0 && cz < MAP_SIZE && this.maze.map[cx][cz] === 0) {
      return { x: cx, z: cz };
    }
    for (let z = top; z < bottom; z++) {
      for (let x = left; x < right; x++) {
        if (x < 0 || x >= MAP_SIZE || z < 0 || z >= MAP_SIZE) continue;
        if (this.maze.map[x][z] === 0) return { x, z };
      }
    }
    return null;
  }

  private findAnyFloorCell(): { x: number; z: number } {
    for (let z = 0; z < MAP_SIZE; z++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.maze.map[x][z] === 0) return { x, z };
      }
    }
    return { x: 0, z: 0 };
  }

  private spawnEntities(): void {
    const occupied = new Set<string>();
    const startKey = `${Math.round((this.maze.startArea.room.left + this.maze.startArea.room.right) / 2)},${Math.round(
      (this.maze.startArea.room.top + this.maze.startArea.room.bottom) / 2,
    )}`;
    occupied.add(startKey);

    const isValidCell = (x: number, z: number): boolean => {
      if (x < 0 || x >= MAP_SIZE || z < 0 || z >= MAP_SIZE) return false;
      if (this.maze.map[x][z] !== 0) return false;
      if (occupied.has(`${x},${z}`)) return false;
      const inStart =
        x >= this.maze.startArea.room.left &&
        x < this.maze.startArea.room.right &&
        z >= this.maze.startArea.room.top &&
        z < this.maze.startArea.room.bottom;
      const gx = this.maze.goal.x;
      const gz = this.maze.goal.z;
      const inGoal = x >= gx - 3 && x < gx + 3 && z >= gz - 3 && z < gz + 3;
      return !inStart && !inGoal;
    };

    const pickCell = (): { x: number; z: number } | null => {
      for (let attempts = 0; attempts < 1000; attempts++) {
        const x = Math.floor(Math.random() * MAP_SIZE);
        const z = Math.floor(Math.random() * MAP_SIZE);
        if (isValidCell(x, z)) return { x, z };
      }
      return null;
    };

    for (const { kind, count } of ITEM_SPAWN_TABLE) {
      for (let i = 0; i < count; i++) {
        const cell = pickCell();
        if (!cell) break;
        occupied.add(`${cell.x},${cell.z}`);
        const pos = new THREE.Vector3(cellToWorld(cell.x), 0, cellToWorld(cell.z));
        const item = createItem(kind, pos);
        this.ctx.scene.add(item.group);
        this.items.push(item);
      }
    }

    for (let i = 0; i < ENEMY_COUNT; i++) {
      const cell = pickCell();
      if (!cell) break;
      occupied.add(`${cell.x},${cell.z}`);
      const pos = new THREE.Vector3(cellToWorld(cell.x), 0, cellToWorld(cell.z));
      const enemy = createEnemy(pos);
      this.ctx.scene.add(enemy.group);
      this.enemies.push(enemy);
    }
  }

  private tick = (): void => {
    if (this.finished) return;
    requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.elapsedTime;

    this.controller.update(dt);
    animateLegs(this.robot, this.controller.isMoving, elapsed);
    this.updateTimer();
    this.updateEnemies(dt);
    this.checkItemPickups();
    this.handleAction();
    this.checkGoal();
    this.placeCameraBehindRobot(dt);

    for (const it of this.items) updateItemAnimation(it, elapsed);

    this.hud.update(this.hp, this.timeRemaining, this.inventory);
    this.minimap.draw(this.maze.map, this.robot.group.position.x, this.robot.group.position.z, {
      enemies: this.enemies.map((e) => ({ x: e.group.position.x, z: e.group.position.z })),
      items: this.items.map((i) => ({ x: i.group.position.x, z: i.group.position.z })),
    });

    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  };

  private updateTimer(): void {
    const now = performance.now();
    const elapsedSec = (now - this.lastTimerTick) / 1000;
    this.timeRemaining -= elapsedSec;
    this.lastTimerTick = now;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame('timeup');
    }
  }

  private placeCameraBehindRobot(_dt: number): void {
    const back = tmpVec.set(0, 0, 1).applyEuler(new THREE.Euler(0, this.robot.group.rotation.y, 0));
    const desired = tmpVec2
      .copy(this.robot.group.position)
      .add(back.multiplyScalar(CAMERA_DISTANCE));
    desired.y = this.robot.group.position.y + CAMERA_HEIGHT;
    this.ctx.camera.position.lerp(desired, 0.25);
    const lookAt = this.robot.group.position
      .clone()
      .add(
        this.controller.getForwardDirection(new THREE.Vector3()).multiplyScalar(CAMERA_LOOK_AHEAD),
      );
    lookAt.y = this.robot.group.position.y + CAMERA_HEIGHT * 0.35;
    this.ctx.camera.lookAt(lookAt);
  }

  private updateEnemies(dt: number): void {
    const player = this.robot.group.position;
    const now = performance.now();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const ep = enemy.group.position;
      const dist = ep.distanceTo(player);
      const inView = dist <= ENEMY_VIEW_RANGE;
      const lineOfSight = !hasWallBetween(this.maze.map, ep.x, ep.z, player.x, player.z);
      const visible = inView && lineOfSight;

      // Hide the enemy entirely when a wall is between it and the player so its
      // silhouette and HP bar cannot leak through walls.
      enemy.group.visible = lineOfSight;

      if (visible) {
        enemy.lastSeenPlayerPosition = player.clone();
        setEnemyState(enemy, 'chasing');
      } else if (enemy.state === 'chasing' && dist > ENEMY_VIEW_RANGE * 1.4) {
        setEnemyState(enemy, 'idle');
        enemy.lastSeenPlayerPosition = null;
      }

      const target = visible ? player : enemy.lastSeenPlayerPosition;
      if (target) {
        const dir = tmpVec.subVectors(target, ep);
        dir.y = 0;
        const dirLen = dir.length();
        if (dirLen > ENEMY_STOP_DISTANCE) {
          dir.divideScalar(dirLen);
          const step = Math.min(ENEMY_MOVE_SPEED * dt, dirLen - ENEMY_STOP_DISTANCE);
          const nx = ep.x + dir.x * step;
          const nz = ep.z + dir.z * step;
          if (canStandAtWorld(this.maze.map, nx, nz)) {
            ep.x = nx;
            ep.z = nz;
          }
          this.faceTowards(enemy.group, dir.x, dir.z, dt);
        }

        if (visible && dist <= ENEMY_STOP_DISTANCE * 1.5) {
          if (now - enemy.lastAttackTime >= ENEMY_DAMAGE_INTERVAL_MS) {
            enemy.lastAttackTime = now;
            this.takeDamage(ENEMY_DAMAGE);
          }
        }
      }

      // HP bar faces camera and is updated.
      enemy.hpBar.quaternion.copy(this.ctx.camera.quaternion);

      if (enemy.hp <= 0) {
        this.ctx.scene.remove(enemy.group);
        this.enemies.splice(i, 1);
      }
    }
  }

  private faceTowards(group: THREE.Object3D, dx: number, dz: number, dt: number): void {
    const target = Math.atan2(-dx, -dz);
    let diff = target - group.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const max = ENEMY_ROTATE_SPEED * dt;
    if (Math.abs(diff) < max) group.rotation.y = target;
    else group.rotation.y += Math.sign(diff) * max;
  }

  private checkItemPickups(): void {
    const player = this.robot.group.position;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const ip = item.group.position;
      const dx = ip.x - player.x;
      const dz = ip.z - player.z;
      if (dx * dx + dz * dz > ITEM_PICKUP_RADIUS * ITEM_PICKUP_RADIUS) continue;

      // 即時効果アイテムは満タンなら拾わない
      if (item.kind === 'healPotion' && this.hp >= MAX_HP) continue;

      this.applyPickup(item.kind);
      this.ctx.scene.remove(item.group);
      this.items.splice(i, 1);
    }
  }

  private applyPickup(kind: ItemKind): void {
    switch (kind) {
      case 'wallBreaker':
        this.inventory.wallBreaker += WALL_BREAKER_CHARGES_PER_PICKUP;
        this.hud.pushToast(`🔨 +${WALL_BREAKER_CHARGES_PER_PICKUP}`, '#ffc488');
        break;
      case 'healPotion':
        this.hp = Math.min(MAX_HP, this.hp + HEAL_AMOUNT);
        this.hud.pushToast(`❤ +${HEAL_AMOUNT} HP`, '#ff86a0');
        break;
      case 'timeBonus':
        this.timeRemaining += TIME_BONUS_SECONDS;
        this.hud.pushToast(`⏱ +${TIME_BONUS_SECONDS}s`, '#86c8ff');
        break;
    }
  }

  private handleAction(): void {
    if (!this.input.consumeAction()) return;

    const enemy = this.findEnemyInFront();
    if (enemy) {
      enemy.hp -= PLAYER_DAMAGE;
      updateHpBar(enemy.hpBar, Math.max(0, enemy.hp / enemy.maxHp));
      this.hud.flash('rgba(255, 200, 80, 0.18)');
      return;
    }

    const wallCell = this.findWallInFront();
    if (wallCell) {
      if (this.inventory.wallBreaker > 0) {
        const key = `${wallCell.x},${wallCell.z}`;
        const hp = (this.mazeMesh.wallHP.get(key) ?? 0) - BLOCK_DAMAGE;
        if (hp <= 0) {
          this.maze.map[wallCell.x][wallCell.z] = 0;
          this.mazeMesh.breakWall(wallCell.x, wallCell.z);
          this.controller.setMap(this.maze.map);
        } else {
          this.mazeMesh.wallHP.set(key, hp);
        }
        this.inventory.wallBreaker -= 1;
        this.hud.flash('rgba(160, 220, 255, 0.18)');
      } else {
        this.hud.pushToast('🔨 必要', '#ffb0b0', 900);
        this.hud.flash('rgba(255, 80, 80, 0.18)');
      }
      return;
    }

    this.hud.flash('rgba(180, 180, 180, 0.12)');
  }

  private findEnemyInFront(): Enemy | null {
    const player = this.robot.group.position;
    const forward = this.controller.getForwardDirection(tmpVec);
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      const dx = e.group.position.x - player.x;
      const dz = e.group.position.z - player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > ATTACK_RANGE) continue;
      const nx = dx / (dist || 1);
      const nz = dz / (dist || 1);
      const dot = forward.x * nx + forward.z * nz;
      if (dot < 0.3) continue; // 視界外
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }

  private findWallInFront(): { x: number; z: number } | null {
    const player = this.robot.group.position;
    const forward = this.controller.getForwardDirection(tmpVec);
    const steps = 6;
    const stepLen = BREAK_RANGE / steps;
    for (let i = 1; i <= steps; i++) {
      const wx = player.x + forward.x * stepLen * i;
      const wz = player.z + forward.z * stepLen * i;
      const cx = worldToCell(wx);
      const cz = worldToCell(wz);
      if (isWall(this.maze.map, cx, cz)) {
        return { x: cx, z: cz };
      }
    }
    return null;
  }

  private takeDamage(amount: number): void {
    this.hp -= amount;
    this.hud.flash('rgba(255, 60, 60, 0.25)');
    if (this.hp <= 0) {
      this.hp = 0;
      this.endGame('lose');
    }
  }

  private checkGoal(): void {
    const p = this.robot.group.position;
    const cx = worldToCell(p.x);
    const cz = worldToCell(p.z);
    if (cx < 0 || cx >= MAP_SIZE || cz < 0 || cz >= MAP_SIZE) return;
    if (this.maze.map[cx][cz] === 2) {
      this.endGame('win');
    }
  }

  private endGame(result: GameResult): void {
    if (this.finished) return;
    this.finished = true;
    setTimeout(() => {
      const msg =
        result === 'win' ? 'Game Clear!' : result === 'lose' ? 'Game Over...' : 'Time Up!';
      window.alert(msg);
      window.location.reload();
    }, 50);
  }
}
