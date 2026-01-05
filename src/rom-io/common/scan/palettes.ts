import { RomAddress } from '../../rom/address';
import { EntityCommand } from '../entities/types';
import { paletteReferenceToSnesAddress } from '../palettes';
import { scanEntities } from './entities';

export const scanPalettes = (
  romData: Buffer,
  entityBankSnesAddress: number,
  entityPaletteBankSnesAddress: number,
  entitiesStartReference: number,
  entitiesEndReference: number,
) => {
  const entities = scanEntities(
    romData,
    entityBankSnesAddress,
    entitiesStartReference,
    entitiesEndReference,
  );

  const foundPaletteSet = new Set<number>();
  const paletteAddresses: RomAddress[] = [];

  for (const entity of entities) {
    for (const instruction of entity.instructions) {
      if (instruction.command === EntityCommand.PALETTE) {
        const palettePointer = instruction.parameters[0];
        const paletteAddress = paletteReferenceToSnesAddress(
          entityPaletteBankSnesAddress,
          palettePointer,
        );

        if (!foundPaletteSet.has(paletteAddress.snesAddress)) {
          paletteAddresses.push(paletteAddress);
          foundPaletteSet.add(paletteAddress.snesAddress);
        }
      }
    }
  }

  return paletteAddresses;
};
