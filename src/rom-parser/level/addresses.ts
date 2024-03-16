import { RomAddress } from '../types/address';
import { read16, read24, read8 } from '../utils/buffer';
import { OpcodeEntry, readOpcodeUntil } from '../asm/read';
import { toHexString } from '../../utils/hex';

/*
Terrain Type Data = Compressed data to form all terrain tile parts
Terrain Type Meta = How to stitch all terrain tile parts together
Level Tile Map = How to stitch all terrain tiles together
 */

export type EntranceInfo = {
  // Internal index used to load meta
  terrainMetaIndex: number;
  // Internal index used to load data
  terrainDataIndex: number;

  // Terrain
  terrainTypeMetaAddress: RomAddress;
  terrainTypeDataAddress: RomAddress;
  terrainPalettesAddress: RomAddress;

  // Level
  levelTileMapAddress: RomAddress;
  levelTileMapLength: number;
};

export const entranceInfoToString = (entranceInfo: EntranceInfo) => {
  const lines = [];
  lines.push(`terrainMetaIndex: ${toHexString(entranceInfo.terrainMetaIndex)}`);
  lines.push(`terrainDataIndex: ${toHexString(entranceInfo.terrainDataIndex)}`);
  lines.push(
    `terrainTypeMetaAddress: ${entranceInfo.terrainTypeMetaAddress.toString()}`,
  );
  lines.push(
    `terrainTypeDataAddress: ${entranceInfo.terrainTypeDataAddress.toString()}`,
  );
  lines.push(
    `levelTileMapAddress: ${entranceInfo.levelTileMapAddress.toString()}`,
  );
  return lines.join('\n');
};

const LoadEntrancesBank = RomAddress.fromSnesAddress(0xb90000);
const LoadEntrancesPointerTable = 0x801e;

// Subroutines
const LoadTerrainMetaSubroutineAddress = RomAddress.fromSnesAddress(0x818c66);
const LoadTerrainDataSubroutine1Address = RomAddress.fromSnesAddress(0xb896fc);
const LoadTerrainDataSubroutine2Address = RomAddress.fromSnesAddress(0xb9a924);

const TerrainMetaPointerTable = RomAddress.fromSnesAddress(0x818bbe);
const TerrainMetaBankTable = RomAddress.fromSnesAddress(0x818b96);

const TerrainDataPointerTable = RomAddress.fromSnesAddress(0xb9a994);

const LevelBoundsBank = RomAddress.fromSnesAddress(0xbc0000);
const LevelBoundsPointerTable = 0x8000;

const SCREEN_WIDTH = 0x100;

export const loadEntranceInfo = (
  romData: Buffer,
  entranceId: number,
): EntranceInfo => {
  const opcodeEntries = readLoadEntranceOpcodes(romData, entranceId);

  const { terrainMetaIndex, terrainTypeMetaAddress } =
    readTerrainTypeMetaAddress(romData, opcodeEntries);

  const { terrainDataIndex, terrainTypeDataAddress } =
    readTerrainTypeDataAddress(romData, opcodeEntries);

  // Level Tile Maps are in the same bank as the Terrain Type Meta
  const levelTileMapBank = terrainTypeMetaAddress.bank;
  const { levelXStart, levelXEnd } = readLevelBounds(romData, entranceId);
  const levelTileMapAddress = RomAddress.fromBankAndAbsolute(
    levelTileMapBank,
    levelXStart,
  );

  return {
    terrainMetaIndex: terrainMetaIndex,
    terrainDataIndex: terrainDataIndex,
    terrainTypeMetaAddress: terrainTypeMetaAddress,
    terrainTypeDataAddress: terrainTypeDataAddress,
    terrainPalettesAddress: RomAddress.fromSnesAddress(0),
    levelTileMapAddress: levelTileMapAddress,
    levelTileMapLength: levelXEnd - levelXStart,
  };
};

const readLoadEntranceOpcodes = (romData: Buffer, entranceId: number) => {
  // Ref: ASM Code at $B98009
  const entranceOffset = entranceId * 2;
  const loadEntrancePointerAddress = LoadEntrancesBank.getOffsetAddress(
    LoadEntrancesPointerTable + entranceOffset,
  );

  const absoluteAddress = read16(romData, loadEntrancePointerAddress.pcAddress);
  return readOpcodeUntil(
    romData,
    LoadEntrancesBank.getOffsetAddress(absoluteAddress),
  );
};

const readTerrainTypeMetaAddress = (
  romData: Buffer,
  opcodeEntries: OpcodeEntry[],
) => {
  const terrainMetaIndex = findSubroutineArgument(
    opcodeEntries,
    LoadTerrainMetaSubroutineAddress,
  );

  // Ref: ASM Code at $818C66
  const metaTableOffset = terrainMetaIndex * 3;
  const terrainMetaAbsolute = read16(
    romData,
    TerrainMetaPointerTable.getOffsetAddress(metaTableOffset).pcAddress,
  );
  const terrainMetaBank = read8(
    romData,
    TerrainMetaBankTable.getOffsetAddress(metaTableOffset).pcAddress,
  );

  const terrainTypeMetaAddress = RomAddress.fromBankAndAbsolute(
    terrainMetaBank,
    terrainMetaAbsolute,
  );
  return { terrainMetaIndex, terrainTypeMetaAddress };
};

