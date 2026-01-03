import { RomAddress } from '../../rom/address';
import { readAnimationPointer } from '../animations';
import { EntityCommand } from '../entities/types';
import { scanEntities } from './entities';

export const scanAnimations = (
  romData: Buffer,
  entityBankSnesAddress: number,
  entitiesStartReference: number,
  entitiesEndReference: number,
  animationScriptBankSnesAddress: number,
  animationScriptTableSnesAddress: number,
) => {
  const entities = scanEntities(
    romData,
    entityBankSnesAddress,
    entitiesStartReference,
    entitiesEndReference,
  );

  const foundAnimationSet = new Set<number>();
  const animationsAddresses: RomAddress[] = [];

  for (const entity of entities) {
    for (const instruction of entity.instructions) {
      if (instruction.command === EntityCommand.ANIMATION) {
        const animationIndex = instruction.parameters[0];
        const animationAddress = readAnimationPointer(
          romData,
          animationScriptBankSnesAddress,
          animationScriptTableSnesAddress,
          animationIndex,
        );

        if (!foundAnimationSet.has(animationAddress.snesAddress)) {
          animationsAddresses.push(animationAddress);
          foundAnimationSet.add(animationAddress.snesAddress);
        }
      }
    }
  }

  return animationsAddresses;
};
