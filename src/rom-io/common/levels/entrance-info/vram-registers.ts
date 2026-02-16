import { toHexString } from '../../../../website/utils/hex';
import { read16, read8 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { OpcodeEntry } from './asm/read';
import { findArgumentInPreviousOpcodes, findSubroutine } from './utils';

export const ScreenSize = ['32x32', '64x32', '32x64', '64x64'];

interface BackgroundRegister {
  size: string;
  tilemapAddress: number;
  tilesetAddress: number;
}

export interface BackgroundRegisters {
  layers: BackgroundRegister[];
}

export const readVramRegisters = (
  romData: Buffer,
  opcodeEntries: OpcodeEntry[],
): BackgroundRegisters => {
  const loadTerrainMetaSubroutine = findSubroutine(
    opcodeEntries,
    RomAddress.fromSnesAddress(0xb9a4dc),
  );
  const vramMetaIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadTerrainMetaSubroutine,
    'LDA',
  );
  console.log('vramMetaIndex', toHexString(vramMetaIndex));

  const bgRegisters: BackgroundRegisters = {
    layers: [
      { size: '', tilemapAddress: 0, tilesetAddress: 0 },
      { size: '', tilemapAddress: 0, tilesetAddress: 0 },
      { size: '', tilemapAddress: 0, tilesetAddress: 0 },
      { size: '', tilemapAddress: 0, tilesetAddress: 0 },
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
  y = x;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // LDX $A50E,Y
    x = read16(
      romData,
      RomAddress.fromSnesAddress(0xb9a50e).getOffsetAddress(y).pcAddress,
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
        RomAddress.fromSnesAddress(0xb9a50e).getOffsetAddress(y).pcAddress,
      );
      // STA $00,X [Vram Register]
      logRegister(x, a, bgRegisters);
      // INX
      x++;
      // INY
      y++;
    }
    // LDA $A50E,Y
    a = read8(
      romData,
      RomAddress.fromSnesAddress(0xb9a50e).getOffsetAddress(y).pcAddress,
    );
    // STA $00,X [Vram Register]
    logRegister(x, a, bgRegisters);
    // INY
    y++;
    // BRA $B9A4EA
  }

  for (let i = 0; i < 4; i++) {
    console.log(
      'Background Registers Layer',
      i + 1,
      bgRegisters.layers[i].size,
      toHexString(bgRegisters.layers[i].tilemapAddress),
      toHexString(bgRegisters.layers[i].tilesetAddress),
    );
  }

  return bgRegisters;
};

const logRegister = (
  address: number,
  value: number,
  bgRegisters: BackgroundRegisters,
) => {
  console.log('Vram Register', toHexString(address), toHexString(value));

  if (address >= 0x2107 && address <= 0x210a) {
    // aaaaaass
    const tilemapLocation = ((value & 0b11111100) >> 2) * 0x400;
    const screenSize = ScreenSize[value & 0b11];

    const layerIndex = address - 0x2107;
    bgRegisters.layers[layerIndex].size = screenSize;
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
