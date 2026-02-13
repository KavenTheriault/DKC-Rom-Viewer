import { chunk, memoize } from 'lodash';
import { extract, read16 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import { buildImageFromPixelsAndPalette } from '../images';
import { readPalettes } from '../palettes';
import { Palette } from '../palettes/types';
import { parseTilePixels } from '../sprites/tile';
import { decodeBitplane } from '../stripper/decode-bitplane';
import { BPP } from '../stripper/decode-tile';
import { assembleTiles } from '../tiles';
import { decompress } from './compression';
import { EntranceInfo, GraphicInfo } from './types';

/*
TilePart = 8x8 Image - 1/16 part of a Tile
Tile = 32x32 Image - Unit used to build a level
LevelTileMap = Tile information to build a level
*/

const TILE_DATA_LENGTH = 0x20;
const TILE_SIZE = 32;
const TILE_PART_SIZE = TILE_SIZE / 4;
const TILEMAP_IMAGE_TILE_PER_ROW = 16;

export const buildLevelImageFromEntranceInfo = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
) => {
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
    entranceInfo.levelTileMapOffset,
    entranceInfo.levelTileMapLength,
    entranceInfo.isVertical,
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

export const buildTilemapImageFromEntranceInfo = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
) => {
  const graphicsData = buildGraphicsData(
    romData,
    entranceInfo.terrainGraphicsInfo,
  );

  const rawData = extract(
    romData,
    entranceInfo.terrainTypeMetaAddress.pcAddress,
    0x6000,
  );

  const tiles = decodeBitplane(
    romData,
    Uint8Array.from(graphicsData),
    rawData,
    entranceInfo.terrainPalettesAddress,
    BPP.Four,
    {
      assembleQuantity: 16,
    },
  );
  return assembleTiles(tiles, TILEMAP_IMAGE_TILE_PER_ROW);
};

const buildGraphicsData = (romData: Buffer, graphicsInfo: GraphicInfo[]) => {
  const result: number[] = [];

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

    const dataLengthToAdd =
      (graphicInfo.isCompressed ? dataToAdd.length : graphicInfo.length) -
      graphicInfo.offset;
    if (result.length < graphicInfo.placeAt + dataLengthToAdd) {
      result.push(
        ...new Array(graphicInfo.placeAt + dataLengthToAdd - result.length),
      );
    }
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
): ImageMatrix | null => {
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
  palettes: Palette[],
): ImageMatrix | null => {
  const tileImage = new Matrix<Color | null>(TILE_SIZE, TILE_SIZE, null);

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
      if (tilePartIndex >= tilePartsData.length) return null;

      const pixels = parseTilePixels(tilePartsData[tilePartIndex]);
      const tilePartImage = buildImageFromPixelsAndPalette(
        pixels,
        palettes[paletteIndex].colors,
        0,
      );

      if ((flips & 0b01) > 0) {
        tilePartImage.flip('horizontal');
      }
      if ((flips & 0b10) > 0) {
        tilePartImage.flip('vertical');
      }

      tileImage.setMatrixAt(
        x * TILE_PART_SIZE,
        y * TILE_PART_SIZE,
        tilePartImage,
      );
    }
  }

  return tileImage;
};

const readLevelTileMap = (
  romData: Buffer,
  tileMapAddress: RomAddress,
  tileMapOffset: number,
  levelSize: number,
  isVertical: boolean,
) => {
  let levelWidth, levelHeight;
  const rawTileMap = extract(
    romData,
    tileMapAddress.pcAddress + tileMapOffset,
    levelSize,
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
