import { SmallTile } from './types';
import {
  getSpriteTilesQuantity,
  SPRITE_HEADER_LENGTH,
  SpriteHeader,
} from './header';
import { extract } from '../utils/buffer';
import { getCoordinateDataLength } from './coordinate';
import { RomAddress } from '../types/address';
import { Matrix } from '../../types/matrix';

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
      pixels: parsePixels(tileData),
    });
  }
  return tiles;
};

export const parsePixels = (pixelData: Buffer): Matrix<number> => {
  const pixels = new Matrix<number>(8, 8, 0);

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

  return pixels;
};
