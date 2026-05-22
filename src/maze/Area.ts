import { Rect } from './Rect';

export class Area {
  section = new Rect();
  room = new Rect();
  road: Rect | null = null;
  divideDirection: 'Horizontal' | 'Vertical' = 'Horizontal';

  setRoad(left: number, top: number, right: number, bottom: number): void {
    this.road = new Rect(left, top, right, bottom);
  }
}
