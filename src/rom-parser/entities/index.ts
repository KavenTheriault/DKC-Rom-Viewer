import { read16 } from '../utils/buffer';
import { RomAddress } from '../types/address';
import {
  Entity,
  EntityCommand,
  EntityCommandParametersCount,
  EntityInstruction,
} from './types';
import { readAnimationPointer, readRawAnimation } from '../animations';
import { RawAnimation } from '../animations/types';
import { Color } from '../sprites/types';
import { palettePointerToSnesAddress, readPalette } from '../palette';

export const ENTITY_STARTING_ADDRESS = 0xb50000;

export const readEntityFromReference = (
  romData: Buffer,
  entityReference: number,
) => {
  const address: RomAddress = entityReferenceToSnesAddress(entityReference);
  return readEntity(romData, address);
};

export const entityReferenceToSnesAddress = (
  entityReference: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(ENTITY_STARTING_ADDRESS | entityReference);
};

export const snesAddressToEntityReference = (romAddress: RomAddress) => {
  return romAddress.snesAddress & 0x00ffff;
};

export const readEntity = (romData: Buffer, romAddress: RomAddress): Entity => {
  const instructions: EntityInstruction[] = [];

  let offset = 0;
  let lastCommand = 0;
  const inheritEntities: Entity[] = [];

  while (lastCommand !== EntityCommand.END) {
    if (offset > 3000) throw new Error('No END command found');

    const command: number = read16(romData, romAddress.pcAddress + offset);
    offset += 2;

    const parametersCount =
      command in EntityCommandParametersCount
        ? EntityCommandParametersCount[command as EntityCommand]
        : 1;

    const parameters: number[] = [];
    for (let i = 0; i < parametersCount; i++) {
      const parameter: number = read16(romData, romAddress.pcAddress + offset);
      offset += 2;

      parameters.push(parameter);
    }

    lastCommand = command;
    instructions.push({
      command,
      parameters,
    });

    if (command === EntityCommand.INHERIT) {
      const inheritEntity: Entity = readEntity(
        romData,
        entityReferenceToSnesAddress(parameters[0]),
      );
      inheritEntities.push(inheritEntity);
    }
  }

  return {
    address: romAddress,
    length: offset,
    instructions,
    inheritEntities,
  };
};

export const findEntityInstruction = (
  entity: Entity,
  command: EntityCommand,
): EntityInstruction | undefined => {
  for (const instruction of entity.instructions) {
    if (instruction.command === command) return instruction;
  }

  for (const inheritEntity of entity.inheritEntities) {
    const foundInstruction = findEntityInstruction(inheritEntity, command);
    if (foundInstruction) return foundInstruction;
  }

  return undefined;
};

export const readEntityRawAnimation = (
  romData: Buffer,
  entity: Entity,
): RawAnimation | undefined => {
  const animationCommand = findEntityInstruction(
    entity,
    EntityCommand.ANIMATION,
  );
  if (!animationCommand) return;

  const animationIndex = animationCommand.parameters[0];
  const animationAddress = readAnimationPointer(romData, animationIndex);
  return readRawAnimation(romData, animationAddress);
};

export const readEntityPalette = (
  romData: Buffer,
  entity: Entity,
): Color[] | undefined => {
  const paletteCommand = findEntityInstruction(entity, EntityCommand.PALETTE);
  if (!paletteCommand) return;

  const palettePointer = paletteCommand.parameters[0];
  const paletteAddress = palettePointerToSnesAddress(palettePointer);
  return readPalette(romData, paletteAddress);
};
