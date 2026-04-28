import { Size } from '../../../../website/types/spatial';
import { read16, read8 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { Buffer } from '../../../types/buffer';
import { GameLevelConstant } from '../types';
import { OpcodeEntry } from './asm/read';
import { findArgumentInPreviousOpcodes, findSubroutine } from './utils';

export const BackgroundSize: Size[] = [
  { width: 32, height: 32 },
  { width: 64, height: 32 },
  { width: 32, height: 64 },
  { width: 64, height: 64 },
];

export interface BackgroundRegister {
  size: Size;
  tilemapAddress: number;
  tilesetAddress: number;
}

export interface BackgroundRegisters {
  layers: BackgroundRegister[];
}

// Ref: ASM Code at $B9A4DC
export const readVramRegisters = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
): BackgroundRegisters => {
  const loadVramRegistersSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadVramRegisters,
  );
  const vramMetaIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadVramRegistersSubroutine,
    'LDA',
  );

  const backgroundRegisters: BackgroundRegisters = {
    layers: [
      { size: { width: 0, height: 0 }, tilemapAddress: 0, tilesetAddress: 0 },
      { size: { width: 0, height: 0 }, tilemapAddress: 0, tilesetAddress: 0 },
      { size: { width: 0, height: 0 }, tilemapAddress: 0, tilesetAddress: 0 },
      { size: { width: 0, height: 0 }, tilemapAddress: 0, tilesetAddress: 0 },
    ],
  };

  let a, x, y, bd, bc, carry;
  a = vramMetaIndex;

  // ASL
  a = a << 1;
  // TAY
  y = a;
  // LDX $A50E,Y
  x = read16(
    romData,
    RomAddress.fromSnesAddress(0xb9a50e).getOffsetAddress(y).pcAddress,
  );
  // TXY
  // noinspection JSSuspiciousNameCombination
  y = x;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // LDX $A50E,Y
    x = read16(
      romData,
      levelConstant.tables.vramRegisters.getOffsetAddress(y).pcAddress,
    );
    // BEQ $B9A50A (End of loop)
    if (x === 0) break;
    // INY
    y++;
    // INY
    y++;
    // STX $BC
    bc = x & 0xff;
    bd = x >> 8;
    // ASL $BD (Arithmetic Shift Left the value in $BD)
    carry = (bd & 0x80) !== 0 ? 1 : 0;
    bd = (bd << 1) & 0xff;
    // BCC $B9A502 (Branch is carry clear)
    if (carry !== 0) {
      // LSR $BD
      bd = bd >> 1;
      // LDX $BC
      x = (bd << 8) + bc;
      // LDA $A50E,Y
      a = read8(
        romData,
        levelConstant.tables.vramRegisters.getOffsetAddress(y).pcAddress,
      );
      // STA $00,X [Vram Register]
      parseRegister(x, a, backgroundRegisters);
      // INX
      x++;
      // INY
      y++;
    }
    // LDA $A50E,Y
    a = read8(
      romData,
      levelConstant.tables.vramRegisters.getOffsetAddress(y).pcAddress,
    );
    // STA $00,X [Vram Register]
    parseRegister(x, a, backgroundRegisters);
    // INY
    y++;
    // BRA $B9A4EA
  }

  return backgroundRegisters;
};

const parseRegister = (
  address: number,
  value: number,
  bgRegisters: BackgroundRegisters,
) => {
  if (address >= 0x2107 && address <= 0x210a) {
    // aaaaaass
    const tilemapLocation = ((value & 0b11111100) >> 2) * 0x400;
    const size = BackgroundSize[value & 0b11];

    const layerIndex = address - 0x2107;
    bgRegisters.layers[layerIndex].size = size;
    bgRegisters.layers[layerIndex].tilemapAddress = tilemapLocation;
  }

  const parseTilesetLocation = () => {
    // aaaabbbb
    const bg2or4Location = ((value & 0b11110000) >> 4) * 0x1000;
    const bg1or3Location = (value & 0b1111) * 0x1000;
    return { bg1or3Location, bg2or4Location };
  };

  if (address == 0x210b) {
    const { bg1or3Location, bg2or4Location } = parseTilesetLocation();

    bgRegisters.layers[0].tilesetAddress = bg1or3Location;
    bgRegisters.layers[1].tilesetAddress = bg2or4Location;
  }

  if (address == 0x210c) {
    const { bg1or3Location, bg2or4Location } = parseTilesetLocation();

    bgRegisters.layers[2].tilesetAddress = bg1or3Location;
    bgRegisters.layers[3].tilesetAddress = bg2or4Location;
  }
};
