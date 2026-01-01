import { RomAddress } from '../../rom/address';
import { getSpriteCoordinates } from './coordinate';
import { getSpriteHeader } from './header';
import { getSpriteTotalLength, readSpritePointer } from './index';
import { Coordinate } from './types';
import { validateSpriteHeader } from './validation';

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

const validateCoordinates = (coordinates: Coordinate[]): boolean => {
  for (const coordinate of coordinates) {
    // Sprite parts never touch the border
    if (coordinate.x === 0 || coordinate.x === 255) return false;
    if (coordinate.y === 0 || coordinate.y === 255) return false;
  }
  return true;
};

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
