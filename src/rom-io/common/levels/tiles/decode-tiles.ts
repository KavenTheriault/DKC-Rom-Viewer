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
  romData: Buffer;
  bitplane: Uint8Array;
  palette: Palette;
  tilesMetaAddress: RomAddress;
  bpp: BPP;
  options?: DecodeTilesOptions;
}

interface DecodeTilesParams extends BaseDecodeTilesParams {
  tilesMetaLength: { dataLength: number } | { tilesQuantity: number };
}

interface DecodeAndAssembleTilesParams extends BaseDecodeTilesParams {
  tileMetaOffset: number;
}

export const decodeTiles = ({
  romData,
  bitplane,
  palette,
  tilesMetaAddress,
  tilesMetaLength,
  bpp,
  options,
}: DecodeTilesParams): ImageMatrix[] => {
  const tiles = [];
  const assembleQuantity = options?.assembleQuantity ?? 1;
  const tilesQuantity =
    'dataLength' in tilesMetaLength
      ? Math.floor(
          tilesMetaLength.dataLength / (assembleQuantity * BYTES_PER_TILE_META),
        )
      : tilesMetaLength.tilesQuantity;

  let tileMetaOffset = 0;
  for (let tileIndex = 0; tileIndex < tilesQuantity; tileIndex++) {
    const tileImage = decodeAndAssembleTiles({
      romData,
      bitplane,
      palette,
      tilesMetaAddress,
      tileMetaOffset,
      bpp,
      options,
    });
    tileMetaOffset += BYTES_PER_TILE_META * assembleQuantity;
    tiles.push(tileImage);
  }
  return tiles;
};

export const decodeAndAssembleTiles = ({
  romData,
  bitplane,
  palette,
  tilesMetaAddress,
  tileMetaOffset,
  bpp,
  options,
}: DecodeAndAssembleTilesParams): ImageMatrix => {
  const assembleQuantity = options?.assembleQuantity ?? 1;
  const tilesPerAxis = Math.sqrt(assembleQuantity);
  const size = tilesPerAxis * 8;

  let offset = tileMetaOffset;
  const tileImage = new Matrix<Color | null>(size, size, null);

  for (let y = 0; y < tilesPerAxis; y++) {
    for (let x = 0; x < tilesPerAxis; x++) {
      const tile = decodeTile(
        romData,
        bitplane,
        palette,
        tilesMetaAddress,
        offset,
        bpp,
        options,
      );
      tileImage.setMatrixAt(x * tile.width, y * tile.height, tile);
      offset += BYTES_PER_TILE_META;
    }
  }

  return tileImage;
};
