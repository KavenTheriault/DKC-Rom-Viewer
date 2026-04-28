import { GameLevelConstant } from '../types';
import { OpcodeEntry } from './asm/read';
import {
  findOpcodeEntriesByName,
  findOpcodeEntryByAddress,
  readOpcodeEntryValue,
} from './utils';

const PREVIOUS_OPCODES_TO_SEARCH = 6;

// For levels background using the levels tilemap and terrain tileset
export const readLevelsTilemapBackgroundAbsolute = (
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
  levelsTilemapOffset: number,
): number | null => {
  const loadTerrainBackgroundTilemapSubroutine = findOpcodeEntryByAddress(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainBackgroundTilemap,
  );
  if (!loadTerrainBackgroundTilemapSubroutine) return null;

  const opcodeIndex = opcodeEntries.indexOf(
    loadTerrainBackgroundTilemapSubroutine,
  );
  const ldaOpcodes = findOpcodeEntriesByName(
    opcodeEntries
      .slice(Math.max(opcodeIndex - PREVIOUS_OPCODES_TO_SEARCH, 0), opcodeIndex)
      .reverse(),
    'LDA',
  );
  if (ldaOpcodes.length === 0) return null;

  // Ref: ASM Code at $B18711
  const codeConstant1 = readOpcodeEntryValue(ldaOpcodes[0]);
  const codeConstant2 =
    ldaOpcodes.length > 1 ? readOpcodeEntryValue(ldaOpcodes[1]) : 0;

  let absolute = codeConstant1;
  // ADC #$0100
  absolute += 0x0100;
  absolute &= 0xffff;
  // AND #$FFE0
  absolute &= 0xffe0;
  // ADC $D3 (levelsTilemapOffset)
  absolute += levelsTilemapOffset;
  absolute &= 0xffff;

  if (codeConstant2 > 0) {
    let offset = codeConstant2;
    // AND #$01E0
    offset &= 0x01e0;
    // LSR (x4)
    offset = offset >> 4;
    offset &= 0xffff;
    // ADC $4C
    absolute += offset;
    absolute &= 0xffff;
  }

  // The value is always 0x20 before the real start
  absolute += 0x20;
  absolute &= 0xffff;

  return absolute;
};
