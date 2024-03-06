export class Matrix<T> {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _data: T[][];

  constructor(width: number, height: number, fill: T) {
    this._width = width;
    this._height = height;
    this._data = new Array(width)
      .fill(fill)
      .map(() => new Array(height).fill(fill));
  }

  get width() {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get(x: number, y: number) {
    return this._data[x][y];
  }

  set(x: number, y: number, val: T) {
    this._data[x][y] = val;
  }

  flip(mode: 'horizontal' | 'vertical') {
    if (mode === 'horizontal') {
      this._data.reverse();
    } else {
      this._data.map((c) => c.reverse());
    }
  }
}
