import { extract } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { Matrix } from '../../types/matrix';
import { BPP } from '../stripper/decode-tile';
import { getCoordinateDataLength } from './coordinate';
import {
  getSpriteTilesQuantity,
  SPRITE_HEADER_LENGTH,
  SpriteHeader,
} from './header';
import { SmallTile } from './types';

export const TILE_DATA_LENGTH = 32;

export const getSmallTiles = (
  romData: Buffer,
  spriteAddress: RomAddress,
  spriteHeader: SpriteHeader,
): SmallTile[] => {
  const tiles: SmallTile[] = [];
  const tilesStartAddress: RomAddress = spriteAddress.getOffsetAddress(
    SPRITE_HEADER_LENGTH + getCoordinateDataLength(spriteHeader),
  );
  for (let i = 0; i < getSpriteTilesQuantity(spriteHeader); i++) {
    const tileAddress: RomAddress = tilesStartAddress.getOffsetAddress(
      i * TILE_DATA_LENGTH,
    );
    const tileData: Buffer = extract(
      romData,
      tileAddress.pcAddress,
      TILE_DATA_LENGTH,
    );
    tiles.push({
      address: tileAddress,
      pixels: parseTilePixels(Array.from(tileData)),
    });
  }
  return tiles;
};

export const parseTilePixels = (
  pixelData: number[],
  bpp: BPP = BPP.Four,
): Matrix<number> => {
  const pixels = new Matrix(8, 8, 0);

  switch (bpp) {
    case BPP.Two:
      {
        for (let row = 0; row < 8; row++) {
          const offset = row * 2;
          const plane0 = pixelData[offset];
          const plane1 = pixelData[offset + 1];

          for (let column = 0; column < 8; column++) {
            const bitShift: number = 7 - column;
            const bit0 = (plane0 >> bitShift) & 0b1;
            const bit1 = (plane1 >> bitShift) & 0b1;

            const val = (bit1 << 1) | bit0;
            pixels.set(column, row, val);
          }
        }
      }
      break;
    case BPP.Four:
      {
        for (let row = 0; row < 8; row++) {
          const offset: number = row * 2;
          const rowBitplanes: number[] = [
            pixelData[offset],
            pixelData[0x01 + offset],
            pixelData[0x10 + offset],
            pixelData[0x11 + offset],
          ];

          for (let column = 0; column < 8; column++) {
            const bitShift: number = 7 - column;
            const pixelBits: number[] = [
              (rowBitplanes[3] >> bitShift) & 0b1,
              (rowBitplanes[2] >> bitShift) & 0b1,
              (rowBitplanes[1] >> bitShift) & 0b1,
              (rowBitplanes[0] >> bitShift) & 0b1,
            ];
            const val =
              (pixelBits[0] << 3) |
              (pixelBits[1] << 2) |
              (pixelBits[2] << 1) |
              pixelBits[3];
            pixels.set(column, row, val);
          }
        }
      }
      break;
  }

  return pixels;
};
