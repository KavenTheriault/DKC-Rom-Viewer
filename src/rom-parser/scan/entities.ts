import { readEntityFromReference } from '../entities';
import { Entity } from '../entities/types';
import { read16 } from '../utils/buffer';

const ENTITIES_START_REFERENCE = 0x856d;
const ENTITIES_END_REFERENCE = 0xfff7;

export const scanEntities = (romData: Buffer): Entity[] => {
  const entities: Entity[] = [];

  let offset: number = ENTITIES_START_REFERENCE;
  while (offset < ENTITIES_END_REFERENCE) {
    const entity: Entity = readEntityFromReference(romData, offset);
    entities.push(entity);
    offset += entity.length;

    const nextValue: number = read16(
      romData,
      entity.address.pcAddress + entity.length,
    );
    // Sometimes, entities are separated by those values
    if (nextValue === 0 || nextValue === 0x2000) {
      offset += 2;
    }
  }

  return entities;
};
