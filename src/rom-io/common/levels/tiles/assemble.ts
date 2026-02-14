import { chunk } from 'lodash';
import { Color } from '../../../types/color';
import { ImageMatrix } from '../../../types/image-matrix';
import { Matrix } from '../../../types/matrix';

export const assembleTiles = (
  tiles: ImageMatrix[],
  tilesPerRow: number,
): ImageMatrix => {
  const tileSize = tiles[0].width;

  const rows = chunk(tiles, tilesPerRow);
  const tilemapImage = new Matrix<Color | null>(
    tilesPerRow * tileSize,
    rows.length * tileSize,
    null,
  );

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const tilePartImage = tiles[x + y * tilesPerRow];
      tilemapImage.setMatrixAt(x * tileSize, y * tileSize, tilePartImage);
    }
  }
  return tilemapImage;
};
