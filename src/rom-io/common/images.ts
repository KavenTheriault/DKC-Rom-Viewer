import { Color } from '../types/color';
import { ImageMatrix } from '../types/image-matrix';
import { Matrix } from '../types/matrix';

export const buildImageFromPixelsAndPalette = (
  pixels: Matrix<number>,
  colors: Color[],
  paletteOffset = -1,
): ImageMatrix => {
  const width: number = pixels.width;
  const height: number = pixels.height;
  const coloredPixels = new Matrix<Color | null>(width, height, null);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const paletteIdx: number = pixels.get(x, y);
      if (paletteIdx !== 0)
        coloredPixels.set(x, y, colors[paletteIdx + paletteOffset]);
    }
  }

  return coloredPixels;
};
