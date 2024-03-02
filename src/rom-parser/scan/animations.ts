import { scanEntities } from './entities';
import { EntityCommand } from '../entities/types';
import { RomAddress } from '../types/address';
import { readAnimationPointer } from '../animations';

export const scanAnimations = (romData: Buffer) => {
  const entities = scanEntities(romData);

  const foundAnimationSet = new Set<number>();
  const animationsAddresses: RomAddress[] = [];

  for (const entity of entities) {
    for (const instruction of entity.instructions) {
      if (instruction.command === EntityCommand.ANIMATION) {
        const animationIndex = instruction.parameters[0];
        const animationAddress = readAnimationPointer(romData, animationIndex);

        if (!foundAnimationSet.has(animationAddress.snesAddress)) {
          animationsAddresses.push(animationAddress);
          foundAnimationSet.add(animationAddress.snesAddress);
        }
      }
    }
  }

  return animationsAddresses;
};
