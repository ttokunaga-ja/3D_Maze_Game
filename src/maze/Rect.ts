export class Rect {
  constructor(
    public left = 0,
    public top = 0,
    public right = 0,
    public bottom = 0,
  ) {}

  get width(): number {
    return this.right - this.left;
  }

  get height(): number {
    return this.bottom - this.top;
  }

  get size(): number {
    return this.width * this.height;
  }

  setPoints(left: number, top: number, right: number, bottom: number): void {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }
}
