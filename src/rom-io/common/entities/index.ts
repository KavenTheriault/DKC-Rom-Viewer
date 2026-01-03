import { extract, read16 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { readAnimationInfo, readAnimationPointer } from '../animations';
import { AnimationInfo } from '../animations/types';
import { paletteReferenceToSnesAddress, readPalette } from '../palettes';
import { Palette } from '../palettes/types';
import {
  Entity,
  EntityCommand,
  EntityCommandParametersCount,
  EntityInstruction,
} from './types';

export const readEntityFromReference = (
  romData: Buffer,
  entityBankSnesAddress: number,
  entityReference: number,
) => {
  const address: RomAddress = entityReferenceToSnesAddress(
    entityBankSnesAddress,
    entityReference,
  );
  return readEntity(romData, entityBankSnesAddress, address);
};

export const entityReferenceToSnesAddress = (
  entityBankSnesAddress: number,
  entityReference: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(entityBankSnesAddress | entityReference);
};

export const snesAddressToEntityReference = (romAddress: RomAddress) => {
  return romAddress.snesAddress & 0x00ffff;
};

export const readEntity = (
  romData: Buffer,
  entityBankSnesAddress: number,
  romAddress: RomAddress,
): Entity => {
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
        entityBankSnesAddress,
        entityReferenceToSnesAddress(entityBankSnesAddress, parameters[0]),
      );
      inheritEntities.push(inheritEntity);
    }
  }

  const bytes = extract(romData, romAddress.pcAddress, offset);
  return {
    address: romAddress,
    bytes: bytes,
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

export const readEntityAnimationInfo = (
  romData: Buffer,
  animationScriptBankSnesAddress: number,
  animationScriptTableSnesAddress: number,
  entity: Entity,
): AnimationInfo | undefined => {
  const animationCommand = findEntityInstruction(
    entity,
    EntityCommand.ANIMATION,
  );
  if (!animationCommand) return;

  const animationIndex = animationCommand.parameters[0];
  const animationAddress = readAnimationPointer(
    romData,
    animationScriptBankSnesAddress,
    animationScriptTableSnesAddress,
    animationIndex,
  );
  return readAnimationInfo(romData, animationAddress);
};

export const readEntityPalette = (
  romData: Buffer,
  entityPaletteBankSnesAddress: number,
  entity: Entity,
): Palette | undefined => {
  const paletteCommand = findEntityInstruction(entity, EntityCommand.PALETTE);
  if (!paletteCommand) return;

  const palettePointer = paletteCommand.parameters[0];
  const paletteAddress = paletteReferenceToSnesAddress(
    entityPaletteBankSnesAddress,
    palettePointer,
  );
  return readPalette(romData, paletteAddress);
};
