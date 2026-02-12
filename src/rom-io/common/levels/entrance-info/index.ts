import { toHexString } from '../../../../website/utils/hex';
import { read16, read24 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { EntranceInfo, GameLevelConstant } from '../types';
import { OpcodeEntry, readOpcodeUntil } from './asm/read';
import { readGraphicsInfo } from './graphic';
import { readTerrainTypeMeta } from './terrain-type';
import { readLevelTileMapInfo } from './tile-map';
import {
  findArgumentInPreviousOpcodes,
  findOpcodeEntryByAddress,
} from './utils';

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
  console.log(
    'terrainTileMapAddress:',
    toHexString(terrainTileMapAddress.snesAddress),
  );

  const graphicsInfo = readGraphicsInfo(romData, levelConstant, opcodeEntries);

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

  return {
    terrainMetaIndex: terrainMetaIndex,
    terrainTypeMetaAddress: terrainTypeMetaAddress,
    terrainPalettesAddress: terrainPalettesAddress,
    terrainGraphicsInfo: graphicsInfo,
    terrainTileMapAddress,
    levelTileMapAddress: levelTileMapAddress,
    levelTileMapOffset:
      levelConstant.entrances.correctedTileMapOffset[entranceId] ?? 0,
    levelTileMapLength:
      levelConstant.entrances.correctedTileMapLength[entranceId] ??
      levelTileMapLength,
    isVertical: levelConstant.entrances.isVertical.includes(entranceId),
  };
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
