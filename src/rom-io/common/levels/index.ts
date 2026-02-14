import { memoize } from 'lodash';
import { extract, read16 } from '../../buffer';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import {
  readTerrainBitplaneAndPalette,
  readTerrainTypeTile,
  TILE_SIZE,
} from './terrain';
import { EntranceInfo, LevelInfo } from './types';

export const buildLevelImageFromEntranceInfo = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
) => {
  const bitplaneAndPalette = readTerrainBitplaneAndPalette(
    romData,
    entranceInfo.terrain,
  );
  const levelTileMap = readLevelTileMap(romData, entranceInfo.level);
  return buildLevelImage(
    levelTileMap,
    memoize((tileMetaIndex) =>
      readTerrainTypeTile(
        romData,
        bitplaneAndPalette,
        entranceInfo.terrain,
        tileMetaIndex,
      ),
    ),
  );
};

const readLevelTileMap = (romData: Buffer, level: LevelInfo) => {
  const { tileMapAddress, tileMapOffset, tileMapLength, isVertical } = level;

  let levelWidth, levelHeight;
  const rawTileMap = extract(
    romData,
    tileMapAddress.pcAddress + tileMapOffset,
    tileMapLength,
  );

  if (isVertical) {
    levelWidth = 64;
    levelHeight = Math.ceil(rawTileMap.length / levelWidth / 2);
  } else {
    levelHeight = 16;
    levelWidth = Math.ceil(rawTileMap.length / levelHeight / 2);
  }

  const levelTileMap = new Matrix<number>(levelWidth, levelHeight, 0);

  let offset = 0;

  const readTile = (x: number, y: number) => {
    const tileInfo = read16(rawTileMap, offset);
    offset += 2;
    levelTileMap.set(x, y, tileInfo);
  };

  if (isVertical) {
    for (let y = 0; y < levelTileMap.height; y++) {
      for (let x = 0; x < levelTileMap.width; x++) {
        readTile(x, y);
      }
    }
  } else {
    for (let x = 0; x < levelTileMap.width; x++) {
      for (let y = 0; y < levelTileMap.height; y++) {
        readTile(x, y);
      }
    }
  }

  return levelTileMap;
};

const buildLevelImage = (
  levelTileMap: Matrix<number>,
  getTileImage: (tileMetaIndex: number) => ImageMatrix | null,
) => {
  const result = new Matrix<Color | null>(
    levelTileMap.width * TILE_SIZE,
    levelTileMap.height * TILE_SIZE,
    null,
  );

  for (let y = 0; y < levelTileMap.height; y++) {
    for (let x = 0; x < levelTileMap.width; x++) {
      const tileInfo = levelTileMap.get(x, y);

      // Flips = 1100000000000000
      const flips = (tileInfo & 0xc000) >> 14;

      // Tile Index = 0000001111111111
      const tileMetaIndex = tileInfo & 0x3ff;
      const tileImage = getTileImage(tileMetaIndex);
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
