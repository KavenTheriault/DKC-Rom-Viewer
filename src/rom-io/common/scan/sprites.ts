import { RomAddress } from '../../rom/address';
import { getSpriteTotalLength } from '../sprites';
import { getSpriteCoordinates } from '../sprites/coordinate';
import { getSpriteHeader } from '../sprites/header';
import { Coordinate } from '../sprites/types';
import { validateSpriteHeader } from '../sprites/validation';

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
