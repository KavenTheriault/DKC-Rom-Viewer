import { Coordinate } from './types';
import { SPRITE_HEADER_LENGTH, SpriteHeader } from './header';
import { extract } from '../utils/buffer';
import { RomAddress } from '../types/address';

export const getCoordinateDataLength = (spriteHeader: SpriteHeader) =>
  getSpriteCoordinateQuantity(spriteHeader) * 2;

export const getSpriteCoordinateQuantity = (spriteHeader: SpriteHeader) =>
  spriteHeader.tileQuantity.large +
  spriteHeader.tileQuantity.small1 +
  spriteHeader.tileQuantity.small2;

export const getSpriteCoordinates = (
  romData: Buffer,
  spriteAddress: RomAddress,
  spriteHeader: SpriteHeader,
): Coordinate[] => {
  const coordinates: Coordinate[] = [];
  const coordinatesPosition: number =
    spriteAddress.pcAddress + SPRITE_HEADER_LENGTH;
  const coordinatesData: Buffer = extract(
    romData,
    coordinatesPosition,
    getSpriteCoordinateQuantity(spriteHeader) * 2,
  );
  for (let i = 0; i < coordinatesData.length; i++) {
    const tileCoordinatesPosition: number = i * 2;
    coordinates.push({
      x: coordinatesData[tileCoordinatesPosition],
      y: coordinatesData[tileCoordinatesPosition + 1],
    });
  }
  return coordinates;
};
