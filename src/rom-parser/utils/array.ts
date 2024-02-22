export const create2DArray = (width: number, height: number): number[][] =>
    new Array(width).fill(0).map(() => new Array(height).fill(0));
