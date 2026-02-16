import { read16, read8 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant } from '../types';
import { OpcodeEntry } from './asm/read';
import { findArgumentInPreviousOpcodes, findSubroutine } from './utils';

export const readTerrainTypeMeta = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
) => {
  const loadTerrainMetaSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainMeta,
  );
  const terrainMetaIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadTerrainMetaSubroutine,
    'LDA',
  );

  // Ref: ASM Code at $818C66
  const metaTableOffset = terrainMetaIndex * 3;

  const terrainTileOffset = read16(
    romData,
    levelConstant.tables.terrainMetaTileOffset.getOffsetAddress(metaTableOffset)
      .pcAddress,
  );
  const terrainMetaAbsolute = read16(
    romData,
    levelConstant.tables.terrainMetaPointer.getOffsetAddress(metaTableOffset)
      .pcAddress,
  );

  /* For most terrain type, value in terrainMetaBank is zero
     In that case, the bank to use is terrainTileMapBank */
  const terrainMetaBank = read8(
    romData,
    levelConstant.tables.terrainMetaBank.getOffsetAddress(metaTableOffset)
      .pcAddress,
  );
  const terrainTileMapBank = read8(
    romData,
    levelConstant.tables.terrainTileMapBank.getOffsetAddress(metaTableOffset)
      .pcAddress,
  );

  const terrainTypeMetaAddress = RomAddress.fromBankAndAbsolute(
    terrainMetaBank !== 0 ? terrainMetaBank : terrainTileMapBank,
    terrainMetaAbsolute,
  );
  return {
    terrainMetaIndex,
    terrainTileOffset,
    terrainTypeMetaAddress,
    terrainTileMapBank,
  };
};
