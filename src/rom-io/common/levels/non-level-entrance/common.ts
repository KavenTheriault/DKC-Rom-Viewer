import { readOpcodeUntil } from '../entrance-info/asm/read';
import { readOpcodeEntryValue } from '../entrance-info/utils';
import { GameLevelConstant } from '../types';
import { NonLevelEntranceInfo } from './types';

// Ref: ASM Code at $80E870
export const readNonLevelEntranceInfo = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  entranceId: number,
): NonLevelEntranceInfo | undefined => {
  const opcodeEntries = readOpcodeUntil(
    romData,
    levelConstant.subroutines.loadEntrance,
    undefined,
    { readLimit: 25 },
  );

  for (let i = 0; i < opcodeEntries.length; i++) {
    const opcode = opcodeEntries[i];

    if (opcode.opcode.name === 'CMP #const') {
      const nextOpcode = opcodeEntries[i + 1];
      const argument = readOpcodeEntryValue(opcode);

      if (nextOpcode.opcode.name.includes('BEQ')) {
        if (argument === entranceId) {
          const offset = readOpcodeEntryValue(nextOpcode);
          const branchAddress = nextOpcode.address.getOffsetAddress(offset + 2);
          return {
            branchAddress,
            type: 'world-map',
          };
        }
      } else if (nextOpcode.opcode.name.includes('BCS')) {
        if (entranceId >= argument) {
          const offset = readOpcodeEntryValue(nextOpcode);
          const branchAddress = nextOpcode.address.getOffsetAddress(offset + 2);
          return {
            branchAddress,
            type: 'service',
          };
        }
      }
    }
  }
  return undefined;
};
