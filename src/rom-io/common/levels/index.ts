import { memoize } from 'lodash';
import { extract, read16 } from '../../buffer';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import {
  readTilesetAndPalette,
  readTerrainTypeTile,
  TILE_SIZE,
} from './terrain';
import { EntranceInfo, LevelInfo } from './types';

export const buildLevelImageFromEntranceInfo = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
) => {
  const tilesetAndPalette = readTilesetAndPalette(
    romData,
    entranceInfo.terrain,
  );
  const levelTilemap = readLevelTilemap(romData, entranceInfo.level);
  return buildLevelImage(
    levelTilemap,
    memoize((tilesetIndex) =>
      readTerrainTypeTile(
        romData,
        tilesetAndPalette,
        entranceInfo.terrain,
        tilesetIndex,
      ),
    ),
  );
};

const readLevelTilemap = (romData: Buffer, level: LevelInfo) => {
  const { tilemapAddress, tilemapOffset, tilemapLength, isVertical } = level;

  let levelWidth, levelHeight;
  const rawTilemap = extract(
    romData,
    tilemapAddress.pcAddress + tilemapOffset,
    tilemapLength,
  );

  if (isVertical) {
    levelWidth = 64;
    levelHeight = Math.ceil(rawTilemap.length / levelWidth / 2);
  } else {
    levelHeight = 16;
    levelWidth = Math.ceil(rawTilemap.length / levelHeight / 2);
  }

  const levelTilemap = new Matrix<number>(levelWidth, levelHeight, 0);

  let offset = 0;

  const readTile = (x: number, y: number) => {
    const tileInfo = read16(rawTilemap, offset);
    offset += 2;
    levelTilemap.set(x, y, tileInfo);
  };

  if (isVertical) {
    for (let y = 0; y < levelTilemap.height; y++) {
      for (let x = 0; x < levelTilemap.width; x++) {
        readTile(x, y);
      }
    }
  } else {
    for (let x = 0; x < levelTilemap.width; x++) {
      for (let y = 0; y < levelTilemap.height; y++) {
        readTile(x, y);
      }
    }
  }

  return levelTilemap;
};

const buildLevelImage = (
  levelTilemap: Matrix<number>,
  getTileImage: (tilesetIndex: number) => ImageMatrix | null,
) => {
  const result = new Matrix<Color | null>(
    levelTilemap.width * TILE_SIZE,
    levelTilemap.height * TILE_SIZE,
    null,
  );

  for (let y = 0; y < levelTilemap.height; y++) {
    for (let x = 0; x < levelTilemap.width; x++) {
      const tileInfo = levelTilemap.get(x, y);

      // Flips = 11000000 00000000
      const flips = (tileInfo & 0xc000) >> 14;

      // Tileset Index = 00000011 11111111
      const tilesetIndex = tileInfo & 0x3ff;
      const tileImage = getTileImage(tilesetIndex);
      if (!tileImage) continue;

      const tileClone = tileImage.clone();
      if ((flips & 0b01) > 0) {
        tileClone.flip('horizontal');
      }
      if ((flips & 0b10) > 0) {
        tileClone.flip('vertical');
      }
      result.setMatrixAt(x * TILE_SIZE, y * TILE_SIZE, tileClone);
    }
  }

  return result;
};
