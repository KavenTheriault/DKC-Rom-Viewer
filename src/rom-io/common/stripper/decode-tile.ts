import { read8 } from '../../buffer';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import { Palette } from '../palettes/types';

export enum BPP {
  /** 2 bits per pixel (values 0–3) */
  Two,
  /** 4 bits per pixel (values 0–15) */
  Four,
}

export interface DecodeTileOptions {
  /** If true, palette index 0 is opaque (rgb[0..2]) instead of transparent. */
  opaqueZero?: boolean;
  /** If true, skip drawing tiles with priority==0 (background tiles). */
  skipBackgroundTiles?: boolean;
  /** If true, skip drawing tiles with priority==1 (foreground tiles). */
  skipForegroundTiles?: boolean;
}

export const decodeTile = (
  bitplaneData: Uint8Array,
  tileMetaData: Buffer,
  palette: Palette,
  tileMetaAddress: number,
  bpp: BPP,
  options?: DecodeTileOptions,
): ImageMatrix => {
  const {
    opaqueZero = false,
    skipBackgroundTiles = false,
    skipForegroundTiles = false,
  } = options ?? {};

  const low = read8(tileMetaData, tileMetaAddress + 1);
  const high = read8(tileMetaData, tileMetaAddress);

  let palOfs = 0;
  let vFlip = 0;
  let hFlip = 0;
  let priority = 0;
  let highOfs = high;

  if (low & 1) highOfs += 256;
  if (low & 2) highOfs += 512;
  if (low & 4) palOfs += 1;
  if (low & 8) palOfs += 2;
  if (low & 16) palOfs += 4;
  if (low & 32) priority = 1;
  if (low & 64) hFlip = 1;
  if (low & 128) vFlip = 1;

  const tile = new Matrix<Color | null>(8, 8, null);
  if (
    (skipBackgroundTiles && priority === 0) ||
    (skipForegroundTiles && priority === 1)
  ) {
    return tile;
  }

  const is4bpp = bpp === BPP.Four;
  const imgOfs = highOfs * (is4bpp ? 32 : 16);
  palOfs *= is4bpp ? 16 : 4;

  for (let i = 0; i < 8; i++) {
    const one = bitplaneData[imgOfs + i * 2];
    const two = bitplaneData[imgOfs + i * 2 + 1];
    const three = is4bpp ? bitplaneData[imgOfs + i * 2 + 16] : 0;
    const four = is4bpp ? bitplaneData[imgOfs + i * 2 + 17] : 0;

    for (let j = 0; j < 8; j++) {
      let value = 0;
      const mask = 0x80 >> j;

      if (one & mask) value += 1;
      if (two & mask) value += 2;
      if (is4bpp) {
        if (three & mask) value += 4;
        if (four & mask) value += 8;
      }

      if (value === 0 && !opaqueZero) continue;
      const base = value === 0 ? 0 : palOfs + value;
      tile.set(j, i, palette.colors[base]);
    }
  }

  if (hFlip) tile.flip('horizontal');
  if (vFlip) tile.flip('vertical');

  return tile;
};
