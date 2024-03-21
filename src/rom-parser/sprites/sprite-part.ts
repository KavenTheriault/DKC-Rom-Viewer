import { SpriteHeader } from './header';
import { Coordinate, SmallTile, SpritePart } from './types';
import { Matrix } from '../../types/matrix';

export const buildSpriteParts = (
  spriteHeader: SpriteHeader,
  tiles: SmallTile[],
  coordinates: Coordinate[],
): SpritePart[] => {
  const largeTiles: SmallTile[] = [];
  const small1Tiles: SmallTile[] = [];
  const small2Tiles: SmallTile[] = [];

  for (let tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
    const isSmall1: boolean =
      tileIndex >= spriteHeader.offsets.small1Offset &&
      small1Tiles.length !== spriteHeader.tileQuantity.small1;
    const isSmall2: boolean =
      tileIndex >= spriteHeader.offsets.small2Offset &&
      small2Tiles.length !== spriteHeader.tileQuantity.small2;

    if (isSmall1) {
      small1Tiles.push(tiles[tileIndex]);
    } else if (isSmall2) {
      small2Tiles.push(tiles[tileIndex]);
    } else {
      largeTiles.push(tiles[tileIndex]);
    }
  }

  let coordinateIndex = 0;
  const spriteParts: SpritePart[] = [];

  const largeTilesRows: SmallTile[][] = [];
  for (let i = 0; i < largeTiles.length; i += 32) {
    const row: SmallTile[] = largeTiles.slice(i, i + 32);
    largeTilesRows.push(row);
  }

  for (let i = 0; i < spriteHeader.tileQuantity.large; i++) {
    const rowIndex: number = Math.floor(i / 8);
    const largeTilesRow: SmallTile[] = largeTilesRows[rowIndex];

    const offset1: number = i * 2 + rowIndex * 16;
    const offset2: number = largeTilesRow.length / 2 + offset1;
    const tiles: SmallTile[] = [
      largeTiles[offset1],
      largeTiles[offset1 + 1],
      largeTiles[offset2],
      largeTiles[offset2 + 1],
    ];

    spriteParts.push({
      type: '16x16',
      tile: {
        tiles: tiles,
        pixels: getLargeTilePixels(tiles),
      },
      coordinate: coordinates[coordinateIndex],
    });
    coordinateIndex++;
  }

  const smallSpriteParts: SpritePart[] = [...small1Tiles, ...small2Tiles].map(
    (tile: SmallTile) => {
      const spritePart: SpritePart = {
        type: '8x8',
        tile: tile,
        coordinate: coordinates[coordinateIndex],
      };
      coordinateIndex++;
      return spritePart;
    },
  );
  spriteParts.push(...smallSpriteParts);

  return spriteParts;
};

/* 4 8x8 tiles to 1 16x16 tile */
export const getLargeTilePixels = (tiles: SmallTile[]): Matrix<number> => {
  if (tiles.length !== 4) throw new Error('INVALID_TILE_QUANTITY');

  const pixels: Matrix<number>[] = tiles.map((t) => t.pixels);
  const largeTilePixels: Matrix<number> = new Matrix<number>(16, 16, 0);
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      if (x < 8) {
        if (y < 8) {
          largeTilePixels.set(x, y, pixels[0].get(x, y));
        } else {
          largeTilePixels.set(x, y, pixels[2].get(x, y - 8));
        }
      } else {
        if (y < 8) {
          largeTilePixels.set(x, y, pixels[1].get(x - 8, y));
        } else {
          largeTilePixels.set(x, y, pixels[3].get(x - 8, y - 8));
        }
      }
    }
  }
  return largeTilePixels;
};

export const assembleSprite = (spriteParts: SpritePart[]) => {
  const spritePixels = new Matrix<number>(256, 256, 0);

  for (const spritePart of spriteParts) {
    const partPixels = spritePart.tile.pixels;
    for (let x = 0; x < partPixels.width; x++) {
      for (let y = 0; y < partPixels.height; y++) {
        const spriteX: number = x + spritePart.coordinate.x;
        const spriteY: number = y + spritePart.coordinate.y;
        if (spriteY > 255 || spriteX > 255) throw new Error('INVALID_SPRITE');
        spritePixels.set(spriteX, spriteY, partPixels.get(x, y));
      }
    }
  }

  return spritePixels;
};
