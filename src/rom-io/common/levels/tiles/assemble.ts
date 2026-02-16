import { chunk } from 'lodash';
import { Color } from '../../../types/color';
import { ImageMatrix } from '../../../types/image-matrix';
import { Matrix } from '../../../types/matrix';

export const assembleImages = (
  images: ImageMatrix[],
  imagesPerRow: number,
): ImageMatrix => {
  const tileSize = images[0].width;

  const rows = chunk(images, imagesPerRow);
  const result = new Matrix<Color | null>(
    imagesPerRow * tileSize,
    rows.length * tileSize,
    null,
  );

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const tilePartImage = images[x + y * imagesPerRow];
      result.setMatrixAt(x * tileSize, y * tileSize, tilePartImage);
    }
  }
  return result;
};
