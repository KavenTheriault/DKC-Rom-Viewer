import { read16 } from '../../buffer';
import { readEntityFromReference } from './index';
import { Entity } from './types';

export const scanEntities = (
  romData: Buffer,
  entityBankSnesAddress: number,
  entitiesStartReference: number,
  entitiesEndReference: number,
): Entity[] => {
  const entities: Entity[] = [];

  let offset: number = entitiesStartReference;
  while (offset < entitiesEndReference) {
    const entity: Entity = readEntityFromReference(
      romData,
      entityBankSnesAddress,
      offset,
    );
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

export const scanEntityAddresses = (
  romData: Buffer,
  entityBankSnesAddress: number,
  entitiesStartReference: number,
  entitiesEndReference: number,
) => {
  const entities = scanEntities(
    romData,
    entityBankSnesAddress,
    entitiesStartReference,
    entitiesEndReference,
  );
  return entities.map((e) => e.address);
};
