import { MAP_SIZE, MINIMAP_UPDATE_INTERVAL_MS, MINIMAP_VIEW_RANGE } from '../config/constants';
import type { MapGrid } from '../types';
import { worldToCell } from '../world/MapUtils';

export interface MinimapEntities {
  enemies: { x: number; z: number }[];
  items: { x: number; z: number }[];
}

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private explored: number[][];
  private lastUpdate = 0;
  private scale: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = MAP_SIZE * 2;
    canvas.height = MAP_SIZE * 2;
    this.scale = 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.explored = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(0));
  }

  draw(map: MapGrid, playerWorldX: number, playerWorldZ: number, ents: MinimapEntities): void {
    const now = performance.now();
    const playerX = worldToCell(playerWorldX);
    const playerZ = worldToCell(playerWorldZ);

    // 視界内を常時 explored 化
    for (
      let y = Math.max(0, playerZ - MINIMAP_VIEW_RANGE);
      y < Math.min(MAP_SIZE, playerZ + MINIMAP_VIEW_RANGE);
      y++
    ) {
      for (
        let x = Math.max(0, playerX - MINIMAP_VIEW_RANGE);
        x < Math.min(MAP_SIZE, playerX + MINIMAP_VIEW_RANGE);
        x++
      ) {
        const dx = x - playerX;
        const dz = y - playerZ;
        if (dx * dx + dz * dz <= MINIMAP_VIEW_RANGE * MINIMAP_VIEW_RANGE) {
          this.explored[x][y] = 1;
        }
      }
    }

    if (now - this.lastUpdate < MINIMAP_UPDATE_INTERVAL_MS) return;
    this.lastUpdate = now;

    const s = this.scale;
    const ctx = this.ctx;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.explored[x][y] !== 1) continue;
        const v = map[x][y];
        if (v === 1 || v === 3) ctx.fillStyle = '#555';
        else if (v === 2) ctx.fillStyle = '#4cff70';
        else ctx.fillStyle = '#aaa';
        ctx.fillRect(x * s, y * s, s, s);
      }
    }

    // enemies
    ctx.fillStyle = '#ff5050';
    for (const e of ents.enemies) {
      const ex = worldToCell(e.x);
      const ez = worldToCell(e.z);
      if (ex < 0 || ex >= MAP_SIZE || ez < 0 || ez >= MAP_SIZE) continue;
      if (!this.explored[ex][ez]) continue;
      ctx.beginPath();
      ctx.moveTo(ex * s + s / 2, ez * s - s);
      ctx.lineTo(ex * s + s + 1, ez * s + s + 1);
      ctx.lineTo(ex * s - 1, ez * s + s + 1);
      ctx.closePath();
      ctx.fill();
    }

    // items
    ctx.fillStyle = '#60c0ff';
    for (const it of ents.items) {
      const ix = worldToCell(it.x);
      const iz = worldToCell(it.z);
      if (ix < 0 || ix >= MAP_SIZE || iz < 0 || iz >= MAP_SIZE) continue;
      if (!this.explored[ix][iz]) continue;
      ctx.beginPath();
      ctx.arc(ix * s + s / 2, iz * s + s / 2, s * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // player
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playerX * s - 1, playerZ * s - 1, s + 2, s + 2);
  }
}
