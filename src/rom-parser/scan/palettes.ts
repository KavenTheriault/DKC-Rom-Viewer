import { scanEntities } from './entities';
import { EntityCommand } from '../entities/types';
import { RomAddress } from '../types/address';
import { paletteReferenceToSnesAddress } from '../palette';

export const scanPalettes = (romData: Buffer) => {
  const entities = scanEntities(romData);

  const foundPaletteSet = new Set<number>();
  const paletteAddresses: RomAddress[] = [];

  for (const entity of entities) {
    for (const instruction of entity.instructions) {
      if (instruction.command === EntityCommand.PALETTE) {
        const palettePointer = instruction.parameters[0];
        const paletteAddress = paletteReferenceToSnesAddress(palettePointer);

        if (!foundPaletteSet.has(paletteAddress.snesAddress)) {
          paletteAddresses.push(paletteAddress);
          foundPaletteSet.add(paletteAddress.snesAddress);
        }
      }
    }
  }

  return paletteAddresses;
};
