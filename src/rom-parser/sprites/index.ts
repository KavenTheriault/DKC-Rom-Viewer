import {
  getSpriteHeader,
  getSpriteTilesQuantity,
  SPRITE_HEADER_LENGTH,
  SpriteHeader,
} from './header';
import { getSmallTiles, TILE_DATA_LENGTH } from './tile';
import { getCoordinateDataLength, getSpriteCoordinates } from './coordinate';
import { buildSpriteParts } from './sprite-part';
import { Coordinate, SmallTile, SpritePart } from './types';
import { RomAddress } from '../types/address';
import { read32 } from '../utils/buffer';

export const SPRITE_POINTERS_ADDRESS: RomAddress =
  RomAddress.fromSnesAddress(0x3bcc9c);

export type Sprite = {
  address: RomAddress;
  header: SpriteHeader;
  parts: SpritePart[];
};

export const getAddressFromSpritePointerIndex = (
  romData: Buffer,
  spritePointerIndex: number,
): RomAddress => {
  const address: RomAddress = RomAddress.fromSnesAddress(
    SPRITE_POINTERS_ADDRESS.snesAddress + spritePointerIndex,
  );
  return readSpritePointer(romData, address);
};

export const readSpritePointer = (
  romData: Buffer,
  address: RomAddress,
): RomAddress => {
  const snesAddress: number = read32(romData, address.pcAddress);
  return RomAddress.fromSnesAddress(snesAddress);
};

export const readSprite = (
  romData: Buffer,
  spriteAddress: RomAddress,
): Sprite | undefined => {
  const spriteHeader = getSpriteHeader(romData, spriteAddress);
  if (!spriteHeader) return undefined;
  const coordinates: Coordinate[] = getSpriteCoordinates(
    romData,
    spriteAddress,
    spriteHeader,
  );
  const tiles: SmallTile[] = getSmallTiles(
    romData,
    spriteAddress,
    spriteHeader,
  );
  const spriteParts: SpritePart[] = buildSpriteParts(
    spriteHeader,
    tiles,
    coordinates,
  );

  return {
    address: spriteAddress,
    header: spriteHeader,
    parts: spriteParts,
  };
};

export const getSpriteTotalLength = (spriteHeader: SpriteHeader) => {
  return (
    SPRITE_HEADER_LENGTH +
    getCoordinateDataLength(spriteHeader) +
    getSpriteTilesQuantity(spriteHeader) * TILE_DATA_LENGTH
  );
};
