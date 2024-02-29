import {
  buildHeaderFromTileQuantity,
  getSpriteHeader,
  getSpriteTilesQuantity,
  SpriteHeader,
} from '../sprites/header';
import { RomAddress } from '../types/address';
import { getSpriteTotalLength, readSpritePointer } from '../sprites';
import { getSpriteCoordinates } from '../sprites/coordinate';
import { Coordinate } from '../sprites/types';

export const scanSpritesUsingPointers = (
  romData: Buffer,
  increment = 1,
): RomAddress[] => {
  const spriteAddresses: RomAddress[] = [];
  const visitedAddresses: Set<number> = new Set<number>();

  for (let i = 0; i < romData.length; i += increment) {
    const romAddress: RomAddress = readSpritePointer(
      romData,
      RomAddress.fromSnesAddress(i),
    );
    if (visitedAddresses.has(romAddress.snesAddress)) continue;
    visitedAddresses.add(romAddress.snesAddress);

    const spriteHeader = getSpriteHeader(romData, romAddress);
    if (spriteHeader && validateSpriteHeader(spriteHeader)) {
      spriteAddresses.push(romAddress);
    }
  }

  return spriteAddresses;
};

export const scanSprites = (romData: Buffer) => {
  const spriteAddresses: RomAddress[] = [];
  for (let i = 0; i < romData.length; i++) {
    const address: RomAddress = RomAddress.fromSnesAddress(i);
    const spriteHeader = getSpriteHeader(romData, address);
    if (spriteHeader && validateSpriteHeader(spriteHeader)) {
      const coordinates: Coordinate[] = getSpriteCoordinates(
        romData,
        address,
        spriteHeader,
      );
      if (validateCoordinates(coordinates)) {
        spriteAddresses.push(address);

        const spriteTotalLength: number = getSpriteTotalLength(spriteHeader);
        i += spriteTotalLength - 1;
      }
    }
  }
  return spriteAddresses;
};

export const validateSpriteHeader = (spriteHeader: SpriteHeader): boolean => {
  // Must contain at least one tile
  const tilesQuantity: number = getSpriteTilesQuantity(spriteHeader);
  if (tilesQuantity <= 0) return false;

  // Can't have small2 if no small1
  if (
    spriteHeader.tileQuantity.small2 > 0 &&
    spriteHeader.tileQuantity.small1 === 0
  )
    return false;

  // There's no sprite that large
  if (spriteHeader.tileQuantity.large > 64) return false;
  if (spriteHeader.tileQuantity.small1 > 64) return false;
  if (spriteHeader.tileQuantity.small2 > 64) return false;

  const computedHeader: SpriteHeader = buildHeaderFromTileQuantity(
    spriteHeader.tileQuantity,
  );
  if (computedHeader.offsets.small1Offset !== spriteHeader.offsets.small1Offset)
    return false;
  if (computedHeader.offsets.small2Offset !== spriteHeader.offsets.small2Offset)
    return false;
  if (computedHeader.dma.group1TileQty !== spriteHeader.dma.group1TileQty)
    return false;
  if (computedHeader.dma.group2TileQty !== spriteHeader.dma.group2TileQty)
    return false;
  if (computedHeader.dma.group2Offset !== spriteHeader.dma.group2Offset)
    return false;

  return true;
};

export const validateCoordinates = (coordinates: Coordinate[]): boolean => {
  for (const coordinate of coordinates) {
    // Sprite parts never touch the border
    if (coordinate.x === 0 || coordinate.x === 255) return false;
    if (coordinate.y === 0 || coordinate.y === 255) return false;
  }
  return true;
};
