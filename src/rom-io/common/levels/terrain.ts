import { toHexString } from '../../../website/utils/hex';
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
import { GraphicInfo, TerrainInfo } from './types';

export const TILE_SIZE = 32;
const TILEMAP_IMAGE_TILE_PER_ROW = 16;
const PARTS_IN_TILE = 16;
const PALETTE_LENGTH = 128;

type TerrainBitplaneAndPalette = {
  bitplane: Uint8Array;
  palette: Palette;
};

export const readTerrainBitplaneAndPalette = (
  romData: Buffer,
  terrain: TerrainInfo,
): TerrainBitplaneAndPalette => {
  const bitplane = buildTerrainBitplane(romData, terrain.graphicsInfo);
  const palette = readPalette(romData, terrain.palettesAddress, PALETTE_LENGTH);
  return { bitplane: Uint8Array.from(bitplane), palette };
};

export const readTerrainTypeTile = (
  romData: Buffer,
  bitplaneAndPalette: TerrainBitplaneAndPalette,
  terrain: TerrainInfo,
  tileMetaIndex: number,
): ImageMatrix => {
  const tileMetaOffset = tileMetaIndex * BYTES_PER_TILE_META * PARTS_IN_TILE;
  return decodeAndAssembleTiles({
    romData,
    bitplane: bitplaneAndPalette.bitplane,
    palette: bitplaneAndPalette.palette,
    tilesMetaAddress: terrain.metaAddress,
    tileMetaOffset,
    bpp: BPP.Four,
    options: {
      opaqueZero: true,
      assembleQuantity: PARTS_IN_TILE,
    },
  });
};

export const buildTerrainBitplane = (
  romData: Buffer,
  graphicsInfo: GraphicInfo[],
) => {
  const result: number[] = [];

  let decompressedData: number[] | undefined = undefined;
  for (const graphicInfo of graphicsInfo) {
    let dataToAdd: number[];

    if (graphicInfo.isCompressed) {
      if (!decompressedData) {
        console.log(
          `Decompress2: $${toHexString(graphicInfo.address.snesAddress)}`,
        );
        decompressedData = decompress(romData, graphicInfo.address);
        logBufferHexSimple(decompressedData);
      }

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

export const buildTerrainTilemapImage = (
  romData: Buffer,
  terrain: TerrainInfo,
) => {
  const bitplaneAndPalette = readTerrainBitplaneAndPalette(romData, terrain);

  /** Tile count is unknown, 0x280 is enough covers all terrain tiles */
  const tilesQuantity = 0x280;
  const tiles = decodeTiles({
    romData,
    bitplane: bitplaneAndPalette.bitplane,
    palette: bitplaneAndPalette.palette,
    tilesMetaAddress: terrain.metaAddress,
    tilesMetaLength: { tilesQuantity },
    bpp: BPP.Four,
    options: {
      opaqueZero: true,
      assembleQuantity: PARTS_IN_TILE,
    },
  });
  return assembleImages(tiles, TILEMAP_IMAGE_TILE_PER_ROW);
};
