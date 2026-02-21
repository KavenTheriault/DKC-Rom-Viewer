import { toHexString } from '../../../../website/utils/hex';
import { read16, read24 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import {
  EntranceInfo,
  GameLevelConstant,
  LevelInfo,
  TerrainInfo,
} from '../types';
import { OpcodeEntry, readOpcodeUntil } from './asm/read';
import { readDmaTransfers } from './dma-transfers';
import { readTerrainTypeMeta } from './terrain-type';
import { readLevelTilemapInfo } from './tile-map';
import { buildTilesetsInfo } from './tileset';
import {
  findArgumentInPreviousOpcodes,
  findOpcodeEntryByAddress,
  findSubroutine,
} from './utils';
import { readVramRegisters } from './vram-registers';

export const loadEntranceInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  entranceId: number,
): EntranceInfo => {
  const opcodeEntries = readLoadEntranceOpcodes(
    romData,
    levelConstant,
    entranceId,
  );
  const { levelsTilemapOffset, levelsTilemapBank, terrainTilemapAddress } =
    readTerrainTypeMeta(romData, levelConstant, opcodeEntries);

  const levelsTilemapStart = RomAddress.fromBankAndAbsolute(
    levelsTilemapBank,
    levelsTilemapOffset,
  );

  const loadTilesetSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadTilesetWithTerrainIndex,
  );
  const terrainDataIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadTilesetSubroutine,
    'LDA',
  );
  const dmaTransfers = readDmaTransfers(
    romData,
    levelConstant,
    terrainDataIndex,
  );
  for (const test of dmaTransfers) {
    console.log('dmaTransfers:', test.origin.toString());
    console.log('dmaTransfers length', toHexString(test.length));
    console.log('dmaTransfers destination', toHexString(test.destination));
    console.log('dmaTransfers isCompressed', test.isCompressed);
  }

  const tilesetsInfo = buildTilesetsInfo(
    romData,
    levelConstant,
    dmaTransfers,
    opcodeEntries,
  );

  const { levelTilemapAddress, levelTilemapLength } = readLevelTilemapInfo(
    romData,
    levelConstant,
    entranceId,
    levelsTilemapBank,
    levelsTilemapOffset,
  );

  const terrainPalettesAddress = readTerrainPaletteAddress(
    levelConstant,
    opcodeEntries,
  );

  const backgroundRegisters = readVramRegisters(romData, opcodeEntries);

  const terrain: TerrainInfo = {
    tilemapAddress: terrainTilemapAddress,
    palettesAddress: terrainPalettesAddress,
    tilesetsInfo: tilesetsInfo,
    transfers: dmaTransfers,
    levelsTilemapStart: levelsTilemapStart,
  };
  const level: LevelInfo = {
    tilemapAddress: levelTilemapAddress,
    tilemapOffset:
      levelConstant.entrances.correctedTilemapOffset[entranceId] ?? 0,
    tilemapLength:
      levelConstant.entrances.correctedTilemapLength[entranceId] ??
      levelTilemapLength,
    isVertical: levelConstant.entrances.isVertical.includes(entranceId),
  };
  return { terrain, level, backgroundRegisters };
};

const readLoadEntranceOpcodes = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  entranceId: number,
) => {
  // Ref: ASM Code at $B98009
  const entranceOffset = entranceId * 2;
  const loadEntrancePointerAddress = RomAddress.fromBankAndAbsolute(
    levelConstant.banks.loadEntrances,
    levelConstant.pointerTables.loadEntrances,
  ).getOffsetAddress(entranceOffset);

  const absoluteAddress = read16(romData, loadEntrancePointerAddress.pcAddress);
  return readOpcodeUntil(
    romData,
    RomAddress.fromBankAndAbsolute(
      levelConstant.banks.loadEntrances,
      absoluteAddress,
    ),
  );
};

const readTerrainPaletteAddress = (
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
) => {
  const loadTerrainPaletteSubroutine = findOpcodeEntryByAddress(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainPalette,
  );

  if (!loadTerrainPaletteSubroutine) {
    const terrainPaletteAddress = findTerrainPaletteAddressInReadOpcodes(
      levelConstant,
      opcodeEntries,
    );
    if (terrainPaletteAddress) return terrainPaletteAddress;

    throw new Error('Terrain palette address not found');
  }

  const paletteAbsoluteAddress = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadTerrainPaletteSubroutine,
    'LDA',
  );
  return RomAddress.fromBankAndAbsolute(
    levelConstant.banks.terrainPalette,
    paletteAbsoluteAddress,
  );
};

/*
 * Searches for an LDA opcode using 24-bit addressing (3 bytes) that reads from the terrain palette bank,
 * then converts the SNES address to a ROM address.
 */
const findTerrainPaletteAddressInReadOpcodes = (
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
) => {
  const readLongOpcodeEntries = opcodeEntries.find(
    (o) =>
      o.opcode.name.includes('LDA') &&
      o.bytes.length === 3 &&
      o.bytes[2] === levelConstant.banks.terrainPalette,
  );
  if (!readLongOpcodeEntries) return undefined;

  const snesAddress = read24(readLongOpcodeEntries.bytes, 0);
  return RomAddress.fromSnesAddress(snesAddress);
};
