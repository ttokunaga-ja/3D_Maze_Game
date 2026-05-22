import {
  MAP_SIZE,
  MIN_ROOM_SIZE,
  MAX_ROOM_SIZE,
  MIN_SPACE_BETWEEN_ROOM_AND_ROAD,
} from '../config/constants';
import type { MapCell, MapGrid } from '../types';
import { Area } from './Area';

export interface MazeResult {
  map: MapGrid;
  areas: Area[];
  goal: { x: number; z: number };
  startArea: Area;
}

export function generateMaze(): MazeResult {
  const width = MAP_SIZE;
  const height = MAP_SIZE;
  const map: MapGrid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 1 as MapCell),
  );
  const areas: Area[] = [];

  const initFirstArea = (): void => {
    const area = new Area();
    area.section.setPoints(0, 0, width - 1, height - 1);
    areas.push(area);
  };

  const checkRectSize = (size: number): boolean => {
    const min = (MIN_ROOM_SIZE + MIN_SPACE_BETWEEN_ROOM_AND_ROAD) * 2 + 1;
    return size >= min;
  };

  const calculateDivideLine = (start: number, end: number): number => {
    const min = start + (MIN_ROOM_SIZE + MIN_SPACE_BETWEEN_ROOM_AND_ROAD);
    const max = end - (MIN_ROOM_SIZE + MIN_SPACE_BETWEEN_ROOM_AND_ROAD);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const drawBorder = (area: Area): void => {
    for (let y = area.section.top; y <= area.section.bottom; y++) {
      for (let x = area.section.left; x <= area.section.right; x++) {
        if (
          x === area.section.left ||
          x === area.section.right ||
          y === area.section.top ||
          y === area.section.bottom
        ) {
          map[x][y] = 3;
        }
      }
    }
  };

  const divideHorizontally = (area: Area): Area | null => {
    area.divideDirection = 'Horizontal';
    if (!checkRectSize(area.section.height)) {
      areas.push(area);
      return null;
    }
    const divideLine = calculateDivideLine(area.section.top, area.section.bottom);
    const child = new Area();
    child.section.setPoints(area.section.left, divideLine, area.section.right, area.section.bottom);
    area.section.bottom = divideLine;
    return child;
  };

  const divideVertically = (area: Area): Area | null => {
    area.divideDirection = 'Vertical';
    if (!checkRectSize(area.section.width)) {
      areas.push(area);
      return null;
    }
    const divideLine = calculateDivideLine(area.section.left, area.section.right);
    const child = new Area();
    child.section.setPoints(divideLine, area.section.top, area.section.right, area.section.bottom);
    area.section.right = divideLine;
    return child;
  };

  const divideArea = (horizontal: boolean): void => {
    const parent = areas.pop();
    if (!parent) return;
    const child = horizontal ? divideHorizontally(parent) : divideVertically(parent);
    if (child) {
      drawBorder(parent);
      drawBorder(child);
      if (parent.section.size > child.section.size) {
        areas.push(child);
        areas.push(parent);
      } else {
        areas.push(parent);
        areas.push(child);
      }
      divideArea(!horizontal);
    }
  };

  const adjustRoomSide = (
    minPos: number,
    maxPos: number,
    cb: (newMin: number, newMax: number) => void,
  ): void => {
    if (minPos + MIN_ROOM_SIZE < maxPos) {
      const maxRange = Math.min(minPos + MAX_ROOM_SIZE, maxPos);
      const minRange = minPos + MIN_ROOM_SIZE;
      const position = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
      const diff = Math.floor(Math.random() * (maxPos - position - 1));
      cb(minPos + diff, position + diff);
    }
  };

  const createRoomInArea = (area: Area): void => {
    let roomLeft = area.section.left + MIN_SPACE_BETWEEN_ROOM_AND_ROAD;
    let roomRight = area.section.right - MIN_SPACE_BETWEEN_ROOM_AND_ROAD + 1;
    let roomTop = area.section.top + MIN_SPACE_BETWEEN_ROOM_AND_ROAD;
    let roomBottom = area.section.bottom - MIN_SPACE_BETWEEN_ROOM_AND_ROAD + 1;

    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 1000) {
      adjustRoomSide(roomLeft, roomRight, (a, b) => {
        roomLeft = a;
        roomRight = b;
      });
      adjustRoomSide(roomTop, roomBottom, (a, b) => {
        roomTop = a;
        roomBottom = b;
      });
      const w = roomRight - roomLeft;
      const h = roomBottom - roomTop;
      if (w * h >= 10) valid = true;
      attempts++;
    }

    if (!valid) return;
    area.room.setPoints(roomLeft, roomTop, roomRight, roomBottom);
    for (let y = roomTop; y < roomBottom; y++) {
      for (let x = roomLeft; x < roomRight; x++) {
        map[x][y] = 0;
      }
    }
  };

  const createRooms = (): void => {
    for (const area of areas) createRoomInArea(area);
  };

  const createVerticalRoad = (parent: Area, child: Area, isGrandchild: boolean): void => {
    const parentRoadLeft = parent.road?.left ?? 0;
    const childRoadLeft = child.road?.left ?? 0;
    const xStart =
      isGrandchild && parent.road
        ? parentRoadLeft
        : Math.floor(Math.random() * (parent.room.right - parent.room.left) + parent.room.left);
    const xEnd =
      isGrandchild && child.road
        ? childRoadLeft
        : Math.floor(Math.random() * (child.room.right - child.room.left) + child.room.left);
    const connectY =
      parent.section.bottom === child.section.top ? child.section.top : parent.section.top;
    const roadWidth = 5;

    if (parent.section.top > child.section.top) {
      parent.setRoad(
        xStart - Math.floor(roadWidth / 2),
        connectY,
        xStart + Math.floor(roadWidth / 2) + 1,
        parent.room.top,
      );
      child.setRoad(
        xEnd - Math.floor(roadWidth / 2),
        child.room.bottom,
        xEnd + Math.floor(roadWidth / 2) + 1,
        connectY,
      );
    } else {
      parent.setRoad(
        xStart - Math.floor(roadWidth / 2),
        parent.room.bottom,
        xStart + Math.floor(roadWidth / 2) + 1,
        connectY,
      );
      child.setRoad(
        xEnd - Math.floor(roadWidth / 2),
        connectY,
        xEnd + Math.floor(roadWidth / 2) + 1,
        child.room.top,
      );
    }
    drawRoadInArea(parent);
    drawRoadInArea(child);
    drawVerticalLine(xStart, xEnd, connectY);
  };

  const createHorizontalRoad = (parent: Area, child: Area, isGrandchild: boolean): void => {
    const parentRoadTop = parent.road?.top ?? 0;
    const childRoadTop = child.road?.top ?? 0;
    const yStart =
      isGrandchild && parent.road
        ? parentRoadTop
        : Math.floor(Math.random() * (parent.room.bottom - parent.room.top) + parent.room.top);
    const yEnd =
      isGrandchild && child.road
        ? childRoadTop
        : Math.floor(Math.random() * (child.room.bottom - child.room.top) + child.room.top);
    let connectX =
      parent.section.right === child.section.left ? child.section.left : parent.section.left;
    const roadWidth = 5;

    if (parent.section.left > child.section.left) {
      parent.setRoad(
        connectX,
        yStart - Math.floor(roadWidth / 2),
        parent.room.left,
        yStart + Math.floor(roadWidth / 2) + 1,
      );
      child.setRoad(
        child.room.right,
        yEnd - Math.floor(roadWidth / 2),
        connectX,
        yEnd + Math.floor(roadWidth / 2) + 1,
      );
    } else {
      connectX = child.section.left;
      parent.setRoad(
        parent.room.right,
        yStart - Math.floor(roadWidth / 2),
        connectX,
        yStart + Math.floor(roadWidth / 2) + 1,
      );
      child.setRoad(
        connectX,
        yEnd - Math.floor(roadWidth / 2),
        child.room.left,
        yEnd + Math.floor(roadWidth / 2) + 1,
      );
    }
    drawRoadInArea(parent);
    drawRoadInArea(child);
    drawHorizontalLine(yStart, yEnd, connectX);
  };

  const drawRoadInArea = (area: Area): void => {
    if (!area.road || area.road.width === 0 || area.road.height === 0) return;
    for (let y = 0; y < area.road.height; y++) {
      for (let x = 0; x < area.road.width; x++) {
        map[x + area.road.left][y + area.road.top] = 0;
      }
    }
  };

  const drawVerticalLine = (xStart: number, xEnd: number, y: number): void => {
    for (let x = Math.min(xStart, xEnd); x <= Math.max(xStart, xEnd); x++) {
      map[x][y] = 0;
    }
  };

  const drawHorizontalLine = (yStart: number, yEnd: number, x: number): void => {
    for (let y = Math.min(yStart, yEnd); y <= Math.max(yStart, yEnd); y++) {
      map[x][y] = 0;
    }
  };

  const createRoad = (parent: Area, child: Area, isGrandchild = false): void => {
    if (
      parent.section.bottom === child.section.top ||
      parent.section.top === child.section.bottom
    ) {
      createVerticalRoad(parent, child, isGrandchild);
    } else if (
      parent.section.right === child.section.left ||
      parent.section.left === child.section.right
    ) {
      createHorizontalRoad(parent, child, isGrandchild);
    }
  };

  const connectRooms = (): void => {
    for (let i = 0; i < areas.length - 1; i++) {
      const parent = areas[i];
      const child = areas[i + 1];
      createRoad(parent, child);
      if (i < areas.length - 2) {
        const grand = areas[i + 2];
        createRoad(parent, grand, true);
      }
    }
  };

  initFirstArea();
  divideArea(Math.random() < 0.5);
  createRooms();
  connectRooms();

  let goalArea: Area;
  do {
    goalArea = areas[Math.floor(Math.random() * areas.length)];
  } while (goalArea === areas[0]);

  const goalX = Math.round((goalArea.room.left + goalArea.room.right) / 2);
  const goalZ = Math.round((goalArea.room.top + goalArea.room.bottom) / 2);
  for (let y = goalArea.room.top; y < goalArea.room.bottom; y++) {
    for (let x = goalArea.room.left; x < goalArea.room.right; x++) {
      map[x][y] = 2;
    }
  }

  return {
    map,
    areas,
    goal: { x: goalX, z: goalZ },
    startArea: areas[0],
  };
}
