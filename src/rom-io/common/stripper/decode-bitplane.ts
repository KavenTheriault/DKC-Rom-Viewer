import { RomAddress } from '../../rom/address';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import { readPalette } from '../palettes';
import { BPP, decodeTile, DecodeTileOptions } from './decode-tile';

const BYTES_PER_TILE_META = 2;

interface DecodeBitplaneOptions extends DecodeTileOptions {
  assembleQuantity?: number;
}

export function decodeBitplane(
  romData: Buffer,
  bitplaneData: Uint8Array,
  tileMetaData: Buffer,
  paletteAddress: RomAddress,
  bpp: BPP,
  options?: DecodeBitplaneOptions,
): ImageMatrix[] {
  const tiles = [];
  const palette = readPalette(romData, paletteAddress, 128);
  const assembleQuantity = options?.assembleQuantity ?? 1;

  let tileMetaAddress = 0;
  const tilesQuantity = Math.floor(
    tileMetaData.length / (assembleQuantity * BYTES_PER_TILE_META),
  );
  for (let tileIndex = 0; tileIndex < tilesQuantity; tileIndex++) {
    const tilesPerAxis = Math.sqrt(assembleQuantity);
    const size = tilesPerAxis * 8;

    const tileImage = new Matrix<Color | null>(size, size, null);

    for (let y = 0; y < tilesPerAxis; y++) {
      for (let x = 0; x < tilesPerAxis; x++) {
        const tile = decodeTile(
          bitplaneData,
          tileMetaData,
          palette,
          tileMetaAddress,
          bpp,
          options,
        );
        tileImage.setMatrixAt(x * tile.width, y * tile.height, tile);
        tileMetaAddress += BYTES_PER_TILE_META;
      }
    }

    tiles.push(tileImage);
  }

  return tiles;
}
