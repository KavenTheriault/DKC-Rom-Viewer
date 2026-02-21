import { read16 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { Color } from '../../../types/color';
import { ImageMatrix } from '../../../types/image-matrix';
import { Matrix } from '../../../types/matrix';
import { Palette } from '../../palettes/types';
import { parseTilePixels } from '../../tile-pixels';

export interface DecodeTileOptions {
  /** If true, palette index 0 is opaque (rgb[0..2]) instead of transparent. */
  opaqueZero?: boolean;
  /** If true, skip drawing tiles with priority==0 (background tiles). */
  skipBackgroundTiles?: boolean;
  /** If true, skip drawing tiles with priority==1 (foreground tiles). */
  skipForegroundTiles?: boolean;
}

interface DecodeTileParams {
  tileset: Uint8Array;
  tilemap: {
    data: Buffer;
    address: RomAddress;
    offset: number;
  };
  palette: Palette;
  bpp: BPP;
  options?: DecodeTileOptions;
}

export const decodeTile = ({
  tileset,
  tilemap,
  palette,
  bpp,
  options,
}: DecodeTileParams): ImageMatrix => {
  const {
    opaqueZero = false,
    skipBackgroundTiles = false,
    skipForegroundTiles = false,
  } = options ?? {};
  const tilemapTile = read16(
    tilemap.data,
    tilemap.address.getOffsetAddress(tilemap.offset).pcAddress,
  );

  // Vertical Flip = 10000000 00000000
  const vFlip = (tilemapTile & 0xc000) >> 15;
  // Horizontal Flips = 01000000 00000000
  const hFlip = (tilemapTile & 0x4000) >> 14;
  // Priority = 00100000 00000000
  const priority = (tilemapTile & 0x2000) >> 13;
  // Palette Index = 00011100 00000000
  const paletteIndex = (tilemapTile & 0x1c00) >> 10;
  // Tile Index = 00000011 11111111
  const tileIndex = tilemapTile & 0x3ff;

  const is4bpp = bpp === BPP.Four;
  const tilesetOffset = tileIndex * (is4bpp ? 32 : 16);
  const paletteOffset = paletteIndex * (is4bpp ? 16 : 4);

  const tilesetTileLength = 8 * (is4bpp ? 4 : 2);
  const tilesetTile = Array.from(
    tileset.subarray(tilesetOffset, tilesetOffset + tilesetTileLength),
  );
  const pixels = parseTilePixels(tilesetTile, bpp);

  const tile = new Matrix<Color | null>(8, 8, null);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const value = pixels.get(j, i);

      const noPixel = value === 0;
      const skipBg = skipBackgroundTiles && priority === 0;
      const skipFg = skipForegroundTiles && priority === 1;

      if ((noPixel || skipBg || skipFg) && !opaqueZero) {
        /** Transparent pixel - Leave it to null */
        continue;
      }
      const colorIndex =
        value === 0 || skipBg || skipFg ? 0 : paletteOffset + value;
      tile.set(j, i, palette.colors[colorIndex]);
    }
  }

  if (hFlip) tile.flip('horizontal');
  if (vFlip) tile.flip('vertical');

  return tile;
};
