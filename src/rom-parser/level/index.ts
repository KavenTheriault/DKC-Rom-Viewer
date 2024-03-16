import { decompress } from './compression';
import { RomAddress } from '../types/address';
import { Buffer } from 'buffer';
import { Palette } from '../palette/types';
import { extract, read16 } from '../utils/buffer';
import { Matrix } from '../../types/matrix';
import { Color, ImageMatrix } from '../../types/image-matrix';
import { parseTilePixels } from '../sprites/tile';
import { buildImageFromPixelsAndPalette, readPalettes } from '../palette';
import { chunk } from 'lodash';
import { EntranceInfo, loadEntranceInfo } from './addresses';

/*
TilePart = 8x8 Image - 1/16 part of a Tile
Tile = 32x32 Image - Unit used to build a level
LevelTileMap = Tile information to build a level
 */

const TILE_DATA_LENGTH = 0x20;
const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;
const TILE_PART_WIDTH = TILE_WIDTH / 4;
const TILE_PART_HEIGHT = TILE_HEIGHT / 4;

const HORIZONTAL_LEVEL_HEIGHT = 16;

// Jungle Theme
const JUNGLE_TERRAIN_TYPE_META_SIZE = 0x24a;

// Cave Theme
const CAVE_TERRAIN_TYPE_META_SIZE = 0x1b3;

// Jungle Hijinxs
const JUNGLE_HIJINXS_ENTRANCE_ID = 0x16;

// Ropey Rampage
const ROPEY_RAMPAGE_ENTRANCE_ID = 0x0c;

// Reptile Rumble
const REPTILE_RUMBLE_ENTRANCE_ID = 0x01;

export const readJungleHijinxsLevel = (romData: Buffer) => {
  const entranceInfo = loadEntranceInfo(romData, JUNGLE_HIJINXS_ENTRANCE_ID);
  return readLevel(romData, JUNGLE_TERRAIN_TYPE_META_SIZE, entranceInfo);
};

export const readRopeyRampageLevel = (romData: Buffer) => {
  const entranceInfo = loadEntranceInfo(romData, ROPEY_RAMPAGE_ENTRANCE_ID);
  return readLevel(romData, JUNGLE_TERRAIN_TYPE_META_SIZE, entranceInfo);
};

export const readReptileRumbleLevel = (romData: Buffer) => {
  const entranceInfo = loadEntranceInfo(romData, REPTILE_RUMBLE_ENTRANCE_ID);
  return readLevel(romData, CAVE_TERRAIN_TYPE_META_SIZE, entranceInfo);
};

export const readLevel = (
  romData: Buffer,
  tilesMetaSize: number,
  entranceInfo: EntranceInfo,
) => {
  const tileImages = readTerrainTypeTiles(
    romData,
    entranceInfo.terrainTypeDataAddress,
    entranceInfo.terrainTypeMetaAddress,
    tilesMetaSize,
    entranceInfo.terrainPalettesAddress,
  );
  const tileMap = readLevelTileMap(
    romData,
    entranceInfo.levelTileMapAddress,
    entranceInfo.levelTileMapLength,
  );
  return buildLevelImage(tileMap, tileImages);
};

export const readTerrainTypeTiles = (
  romData: Buffer,
  tilesDataAddress: RomAddress,
  tilesMetaAddress: RomAddress,
  tilesMetaSize: number,
  palettesAddress: RomAddress,
): ImageMatrix[] => {
  const tilesData = decompress(romData, tilesDataAddress);
  const tilesMeta = extract(
    romData,
    tilesMetaAddress.pcAddress,
    tilesMetaSize * TILE_DATA_LENGTH,
  );
  const palettes = readPalettes(romData, palettesAddress, 8, 16);
  return buildLevelTileImages(tilesData, tilesMeta, palettes);
};

const buildLevelTileImages = (
  tilesData: number[],
  tilesMeta: Buffer,
  palette: Palette[],
): ImageMatrix[] => {
  const result = [];
  const tilePartsData = chunk(tilesData, TILE_DATA_LENGTH);

  for (let i = 0; i < tilesMeta.length; i += TILE_DATA_LENGTH) {
    const tileImage = new Matrix<Color | null>(TILE_WIDTH, TILE_HEIGHT, null);
    const tileMeta = extract(tilesMeta, i, TILE_DATA_LENGTH);

    let partIndex = 0;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const tilePartMeta = read16(tileMeta, partIndex);
        partIndex += 2;

        // Flips = 1100000000000000
        const flips = (tilePartMeta & 0xc000) >> 14;

        // Palette Index = 0001110000000000
        const paletteIndex = (tilePartMeta & 0x1c00) >> 10;

        // Tile Part Index = 0000001111111111
        const tilePartIndex = tilePartMeta & 0x3ff;

        const pixels = parseTilePixels(
          Buffer.from(tilePartsData[tilePartIndex]),
        );
        const tilePartImage = buildImageFromPixelsAndPalette(
          pixels,
          palette[paletteIndex].colors,
          0,
        );

        if ((flips & 0b01) > 0) {
          tilePartImage.flip('horizontal');
        }
        if ((flips & 0b10) > 0) {
          tilePartImage.flip('vertical');
        }

        tileImage.setMatrixAt(
          x * TILE_PART_WIDTH,
          y * TILE_PART_HEIGHT,
          tilePartImage,
        );
      }
    }

    result.push(tileImage);
  }

  return result;
};

const readLevelTileMap = (
  romData: Buffer,
  tileMapAddress: RomAddress,
  levelSize: number,
) => {
  const levelHeight = HORIZONTAL_LEVEL_HEIGHT;
  const rawTileMap = extract(romData, tileMapAddress.pcAddress, levelSize);

  const levelWidth = rawTileMap.length / levelHeight / 2;
  const levelTileMap = new Matrix<number>(levelWidth, levelHeight, 0);

  let offset = 0;
  for (let x = 0; x < levelWidth; x++) {
    for (let y = 0; y < levelHeight; y++) {
      const tileInfo = read16(rawTileMap, offset);
      offset += 2;

      levelTileMap.set(x, y, tileInfo);
    }
  }

  return levelTileMap;
};

const buildLevelImage = (
  levelTileMap: Matrix<number>,
  terrainTypeTiles: ImageMatrix[],
) => {
  const result = new Matrix<Color | null>(
    levelTileMap.width * TILE_WIDTH,
    levelTileMap.height * TILE_HEIGHT,
    null,
  );

  for (let y = 0; y < levelTileMap.height; y++) {
    for (let x = 0; x < levelTileMap.width; x++) {
      const tileInfo = levelTileMap.get(x, y);

      // Flips = 1100000000000000
      const flips = (tileInfo & 0xc000) >> 14;

      // Tile Index = 0000001111111111
      const tileIndex = tileInfo & 0x3ff;
      const tileImage = terrainTypeTiles[tileIndex].clone();

      if ((flips & 0b01) > 0) {
        tileImage.flip('horizontal');
      }
      if ((flips & 0b10) > 0) {
        tileImage.flip('vertical');
      }

      result.setMatrixAt(x * TILE_WIDTH, y * TILE_HEIGHT, tileImage);
    }
  }

  return result;
};
