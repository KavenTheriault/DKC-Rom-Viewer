import { extract } from '../../buffer';
import { BPP } from '../../types/bpp';
import { ImageMatrix } from '../../types/image-matrix';
import { readPalette } from '../palettes';
import { Palette } from '../palettes/types';
import { decompress } from './compression';
import { logBufferHexSimple } from './entrance-info/vram';
import { assembleImages } from './tiles/assemble';
import { BYTES_PER_TILE_META } from './tiles/constants';
import { decodeAndAssembleTiles, decodeTiles } from './tiles/decode-tiles';
import { TilesetInfo, TerrainInfo } from './types';

export const TILE_SIZE = 32;
const TILEMAP_IMAGE_TILE_PER_ROW = 16;
const PARTS_IN_TILE = 16;
const PALETTE_LENGTH = 128;

type TerrainTilesetAndPalette = {
  tileset: Uint8Array;
  palette: Palette;
};

export const readTilesetAndPalette = (
  romData: Buffer,
  terrain: TerrainInfo,
): TerrainTilesetAndPalette => {
  const tileset = buildTerrainTileset(romData, terrain.tilesetsInfo);
  const palette = readPalette(romData, terrain.palettesAddress, PALETTE_LENGTH);
  return { tileset: Uint8Array.from(tileset), palette };
};

export const readTerrainTypeTile = (
  romData: Buffer,
  tilesetAndPalette: TerrainTilesetAndPalette,
  terrain: TerrainInfo,
  tilemapIndex: number,
): ImageMatrix => {
  const tilemapOffset = tilemapIndex * BYTES_PER_TILE_META * PARTS_IN_TILE;
  return decodeAndAssembleTiles({
    tileset: tilesetAndPalette.tileset,
    tilemap: {
      data: romData,
      address: terrain.tilemapAddress,
    },
    tilemapOffsetStart: tilemapOffset,
    palette: tilesetAndPalette.palette,
    bpp: BPP.Four,
    options: {
      opaqueZero: true,
      assembleQuantity: PARTS_IN_TILE,
    },
  });
};

export const buildTerrainTileset = (
  romData: Buffer,
  tilesetInfos: TilesetInfo[],
) => {
  const result: number[] = [];

  let decompressedData: number[] | undefined = undefined;
  for (const tilesetInfo of tilesetInfos) {
    let dataToAdd: number[];

    if (tilesetInfo.isCompressed) {
      if (!decompressedData) {
        decompressedData = decompress(romData, tilesetInfo.address);
        logBufferHexSimple(decompressedData);
      }

      dataToAdd = decompressedData;
    } else {
      dataToAdd = Array.from(
        extract(romData, tilesetInfo.address.pcAddress, tilesetInfo.length),
      );
    }

    const dataLengthToAdd =
      (tilesetInfo.isCompressed ? dataToAdd.length : tilesetInfo.length) -
      tilesetInfo.offset;
    if (result.length < tilesetInfo.placeAt + dataLengthToAdd) {
      result.push(
        ...new Array(tilesetInfo.placeAt + dataLengthToAdd - result.length),
      );
    }
    result.splice(
      tilesetInfo.placeAt,
      dataLengthToAdd,
      ...dataToAdd.slice(tilesetInfo.offset, dataLengthToAdd),
    );
  }

  return result;
};

export const buildTerrainTilesetImage = (
  romData: Buffer,
  terrain: TerrainInfo,
) => {
  const tilesetAndPalette = readTilesetAndPalette(romData, terrain);

  /** Tile count is unknown, 0x280 is enough covers all terrain tiles */
  const tilesQuantity = 0x280;
  const tiles = decodeTiles({
    tileset: tilesetAndPalette.tileset,
    tilemap: {
      data: romData,
      address: terrain.tilemapAddress,
    },
    tilemapSize: { tilesQuantity },
    palette: tilesetAndPalette.palette,
    bpp: BPP.Four,
    options: {
      opaqueZero: true,
      assembleQuantity: PARTS_IN_TILE,
    },
  });
  return assembleImages(tiles, TILEMAP_IMAGE_TILE_PER_ROW);
};
