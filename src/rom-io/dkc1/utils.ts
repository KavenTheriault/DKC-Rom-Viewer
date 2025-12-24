import { readSpritePointer } from '../common/sprites';
import { RomAddress } from '../rom/address';
import { EntityPaletteBank, SpritePointerTable } from './constants';

export const getAddressFromSpritePointerIndex = (
  romData: Buffer,
  spritePointerIndex: number,
): RomAddress => {
  const address: RomAddress = RomAddress.fromSnesAddress(
    SpritePointerTable + spritePointerIndex,
  );
  return readSpritePointer(romData, address);
};

export const paletteReferenceToSnesAddress = (
  paletteReference: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(EntityPaletteBank | paletteReference);
};

export const snesAddressToPaletteReference = (romAddress: RomAddress) => {
  return romAddress.snesAddress & 0x00ffff;
};
