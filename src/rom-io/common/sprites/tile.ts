import { extract } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { parseTilePixels } from '../tile-pixels';
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
