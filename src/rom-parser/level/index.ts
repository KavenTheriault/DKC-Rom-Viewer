import { decompress } from './compression';
import { RomAddress } from '../types/address';
import { Buffer } from 'buffer';
import { Palette } from '../palette/types';
import { extract, read16 } from '../utils/buffer';
import { Matrix } from '../../types/matrix';
import { Color, ImageMatrix } from '../../types/image-matrix';
import { parseTilePixels } from '../sprites/tile';
import { buildImageFromPixelsAndPalette, readPalettes } from '../palette';
import { chunk, memoize } from 'lodash';
import { EntranceInfo, GraphicInfo, loadEntranceInfo } from './addresses';

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

export const buildLevelImageByEntranceId = (
  romData: Buffer,
  entranceId: number,
) => {
  const entranceInfo = loadEntranceInfo(romData, entranceId);
  return readLevel(romData, entranceInfo);
};

const readLevel = (romData: Buffer, entranceInfo: EntranceInfo) => {
  const graphicsData = buildGraphicsData(
    romData,
    entranceInfo.terrainGraphicsInfo,
  );
  const tilePartsData = chunk(graphicsData, TILE_DATA_LENGTH);

  const palettes = readPalettes(
    romData,
    entranceInfo.terrainPalettesAddress,
    8,
    16,
  );
  const levelTileMap = readLevelTileMap(
    romData,
    entranceInfo.levelTileMapAddress,
    entranceInfo.levelTileMapLength,
  );
  return buildLevelImage(
    levelTileMap,
    memoize((tileMetaIndex) =>
      readTerrainTypeTile(
        romData,
        tilePartsData,
        entranceInfo.terrainTypeMetaAddress,
        tileMetaIndex,
        palettes,
      ),
    ),
  );
};

const buildGraphicsData = (romData: Buffer, graphicsInfo: GraphicInfo[]) => {
  const result: number[] = new Array(0xffff).fill(0);

  let decompressedData: number[] | undefined = undefined;
  for (const graphicInfo of graphicsInfo) {
    let dataToAdd: number[];

    if (graphicInfo.isCompressed) {
      if (!decompressedData)
        decompressedData = decompress(romData, graphicInfo.address);

      dataToAdd = decompressedData;
    } else {
      dataToAdd = Array.from(
        extract(romData, graphicInfo.address.pcAddress, graphicInfo.length),
      );
    }

    const dataLengthToAdd = Math.min(
      graphicInfo.length,
      dataToAdd.length - graphicInfo.offset,
    );
    result.splice(
      graphicInfo.placeAt,
      dataLengthToAdd,
      ...dataToAdd.slice(graphicInfo.offset, dataLengthToAdd),
    );
  }

  return result;
};

const readTerrainTypeTile = (
  romData: Buffer,
  tilePartsData: number[][],
  tilesMetaAddress: RomAddress,
  tileMetaIndex: number,
  palettes: Palette[],
): ImageMatrix => {
  const tileMeta = extract(
    romData,
    tilesMetaAddress.getOffsetAddress(tileMetaIndex * TILE_DATA_LENGTH)
      .pcAddress,
    TILE_DATA_LENGTH,
  );
  return buildLevelTileImage(tilePartsData, tileMeta, palettes);
};

const buildLevelTileImage = (
  tilePartsData: number[][],
  tileMeta: Buffer,
  palette: Palette[],
): ImageMatrix => {
  const tileImage = new Matrix<Color | null>(TILE_WIDTH, TILE_HEIGHT, null);

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

      // Skip tile part index outside of available data
      if (tilePartIndex >= tilePartsData.length) continue;

      const pixels = parseTilePixels(Buffer.from(tilePartsData[tilePartIndex]));
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

  return tileImage;
};

const readLevelTileMap = (
  romData: Buffer,
  tileMapAddress: RomAddress,
  levelSize: number,
) => {
  const levelHeight = HORIZONTAL_LEVEL_HEIGHT;
  const rawTileMap = extract(romData, tileMapAddress.pcAddress, levelSize);

  const levelWidth = Math.ceil(rawTileMap.length / levelHeight / 2);
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
  getTileImage: (tileMetaIndex: number) => ImageMatrix,
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
      const tileMetaIndex = tileInfo & 0x3ff;
      const tileImage = getTileImage(tileMetaIndex).clone();

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
