import { read16 } from '../../buffer';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { Matrix } from '../../types/matrix';
import { Palette } from '../palettes/types';
import { parseTilePixels } from '../sprites/tile';

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
  const tilePartMeta = read16(tileMetaData, tileMetaAddress);

  // Vertical Flip = 10000000 00000000
  const vFlip = (tilePartMeta & 0xc000) >> 15;
  // Horizontal Flips = 01000000 00000000
  const hFlip = (tilePartMeta & 0x4000) >> 14;
  // Priority = 0010000000000000
  const priority = (tilePartMeta & 0x2000) >> 13;
  // Palette Index = 00011100 00000000
  const paletteIndex = (tilePartMeta & 0x1c00) >> 10;
  // Tile Part Index = 00000011 11111111
  const tilePartIndex = tilePartMeta & 0x3ff;

  const tile = new Matrix<Color | null>(8, 8, null);
  if (
    (skipBackgroundTiles && priority === 0) ||
    (skipForegroundTiles && priority === 1)
  ) {
    return tile;
  }

  const is4bpp = bpp === BPP.Four;
  const bitplaneOffset = tilePartIndex * (is4bpp ? 32 : 16);
  const paletteOffset = paletteIndex * (is4bpp ? 16 : 4);

  const pixelDataLength = 8 * (is4bpp ? 4 : 2);
  const tileBitplane = bitplaneData.subarray(
    bitplaneOffset,
    bitplaneOffset + pixelDataLength,
  );
  const pixels = parseTilePixels(Array.from(tileBitplane), bpp);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const value = pixels.get(j, i);
      if (value === 0 && !opaqueZero) {
        /** Transparent pixel - Leave it to null */
        continue;
      }
      const colorIndex = value === 0 ? 0 : paletteOffset + value;
      tile.set(j, i, palette.colors[colorIndex]);
    }
  }

  if (hFlip) tile.flip('horizontal');
  if (vFlip) tile.flip('vertical');

  return tile;
};
