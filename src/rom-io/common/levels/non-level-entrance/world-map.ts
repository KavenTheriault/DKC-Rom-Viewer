import { read16 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { Color } from '../../../types/color';
import { ImageMatrix } from '../../../types/image-matrix';
import { Matrix } from '../../../types/matrix';
import { readOpcodeUntil } from '../entrance-info/asm/read';
import {
  findArgumentInPreviousOpcodes,
  findSubroutine,
} from '../entrance-info/utils';
import { decodeTilesFromSpec } from '../spec';
import { DecodeTileOptions } from '../tiles/decode-tile';
import { GameLevelConstant, TilesDecodeSpec } from '../types';
import { readNonLevelEntranceInfo } from './common';
import {
  BackgroundAddresses,
  WorldMapInfo,
  NonLevelEntranceInfo,
} from './types';

const WORLD_TABLE_LENGTH = 0x34;

export const readWorldBackgroundInfo = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  entranceId: number,
): BackgroundAddresses => {
  const worldIndex = readWorldIndex(romData, levelConstant, entranceId);
  return readWorldBackgroundInfoFromWorldIndex(
    romData,
    levelConstant,
    worldIndex,
  );
};

const readWorldIndex = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  entranceId: number,
) => {
  // Ref: ASM Code at $80E20F
  // LDA $BCF44B,X
  let worldIndex = read16(
    romData,
    levelConstant.tables.worldIndex.getOffsetAddress(entranceId).pcAddress,
  );
  // AND #$00FF
  worldIndex &= 0x00ff;
  return worldIndex;
};

const readWorldBackgroundInfoFromWorldIndex = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  worldIndex: number,
): BackgroundAddresses => {
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
    paletteAddress: RomAddress.fromBankAndAbsolute(
      levelConstant.banks.terrainPalette,
      paletteAbsolute,
    ),
  };
};

export const buildSpecFromWorldBackgroundInfo = (
  worldBackgroundInfo: BackgroundAddresses,
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

export const readWorldMapInfo = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  entranceId: number,
): WorldMapInfo | undefined => {
  const nonLevelEntranceInfo = readNonLevelEntranceInfo(
    romData,
    levelConstant,
    entranceId,
  );
  if (nonLevelEntranceInfo?.type !== 'world-map') return undefined;

  const firstEntranceId = readWorldFirstEntranceId(
    romData,
    levelConstant,
    nonLevelEntranceInfo,
  );

  const worldIndex = readWorldIndex(romData, levelConstant, firstEntranceId);
  const worldIndices = [worldIndex];
  if (worldIndex !== 0) {
    if (worldIndex % 2 !== 0) worldIndices.push(worldIndex + 1);
    else worldIndices.push(worldIndex - 1);
  }

  const worldBackgroundInfos = worldIndices.map((w) =>
    readWorldBackgroundInfoFromWorldIndex(romData, levelConstant, w),
  );
  const backgroundSpecs: TilesDecodeSpec[] = worldBackgroundInfos.map((w) =>
    buildSpecFromWorldBackgroundInfo(w),
  );

  return {
    firstEntranceId,
    worldIndices,
    backgroundAddresses: worldBackgroundInfos,
    backgroundSpecs,
  };
};

const readWorldFirstEntranceId = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  nonLevelEntranceInfo: NonLevelEntranceInfo,
): number => {
  const opcodeEntries = readOpcodeUntil(
    romData,
    nonLevelEntranceInfo.branchAddress,
    undefined,
    {
      readLimit: 10,
    },
  );

  const loadWorldSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadWorld,
  );
  return findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadWorldSubroutine,
    'LDA',
  );
};

export const buildWorldMapImage = (
  romData: Uint8Array,
  worldMapInfo: WorldMapInfo,
  decodeTileOptions?: DecodeTileOptions,
): ImageMatrix => {
  const allMatrix = worldMapInfo.backgroundSpecs.map((spec) =>
    decodeTilesFromSpec(romData, spec, decodeTileOptions),
  );

  const width = allMatrix[0].width;
  const height = allMatrix[0].height;
  const imageMatrix = new Matrix<Color | null>(
    width * allMatrix.length,
    height,
    null,
  );

  for (let i = 0; i < allMatrix.length; i++) {
    const matrix = allMatrix[i];
    imageMatrix.setMatrixAt(width * i, 0, matrix);
  }
  return imageMatrix;
};
