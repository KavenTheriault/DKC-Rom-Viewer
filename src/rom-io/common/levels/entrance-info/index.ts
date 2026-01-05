import { read16 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { OpcodeEntry, readOpcodeUntil } from './asm/read';
import { EntranceInfo, GameLevelConstant } from '../types';
import { readGraphicsInfo } from './graphic';
import { readTerrainTypeMeta } from './terrain-type';
import { readLevelTileMapInfo } from './tile-map';
import { findArgumentInPreviousOpcodes, findSubroutine } from './utils';

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
    levelTileMapAddress: levelTileMapAddress,
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
  const loadTerrainPaletteSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainPalette,
  );
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
