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
import { buildGraphicsInfo } from './graphic';
import { readTerrainTypeMeta } from './terrain-type';
import { readLevelTileMapInfo } from './tile-map';
import {
  findArgumentInPreviousOpcodes,
  findOpcodeEntryByAddress,
  findSubroutine,
} from './utils';
import { readVramRegisters } from './vram-registers';

/*
Terrain Graphics Data = Compressed data to form all terrain tile parts
Terrain Type Meta = How to stitch all terrain tile parts together
Level Tile Map = How to stitch all terrain tiles together
 */
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
  const {
    terrainMetaIndex,
    terrainTileOffset,
    terrainTypeMetaAddress,
    terrainTileMapBank,
  } = readTerrainTypeMeta(romData, levelConstant, opcodeEntries);

  const terrainTileMapAddress = RomAddress.fromBankAndAbsolute(
    terrainTileMapBank,
    terrainTileOffset,
  );

  const loadGraphicsSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadGraphicsWithTerrainIndex,
  );
  const terrainDataIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadGraphicsSubroutine,
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

  const graphicsInfo = buildGraphicsInfo(
    romData,
    levelConstant,
    dmaTransfers,
    opcodeEntries,
  );

  const { levelTileMapAddress, levelTileMapLength } = readLevelTileMapInfo(
    romData,
    levelConstant,
    entranceId,
    terrainTileMapBank,
    terrainTileOffset,
  );

  const terrainPalettesAddress = readTerrainPaletteAddress(
    levelConstant,
    opcodeEntries,
  );

  const backgroundRegisters = readVramRegisters(romData, opcodeEntries);

  const terrain: TerrainInfo = {
    metaIndex: terrainMetaIndex,
    metaAddress: terrainTypeMetaAddress,
    palettesAddress: terrainPalettesAddress,
    graphicsInfo: graphicsInfo,
    transfers: dmaTransfers,
    tileMapAddress: terrainTileMapAddress,
  };
  const level: LevelInfo = {
    tileMapAddress: levelTileMapAddress,
    tileMapOffset:
      levelConstant.entrances.correctedTileMapOffset[entranceId] ?? 0,
    tileMapLength:
      levelConstant.entrances.correctedTileMapLength[entranceId] ??
      levelTileMapLength,
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
