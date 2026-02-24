import { extract, read16 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { BPP } from '../../types/bpp';
import { Matrix } from '../../types/matrix';
import { readTerrainTilemapTileBytes, readTilesetAndPalette } from './terrain';
import { assembleImages } from './tiles/assemble';
import { decodeTiles } from './tiles/decode-tiles';
import { EntranceInfo, LevelInfo } from './types';

export const buildLevelImageFromEntranceInfo = (
  romData: Uint8Array,
  entranceInfo: EntranceInfo,
) => {
  const tilesetAndPalette = readTilesetAndPalette(
    romData,
    entranceInfo.terrain,
  );
  const levelTilemap = readLevelTilemap(
    romData,
    entranceInfo.terrain.levelsTilemapAddress,
    entranceInfo.level,
  );
  const terrainTilemap = buildTerrainTilemapFromLevelTilemap(
    romData,
    levelTilemap,
    entranceInfo.terrain.tilemapAddress,
  );

  const tiles = decodeTiles({
    tileset: tilesetAndPalette.tileset,
    tilemap: {
      data: terrainTilemap.bytes,
      address: 0,
    },
    tilemapSize: { dataLength: terrainTilemap.bytes.length },
    palette: tilesetAndPalette.palette,
    bpp: BPP.Four,
    options: {
      opaqueZero: true,
    },
  });

  return assembleImages(tiles, terrainTilemap.width);
};

export const readLevelTilemap = (
  romData: Uint8Array,
  tilemapAddress: RomAddress,
  level: LevelInfo,
) => {
  const { tilemapOffset, tilemapLength, isVertical } = level;

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

export const buildTerrainTilemapFromLevelTilemap = (
  romData: Uint8Array,
  levelTilemap: Matrix<number>,
  terrainTilemapAddress: RomAddress,
): { bytes: Uint8Array; width: number; height: number } => {
  const terrainTilemap = new Matrix<Uint8Array>(
    levelTilemap.width * 4,
    levelTilemap.height * 4,
    new Uint8Array(0),
  );
  for (let x = 0; x < levelTilemap.width; x++) {
    for (let y = 0; y < levelTilemap.height; y++) {
      const tileInfo = levelTilemap.get(x, y);

      // Flips = 11000000 00000000
      const flips = (tileInfo & 0xc000) >> 14;
      const hFlip = (flips & 0b01) > 0;
      const vFlip = (flips & 0b10) > 0;

      // Tileset Index = 00000011 11111111
      const tilesetIndex = tileInfo & 0x3ff;

      const tileBytesMatrix = readTerrainTilemapTileBytes(
        romData,
        terrainTilemapAddress,
        tilesetIndex,
        { hFlip, vFlip },
      );
      if (hFlip) tileBytesMatrix.flip('horizontal');
      if (vFlip) tileBytesMatrix.flip('vertical');

      terrainTilemap.setMatrixAt(
        x * tileBytesMatrix.width,
        y * tileBytesMatrix.height,
        tileBytesMatrix,
      );
    }
  }

  const bytes = [];
  for (let y = 0; y < terrainTilemap.height; y++) {
    for (let x = 0; x < terrainTilemap.width; x++) {
      bytes.push(...terrainTilemap.get(x, y));
    }
  }

  return {
    bytes: Uint8Array.from(bytes),
    width: terrainTilemap.width,
    height: terrainTilemap.height,
  };
};
