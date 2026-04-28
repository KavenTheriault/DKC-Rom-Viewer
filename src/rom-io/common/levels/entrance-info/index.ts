import { read16, read24 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { Buffer } from '../../../types/buffer';
import {
  EntranceInfo,
  GameLevelConstant,
  LevelInfo,
  TerrainInfo,
} from '../types';
import { OpcodeEntry, readOpcodeUntil } from './asm/read';
import { readLevelsTilemapBackgroundAbsolute } from './background';
import { readDmaTransfers } from './dma-transfers';
import { buildLayersInfo } from './layers-info';
import { readTerrainTilemapInfo } from './terrain-type';
import { readLevelBounds } from './tile-map';
import { buildTilesetsInfo } from './tileset';
import {
  findArgumentInPreviousOpcodes,
  findOpcodeEntryByAddress,
  findSubroutine,
} from './utils';

export const loadEntranceInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  entranceId: number,
): EntranceInfo | undefined => {
  const opcodeEntries = readLoadEntranceOpcodes(
    romData,
    levelConstant,
    entranceId,
  );

  const terrainTilemapInfo = readTerrainTilemapInfo(
    romData,
    levelConstant,
    opcodeEntries,
  );
  if (!terrainTilemapInfo) return undefined;
  const {
    levelsTilemapOffset,
    levelsTilemapBank,
    terrainTilemapAddress,
    levelsTilemapVramAddress,
  } = terrainTilemapInfo;

  const levelsTilemapAddress = RomAddress.fromBankAndAbsolute(
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

  const levelsTilemapBackgroundAbsolute = readLevelsTilemapBackgroundAbsolute(
    levelConstant,
    opcodeEntries,
    levelsTilemapOffset,
  );
  const levelsTilemapBackgroundAddress =
    levelsTilemapBackgroundAbsolute !== null
      ? RomAddress.fromBankAndAbsolute(
          levelsTilemapBank,
          levelsTilemapBackgroundAbsolute,
        )
      : undefined;

  const tilesetsInfo = buildTilesetsInfo(
    romData,
    levelConstant,
    dmaTransfers,
    opcodeEntries,
  );

  const { levelXStart, levelXEnd } = readLevelBounds(
    romData,
    levelConstant,
    entranceId,
  );
  const levelLength = levelXEnd - levelXStart;

  const palettesAddress = readTerrainPaletteAddress(
    levelConstant,
    opcodeEntries,
  );

  const terrain: TerrainInfo = {
    levelsTilemapVramAddress,
    levelsTilemapBackgroundAddress,
    levelsTilemapAddress,
    palettesAddress,
    tilemapAddress: terrainTilemapAddress,
    tilesetsInfo,
    dmaTransfers,
  };
  const level: LevelInfo = {
    tilemapOffset:
      levelConstant.entrances.correctedTilemapOffset[entranceId] ?? levelXStart,
    tilemapLength:
      levelConstant.entrances.correctedTilemapLength[entranceId] ?? levelLength,
    isVertical: levelConstant.entrances.isVertical.includes(entranceId),
  };
  const layers = buildLayersInfo(
    romData,
    levelConstant,
    opcodeEntries,
    terrain,
  );

  return { terrain, level, layers };
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
