import { memoize } from 'lodash';
import { extract, read16 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import { readPalette } from '../palettes';
import { Palette } from '../palettes/types';
import { decodeAndAssembleTiles, decodeTiles } from '../stripper/decode-tiles';
import { BPP } from '../stripper/decode-tile';
import { assembleTiles } from '../tiles';
import { decompress } from './compression';
import { EntranceInfo, GraphicInfo } from './types';

const TILE_SIZE = 32;
const TILEMAP_IMAGE_TILE_PER_ROW = 16;
const BYTES_PER_TILE_META = 2;
const PARTS_IN_TILE = 16;

export const buildLevelImageFromEntranceInfo = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
) => {
  const bitplaneData = buildGraphicsData(
    romData,
    entranceInfo.terrainGraphicsInfo,
  );
  const palette = readPalette(
    romData,
    entranceInfo.terrainPalettesAddress,
    128,
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
        bitplaneData,
        entranceInfo.terrainTypeMetaAddress,
        tileMetaIndex,
        palette,
      ),
    ),
  );
};

export const buildTilemapImageFromEntranceInfo = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
) => {
  const bitplaneData = buildGraphicsData(
    romData,
    entranceInfo.terrainGraphicsInfo,
  );
  const palette = readPalette(
    romData,
    entranceInfo.terrainPalettesAddress,
    128,
  );

  /** Tile count is unknown, 0x280 is enough covers all terrain tiles */
  const tilesQuantity = 0x280;
  const tiles = decodeTiles({
    romData,
    bitplaneData: Uint8Array.from(bitplaneData),
    palette,
    tilesMetaAddress: entranceInfo.terrainTypeMetaAddress,
    tilesMetaLength: { tilesQuantity },
    bpp: BPP.Four,
    options: {
      opaqueZero: true,
      assembleQuantity: PARTS_IN_TILE,
    },
  });
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
  bitplaneData: number[],
  tilesMetaAddress: RomAddress,
  tileMetaIndex: number,
  palette: Palette,
): ImageMatrix => {
  const tileMetaOffset = tileMetaIndex * BYTES_PER_TILE_META * PARTS_IN_TILE;
  return decodeAndAssembleTiles({
    romData,
    bitplaneData: Uint8Array.from(bitplaneData),
    palette,
    tilesMetaAddress,
    tileMetaOffset,
    bpp: BPP.Four,
    options: { opaqueZero: true, assembleQuantity: PARTS_IN_TILE },
  });
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
