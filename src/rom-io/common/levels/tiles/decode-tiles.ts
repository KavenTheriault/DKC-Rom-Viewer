import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { Color } from '../../../types/color';
import { ImageMatrix } from '../../../types/image-matrix';
import { Matrix } from '../../../types/matrix';
import { Palette } from '../../palettes/types';
import { BYTES_PER_TILE_META } from './constants';
import { decodeTile, DecodeTileOptions } from './decode-tile';

interface DecodeTilesOptions extends DecodeTileOptions {
  assembleQuantity?: number;
}

interface BaseDecodeTilesParams {
  tileset: Uint8Array;
  tilemap: {
    data: Buffer;
    address: RomAddress;
  };
  palette: Palette;
  bpp: BPP;
  options?: DecodeTilesOptions;
}

interface DecodeTilesParams extends BaseDecodeTilesParams {
  tilemapSize: { dataLength: number } | { tilesQuantity: number };
}

interface DecodeAndAssembleTilesParams extends BaseDecodeTilesParams {
  tilemapOffsetStart: number;
}

export const decodeTiles = ({
  tileset,
  tilemap,
  tilemapSize,
  palette,
  bpp,
  options,
}: DecodeTilesParams): ImageMatrix[] => {
  const tiles = [];
  const assembleQuantity = options?.assembleQuantity ?? 1;
  const tilesQuantity =
    'dataLength' in tilemapSize
      ? Math.floor(
          tilemapSize.dataLength / (assembleQuantity * BYTES_PER_TILE_META),
        )
      : tilemapSize.tilesQuantity;

  let tilemapOffset = 0;
  for (let tileIndex = 0; tileIndex < tilesQuantity; tileIndex++) {
    const tileImage = decodeAndAssembleTiles({
      tileset,
      tilemap,
      palette,
      tilemapOffsetStart: tilemapOffset,
      bpp,
      options,
    });
    tilemapOffset += BYTES_PER_TILE_META * assembleQuantity;
    tiles.push(tileImage);
  }
  return tiles;
};

export const decodeAndAssembleTiles = ({
  tileset,
  tilemap,
  tilemapOffsetStart,
  palette,
  bpp,
  options,
}: DecodeAndAssembleTilesParams): ImageMatrix => {
  const assembleQuantity = options?.assembleQuantity ?? 1;
  const tilesPerAxis = Math.sqrt(assembleQuantity);
  const size = tilesPerAxis * 8;

  let offset = tilemapOffsetStart;
  const tileImage = new Matrix<Color | null>(size, size, null);

  for (let y = 0; y < tilesPerAxis; y++) {
    for (let x = 0; x < tilesPerAxis; x++) {
      const tile = decodeTile({
        tileset,
        tilemap: {
          data: tilemap.data,
          address: tilemap.address,
          offset: offset,
        },
        palette,
        bpp,
        options,
      });
      tileImage.setMatrixAt(x * tile.width, y * tile.height, tile);
      offset += BYTES_PER_TILE_META;
    }
  }

  return tileImage;
};
