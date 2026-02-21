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
  const loadTerrainTilemapSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainTilemap,
  );
  const terrainIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadTerrainTilemapSubroutine,
    'LDA',
  );

  // Ref: ASM Code at $818C66
  const tilemapTableOffset = terrainIndex * 3;

  const levelsTilemapOffset = read16(
    romData,
    levelConstant.tables.levelsTilemapOffset.getOffsetAddress(
      tilemapTableOffset,
    ).pcAddress,
  );
  const terrainTilemapAbsolute = read16(
    romData,
    levelConstant.tables.terrainTilemapPointer.getOffsetAddress(
      tilemapTableOffset,
    ).pcAddress,
  );

  /* For most terrain type, value in terrainTilemapBank is zero
     In that case, the bank to use is levelsTilemapBank */
  const terrainTilemapBank = read8(
    romData,
    levelConstant.tables.terrainTilemapBank.getOffsetAddress(tilemapTableOffset)
      .pcAddress,
  );
  const levelsTilemapBank = read8(
    romData,
    levelConstant.tables.levelsTilemapBank.getOffsetAddress(tilemapTableOffset)
      .pcAddress,
  );

  const terrainTilemapAddress = RomAddress.fromBankAndAbsolute(
    terrainTilemapBank !== 0 ? terrainTilemapBank : levelsTilemapBank,
    terrainTilemapAbsolute,
  );
  return {
    levelsTilemapBank,
    levelsTilemapOffset,
    terrainTilemapAddress,
  };
};
