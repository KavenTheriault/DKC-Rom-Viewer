import { RomAddress } from '../types/address';
import { extract, read16, read24, read8 } from '../utils/buffer';
import { Opcode, OPCODES_MAP } from './opcodes';
import { bufferToString, toHexString } from '../../utils/hex';

export type OpcodeEntry = {
  address: RomAddress;
  opcode: Opcode;
  bytes: Buffer;
};

type Mode = '8bit' | '16bit';

type ProcessorFlags = {
  memory: Mode;
  index: Mode;
};

const DEFAULT_FLAGS: ProcessorFlags = { memory: '16bit', index: '16bit' };

export const logOpcodeEntry = ({ opcode, bytes, address }: OpcodeEntry) => {
  console.log({
    name: opcode.name,
    opcode: opcode,
    bytes: bufferToString(bytes),
    address: address.toString(),
  });
};

export const readOpcodeEntry = (
  romData: Buffer,
  address: RomAddress,
  flags = DEFAULT_FLAGS,
): OpcodeEntry => {
  const opcodeHex = read8(romData, address.pcAddress);

  if (!(opcodeHex in OPCODES_MAP)) {
    throw new Error(`Unrecognized 65816 Opcode (${toHexString(opcodeHex)})`);
  }

  const opcode = { ...OPCODES_MAP[opcodeHex] };
  if (opcode.addOneIfMemory16Bits && flags.memory === '16bit')
    opcode.bytesCount++;
  if (opcode.addOneIfIndex16Bits && flags.index === '16bit')
    opcode.bytesCount++;

  const bytes = extract(romData, address.pcAddress + 1, opcode.bytesCount - 1);
  return { address, opcode, bytes };
};

export const readOpcodeUntil = (
  romData: Buffer,
  startAt: RomAddress,
  readStatus: { count: number; flags: ProcessorFlags } = {
    count: 0,
    flags: { ...DEFAULT_FLAGS },
  },
  options: { readLimit: number } = { readLimit: 1000 },
) => {
  let readOffset = 0;
  const opcodeEntries: OpcodeEntry[] = [];

  while (readStatus.count < options.readLimit) {
    const opcodeEntry = readOpcodeEntry(
      romData,
      startAt.getOffsetAddress(readOffset),
      readStatus.flags,
    );
    opcodeEntries.push(opcodeEntry);
    //logOpcodeEntry(opcodeEntry);

    readOffset += opcodeEntry.opcode.bytesCount;
    readStatus.count++;

    if (
      opcodeEntry.opcode.name.includes('JSR') ||
      opcodeEntry.opcode.name.includes('JMP')
    ) {
      let jumpAddress: RomAddress;
      if (
        opcodeEntry.opcode.name.includes('JSR addr') ||
        opcodeEntry.opcode.name.includes('JMP addr')
      ) {
        const absoluteAddress = read16(opcodeEntry.bytes, 0);
        jumpAddress = RomAddress.fromBankAndAbsolute(
          startAt.bank,
          absoluteAddress,
        );
      } else if (
        opcodeEntry.opcode.name.includes('JSR long') ||
        opcodeEntry.opcode.name.includes('JMP long (JML)')
      ) {
        const longAddress = read24(opcodeEntry.bytes, 0);
        jumpAddress = RomAddress.fromSnesAddress(longAddress);
      } else {
        throw new Error(`Opcode not implemented (${opcodeEntry.opcode.name})`);
      }

      const jumpEntries = readOpcodeUntil(
        romData,
        jumpAddress,
        readStatus,
        options,
      );
      opcodeEntries.push(...jumpEntries);

      if (opcodeEntry.opcode.name.includes('JMP')) break;
    } else if (opcodeEntry.opcode.name.includes('SEP')) {
      if (opcodeEntry.bytes[0] === 0x10) {
        readStatus.flags.index = '8bit';
      } else if (opcodeEntry.bytes[0] === 0x20) {
        readStatus.flags.memory = '8bit';
      } else if (opcodeEntry.bytes[0] === 0x30) {
        readStatus.flags.index = '8bit';
        readStatus.flags.index = '8bit';
      }
    } else if (opcodeEntry.opcode.name.includes('REP')) {
      if (opcodeEntry.bytes[0] === 0x10) {
        readStatus.flags.index = '16bit';
      } else if (opcodeEntry.bytes[0] === 0x20) {
        readStatus.flags.memory = '16bit';
      } else if (opcodeEntry.bytes[0] === 0x30) {
        readStatus.flags.index = '16bit';
        readStatus.flags.index = '16bit';
      }
    } else if (
      opcodeEntry.opcode.name.includes('RTS') ||
      opcodeEntry.opcode.name.includes('RTL')
    ) {
      break;
    }
  }

  return opcodeEntries;
};
