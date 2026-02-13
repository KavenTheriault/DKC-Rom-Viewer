import { RomAddress } from '../../rom/address';
import { ImageMatrix } from '../../types/image-matrix';
import { readPalette } from '../palettes';
import { BPP, decodeTile, DecodeTileOptions } from './decode-tile';

export function decodeBitplane(
  romData: Buffer,
  bitplaneData: Uint8Array,
  tileMetaData: Buffer,
  paletteAddress: RomAddress,
  bpp: BPP,
  options?: DecodeTileOptions,
  levelMode = false,
): ImageMatrix[] {
  const result = [];
  const palette = readPalette(romData, paletteAddress, 128);

  if (levelMode) {
    const tiles = Math.floor(tileMetaData.length / 32);
    for (let i = 0; i < tiles; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          const rawAddress = i * 32 + j * 2 + k * 8;
          const tile = decodeTile(
            bitplaneData,
            tileMetaData,
            palette,
            rawAddress,
            bpp,
            options,
          );
          result.push(tile);
        }
      }
    }
  } else {
    const tiles = Math.floor(tileMetaData.length / 2);
    for (let i = 0; i < tiles; i++) {
      const rawAddress = i * 2;
      const tile = decodeTile(
        bitplaneData,
        tileMetaData,
        palette,
        rawAddress,
        bpp,
        options,
      );
      result.push(tile);
    }
  }

  return result;
}
