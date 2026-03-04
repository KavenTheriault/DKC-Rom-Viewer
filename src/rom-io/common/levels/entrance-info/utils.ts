import { read16, read24, read8 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { OpcodeEntry } from './asm/read';

export const readOpcodeEntryValue = (opcodeEntry: OpcodeEntry) => {
  if (opcodeEntry.bytes.length === 1) return read8(opcodeEntry.bytes, 0);
  if (opcodeEntry.bytes.length === 2) return read16(opcodeEntry.bytes, 0);
  if (opcodeEntry.bytes.length === 3) return read24(opcodeEntry.bytes, 0);
  throw Error(
    `Unsupported number of bytes to read argument (${opcodeEntry.opcode.name})`,
  );
};

export const findSubroutine = (
  opcodeEntries: OpcodeEntry[],
  subroutineAddress: RomAddress,
): OpcodeEntry => {
  const subroutine = findOpcodeEntryByAddress(opcodeEntries, subroutineAddress);
  if (!subroutine) {
    throw new Error(`Subroutine not found (${subroutineAddress.toString()})`);
  }
  return subroutine;
};

export const findArgumentInPreviousOpcodes = (
  opcodeEntries: OpcodeEntry[],
  targetOpcodeEntry: OpcodeEntry,
  opcodeName: string,
): number => {
  const previousOpcodesToSearch = 4;
  const subroutineIndex = opcodeEntries.indexOf(targetOpcodeEntry);
  const argumentOpcode = findOpcodeEntryByName(
    opcodeEntries
      .slice(
        Math.max(subroutineIndex - previousOpcodesToSearch, 0),
        subroutineIndex,
      )
      .reverse(),
    opcodeName,
  );

  if (!argumentOpcode) {
    throw new Error(`Can't find argument (${argumentOpcode})`);
  }

  return readOpcodeEntryValue(argumentOpcode);
};

export const findOpcodeEntryByAddress = (
  opcodeEntries: OpcodeEntry[],
  address: RomAddress,
) => opcodeEntries.find((o) => o.address.snesAddress === address.snesAddress);

export const findOpcodeEntryByName = (
  opcodeEntries: OpcodeEntry[],
  name: string,
) => opcodeEntries.find((o) => o.opcode.name.includes(name));

export const findOpcodeEntriesByName = (
  opcodeEntries: OpcodeEntry[],
  name: string,
) => opcodeEntries.filter((o) => o.opcode.name.includes(name));

export const findOpcodeEntryByValue = (
  opcodeEntries: OpcodeEntry[],
  value: number,
) => opcodeEntries.find((o) => readOpcodeEntryValue(o) === value);

export const filterOpcodeEntryByValue = (
  opcodeEntries: OpcodeEntry[],
  value: number,
) => opcodeEntries.filter((o) => readOpcodeEntryValue(o) === value);
