import { extract } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { BPP } from '../../types/bpp';
import { Matrix } from '../../types/matrix';
import { readPalette } from '../palettes';
import { Palette } from '../palettes/types';
import { decompress } from './compression';
import { assembleImages } from './tiles/assemble';
import { BYTES_PER_TILE_META } from './tiles/constants';
import { decodeTiles } from './tiles/decode-tiles';
import { TerrainInfo, TilesetInfo } from './types';

const TILEMAP_IMAGE_TILE_PER_ROW = 16;
const PARTS_IN_TILE = 16;
const PALETTE_LENGTH = 128;

type TerrainTilesetAndPalette = {
  tileset: Uint8Array;
  palette: Palette;
};

export const readTilesetAndPalette = (
  romData: Uint8Array,
  terrain: TerrainInfo,
): TerrainTilesetAndPalette => {
  const tileset = buildTerrainTileset(romData, terrain.tilesetsInfo);
  const palette = readPalette(romData, terrain.palettesAddress, PALETTE_LENGTH);
  return { tileset, palette };
};

export const readTerrainTilemapTileBytes = (
  romData: Uint8Array,
  tilemapAddress: RomAddress,
  tilemapIndex: number,
  options: { vFlip: boolean; hFlip: boolean },
) => {
  const tileBytesMatrix = new Matrix<Uint8Array>(4, 4, new Uint8Array(0));

  let tilemapOffset = tilemapIndex * BYTES_PER_TILE_META * PARTS_IN_TILE;
  for (let y = 0; y < tileBytesMatrix.height; y++) {
    for (let x = 0; x < tileBytesMatrix.width; x++) {
      const tileBytes = Uint8Array.from(
        extract(
          romData,
          tilemapAddress.getOffsetAddress(tilemapOffset).pcAddress,
          BYTES_PER_TILE_META,
        ),
      );

      if (options.vFlip) tileBytes[1] ^= 0x80;
      if (options.hFlip) tileBytes[1] ^= 0x40;
      tileBytesMatrix.set(x, y, tileBytes);

      tilemapOffset += BYTES_PER_TILE_META;
    }
  }

  return tileBytesMatrix;
};

export const buildTerrainTileset = (
  romData: Uint8Array,
  tilesetInfos: TilesetInfo[],
) => {
  const result: number[] = [];

  let decompressedData: Uint8Array | undefined = undefined;
  for (const tilesetInfo of tilesetInfos) {
    let dataToAdd: Uint8Array;

    if (tilesetInfo.isCompressed) {
      if (!decompressedData) {
        decompressedData = decompress(romData, tilesetInfo.address);
      }

      dataToAdd = decompressedData;
    } else {
      dataToAdd = extract(
        romData,
        tilesetInfo.address.pcAddress,
        tilesetInfo.length,
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

  return Uint8Array.from(result);
};

export const buildTerrainTilesetImage = (
  romData: Uint8Array,
  terrain: TerrainInfo,
) => {
  const tilesetAndPalette = readTilesetAndPalette(romData, terrain);

  /** Tile count is unknown, 0x280 is enough covers all terrain tiles */
  const tilesQuantity = 0x280;
  const tiles = decodeTiles({
    tileset: tilesetAndPalette.tileset,
    tilemap: {
      data: romData,
      address: terrain.tilemapAddress.pcAddress,
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