const readTerrainTypeDataAddress = (
  romData: Buffer,
  opcodeEntries: OpcodeEntry[],
) => {
  const loadTerrainDataSubroutine = findOpcodeEntryByAddress(
    opcodeEntries,
    LoadTerrainDataSubroutine1Address,
  );

  /* Some level use this subroutine with bank and address as "argument"
     Only use by Temple terrain type. For example: ADM code $B98D06 */
  if (loadTerrainDataSubroutine) {
    const subroutineIndex = opcodeEntries.indexOf(loadTerrainDataSubroutine);
    const bank = readOpcodeEntryArgument(opcodeEntries[subroutineIndex - 2]);
    const absolute = readOpcodeEntryArgument(
      opcodeEntries[subroutineIndex - 3],
    );
    return {
      terrainDataIndex: -1,
      terrainTypeDataAddress: RomAddress.fromBankAndAbsolute(bank, absolute),
    };
  }

  const terrainDataIndex = findSubroutineArgument(
    opcodeEntries,
    LoadTerrainDataSubroutine2Address,
  );

  const dataTableOffset = getTerrainDataTableOffset(romData, terrainDataIndex);
  const terrainDataAbsolute = read16(
    romData,
    TerrainDataPointerTable.getOffsetAddress(dataTableOffset + 1).pcAddress,
  );
  const terrainDataBank = read8(
    romData,
    TerrainDataPointerTable.getOffsetAddress(dataTableOffset).pcAddress,
  );
  const terrainTypeDataAddress = RomAddress.fromBankAndAbsolute(
    terrainDataBank,
    terrainDataAbsolute,
  );
  return { terrainDataIndex, terrainTypeDataAddress };
};

const getTerrainDataTableOffset = (
  romData: Buffer,
  terrainDataIndex: number,
) => {
  // Ref: ASM Code at $B9A924
  let dataTableOffset = read16(
    romData,
    TerrainDataPointerTable.getOffsetAddress(terrainDataIndex * 2).pcAddress,
  );

  // Add 7 to offset until ($a998 + offset) is negative (> $7F)
  const compareAddress = TerrainDataPointerTable.getOffsetAddress(4);
  while (
    read8(romData, compareAddress.getOffsetAddress(dataTableOffset).pcAddress) <
    0x80
  ) {
    dataTableOffset += 0x7;
  }

  return dataTableOffset;
};

export const readLevelBounds = (romData: Buffer, entranceId: number) => {
  // Ref: ASM Code at $FCB052
  const levelOffset = entranceId << 1;
  const boundsIndex =
    read16(
      romData,
      RomAddress.fromBankAndAbsolute(
        LevelBoundsBank.bank,
        LevelBoundsPointerTable,
      ).pcAddress + levelOffset,
    ) - 4;

  const levelXStart = read16(romData, LevelBoundsBank.pcAddress + boundsIndex);
  let levelXEnd = read16(romData, LevelBoundsBank.pcAddress + boundsIndex + 2);

  // End bound is from the left side of the screen
  levelXEnd += SCREEN_WIDTH;

  return { levelXStart, levelXEnd };
};

const findOpcodeEntryByAddress = (
  opcodeEntries: OpcodeEntry[],
  address: RomAddress,
) => opcodeEntries.find((o) => o.address.snesAddress === address.snesAddress);

const readOpcodeEntryArgument = (opcodeEntry: OpcodeEntry) => {
  if (opcodeEntry.bytes.length === 1) return read8(opcodeEntry.bytes, 0);
  if (opcodeEntry.bytes.length === 2) return read16(opcodeEntry.bytes, 0);
  if (opcodeEntry.bytes.length === 3) return read24(opcodeEntry.bytes, 0);
  throw Error(
    `Unsupported number of bytes to read argument (${opcodeEntry.opcode.name})`,
  );
};

const findSubroutineArgument = (
  opcodeEntries: OpcodeEntry[],
  subroutineAddress: RomAddress,
): number => {
  const subroutine = findOpcodeEntryByAddress(opcodeEntries, subroutineAddress);
  if (!subroutine) {
    throw new Error(`Subroutine not found (${subroutineAddress.toString()})`);
  }
  /* I name it "Argument" but it's the LDA, LDX, or LDY opcode called just before calling the subroutine
     It's 2 opcodes before the actual subroutine start (1 before is the jump opcode itself) */
  const argument = opcodeEntries.indexOf(subroutine) - 2;
  return readOpcodeEntryArgument(opcodeEntries[argument]);
};
