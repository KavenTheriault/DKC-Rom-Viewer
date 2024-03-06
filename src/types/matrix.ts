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

/* Combine an array of matrices into a bigger matrix
   All matrix are arrange into a grid format
   Placing them left to right and moving to the next row when full
   - All matrices must be of the same size
 */
export const combineMatrixIntoGrid = <T extends object>(
  matrices: Matrix<T | null>[],
  matricesPerRow = 16,
) => {
  const unitWidth = matrices[0].width;
  const unitHeight = matrices[0].height;
  const totalGridRows = Math.ceil(matrices.length / matricesPerRow);

  const totalHeight = totalGridRows * unitHeight;
  const totalWidth = matricesPerRow * unitWidth;
  const combinedMatrix = new Matrix<T | null>(totalWidth, totalHeight, null);

  for (let matrixIndex = 0; matrixIndex < matrices.length; matrixIndex++) {
    const currentMatrix = matrices[matrixIndex];
    const currentGridRow =
      (matrixIndex - (matrixIndex % matricesPerRow)) / matricesPerRow;

    const widthOffset = (matrixIndex % matricesPerRow) * unitWidth;
    const heightOffset = currentGridRow * unitHeight;

    for (let x = 0; x < unitHeight; x++) {
      for (let y = 0; y < unitWidth; y++) {
        const combinedX = widthOffset + x;
        const combinedY = heightOffset + y;
        combinedMatrix.set(combinedX, combinedY, currentMatrix.get(x, y));
      }
    }
  }

  return combinedMatrix;
};
