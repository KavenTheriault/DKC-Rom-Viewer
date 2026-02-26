import { read16 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { BPP } from '../../types/bpp';
import { GameLevelConstant, TilesDecodeSpec } from './types';

const WORLD_TABLE_LENGTH = 0x34;

interface WorldBackgroundInfo {
  tilemapAddress: RomAddress;
  tilesetAddress: RomAddress;
  paletteAddress: RomAddress;
}

export const readWorldBackgroundInfo = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  entranceId: number,
): WorldBackgroundInfo => {
  // Ref: ASM Code at $80E20F
  // LDA $BCF44B,X
  let worldIndex = read16(
    romData,
    levelConstant.tables.worldIndex.getOffsetAddress(entranceId).pcAddress,
  );
  // AND #$00FF
  worldIndex &= 0x00ff;

  // Ref: ASM Code at $80E499
  let tableOffset = worldIndex;
  // ASL (x2)
  tableOffset = tableOffset << 2;

  let currentTableAddress: RomAddress = levelConstant.tables.worldAddresses;

  // LDY $80E1AA,X
  const tilesetAbsolute = read16(
    romData,
    currentTableAddress.getOffsetAddress(tableOffset).pcAddress,
  );
  // LDA $80E1AC,X
  const tilesetBank = read16(
    romData, // This is previous address + 2
    currentTableAddress.getOffsetAddress(tableOffset + 2).pcAddress,
  );

  // Switch table to the next
  currentTableAddress =
    currentTableAddress.getOffsetAddress(WORLD_TABLE_LENGTH);

  // LDY $80E1AA,X
  const tilemapAbsolute = read16(
    romData,
    currentTableAddress.getOffsetAddress(tableOffset).pcAddress,
  );
  // LDA $80E1AC,X
  const tilemapBank = read16(
    romData,
    currentTableAddress.getOffsetAddress(tableOffset + 2).pcAddress,
  );

  // Switch table to the next
  currentTableAddress =
    currentTableAddress.getOffsetAddress(WORLD_TABLE_LENGTH);

  // LDA $02
  let paletteTableOffset = worldIndex;
  // ASL
  paletteTableOffset = paletteTableOffset << 1;
  // LDA $80E1DE,X
  const paletteAbsolute = read16(
    romData,
    currentTableAddress.getOffsetAddress(paletteTableOffset).pcAddress,
  );

  return {
    tilemapAddress: RomAddress.fromBankAndAbsolute(
      tilemapBank,
      tilemapAbsolute,
    ),
    tilesetAddress: RomAddress.fromBankAndAbsolute(
      tilesetBank,
      tilesetAbsolute,
    ),
    // Bank hardcoded to B9 (at $B99A03)
    paletteAddress: RomAddress.fromBankAndAbsolute(0xb9, paletteAbsolute),
  };
};

export const buildSpecFromWorldBackgroundInfo = (
  worldBackgroundInfo: WorldBackgroundInfo,
): TilesDecodeSpec => {
  return {
    tileset: {
      address: worldBackgroundInfo.tilesetAddress,
      length: 0x7000,
    },
    tilemap: {
      address: worldBackgroundInfo.tilemapAddress,
      length: 0x700,
    },
    paletteAddress: worldBackgroundInfo.paletteAddress,
    bpp: BPP.Four,
    tilesPerRow: 32,
  };
};
