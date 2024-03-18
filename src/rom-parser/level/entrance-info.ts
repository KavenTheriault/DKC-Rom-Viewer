import { RomAddress } from '../types/address';
import { read16, read24, read8 } from '../utils/buffer';
import { logOpcodeEntry, OpcodeEntry, readOpcodeUntil } from '../asm/read';
import { toHexString } from '../../utils/hex';
import { MainGraphicAddress, readDmaTransfers } from './dma-transfers';

/*
Terrain Graphics Data = Compressed data to form all terrain tile parts
Terrain Type Meta = How to stitch all terrain tile parts together
Level Tile Map = How to stitch all terrain tiles together
 */

export type GraphicInfo = {
  address: RomAddress;
  isCompressed: boolean;
  length: number;
  offset: number;
  placeAt: number;
};

export type EntranceInfo = {
  // Internal index used to load meta
  terrainMetaIndex: number;

  // Terrain
  terrainTypeMetaAddress: RomAddress;
  terrainPalettesAddress: RomAddress;
  terrainGraphicsInfo: GraphicInfo[];

  // Level
  levelTileMapAddress: RomAddress;
  levelTileMapLength: number;

  isVertical: boolean;
};

export const entranceInfoToString = (entranceInfo: EntranceInfo) => {
  const lines = [];
  lines.push(`terrainMetaIndex: ${toHexString(entranceInfo.terrainMetaIndex)}`);
  lines.push(
    `terrainTypeMetaAddress: ${entranceInfo.terrainTypeMetaAddress.toString()}`,
  );
  lines.push(
    `levelTileMapAddress: ${entranceInfo.levelTileMapAddress.toString()}`,
  );
  lines.push(
    `levelTileMapLength: ${toHexString(entranceInfo.levelTileMapLength)}`,
  );
  lines.push(
    `terrainPalettesAddress: ${entranceInfo.terrainPalettesAddress.toString()}`,
  );
  for (const graphicInfo of entranceInfo.terrainGraphicsInfo) {
    lines.push(`graphicInfo: ${graphicInfo.address.toString()}`);
  }
  lines.push(`isVertical: ${entranceInfo.isVertical}`);
  return lines.join('\n');
};

const LoadEntrancesBank = 0xb9;
const LoadEntrancesPointerTable = 0x801e;

// Subroutines
const LoadTerrainMetaSubroutineAddress = RomAddress.fromSnesAddress(0x818c66);
const LoadGraphicsWithAddressSubroutine = RomAddress.fromSnesAddress(0xb896fc);
const LoadGraphicsWithTerrainIndexSubroutine =
  RomAddress.fromSnesAddress(0xb9a924);
const LoadTerrainPaletteSubroutineAddress =
  RomAddress.fromSnesAddress(0xb999f1);

const TerrainMetaPointerTable = RomAddress.fromSnesAddress(0x818bbe);
const TerrainMetaTileOffsetTable = RomAddress.fromSnesAddress(0x818b94);
const TerrainMetaBankTable = RomAddress.fromSnesAddress(0x818b96);

const TerrainPaletteBank = 0xb9;

const LevelBoundsBank = 0xbc;
const LevelBoundsPointerTable = 0x8000;

const SCREEN_WIDTH = 0x100;

export const loadEntranceInfo = (
  romData: Buffer,
  entranceId: number,
): EntranceInfo => {
  const opcodeEntries = readLoadEntranceOpcodes(romData, entranceId);

  const { terrainMetaIndex, terrainTileOffset, terrainTypeMetaAddress } =
    readTerrainTypeMeta(romData, opcodeEntries);

  const graphicsInfo = readGraphicsInfo(romData, opcodeEntries);

  const { levelTileMapAddress, levelTileMapLength } = readLevelTileMapInfo(
    romData,
    entranceId,
    terrainTypeMetaAddress.bank,
    terrainTileOffset,
  );

  const loadTerrainPaletteSubroutine = findSubroutine(
    opcodeEntries,
    LoadTerrainPaletteSubroutineAddress,
  );
  const terrainPalettesAddress = readTerrainPaletteAddress(
    opcodeEntries,
    loadTerrainPaletteSubroutine,
  );

  const isVertical = isLevelVertical(
    opcodeEntries,
    loadTerrainPaletteSubroutine,
  );

  return {
    terrainMetaIndex: terrainMetaIndex,
    terrainTypeMetaAddress: terrainTypeMetaAddress,
    terrainPalettesAddress: terrainPalettesAddress,
    terrainGraphicsInfo: graphicsInfo,
    levelTileMapAddress: levelTileMapAddress,
    levelTileMapLength: levelTileMapLength,
    isVertical: isVertical,
  };
};

const readLoadEntranceOpcodes = (romData: Buffer, entranceId: number) => {
  // Ref: ASM Code at $B98009
  const entranceOffset = entranceId * 2;
  const loadEntrancePointerAddress = RomAddress.fromBankAndAbsolute(
    LoadEntrancesBank,
    LoadEntrancesPointerTable,
  ).getOffsetAddress(entranceOffset);

  const absoluteAddress = read16(romData, loadEntrancePointerAddress.pcAddress);
  return readOpcodeUntil(
    romData,
    RomAddress.fromBankAndAbsolute(LoadEntrancesBank, absoluteAddress),
  );
};

const readTerrainTypeMeta = (romData: Buffer, opcodeEntries: OpcodeEntry[]) => {
  const loadTerrainMetaSubroutine = findSubroutine(
    opcodeEntries,
    LoadTerrainMetaSubroutineAddress,
  );
  const terrainMetaIndex = findSubroutineArgument(
    opcodeEntries,
    loadTerrainMetaSubroutine,
    'LDA',
  );

  // Ref: ASM Code at $818C66
  const metaTableOffset = terrainMetaIndex * 3;

  const terrainTileOffset = read16(
    romData,
    TerrainMetaTileOffsetTable.getOffsetAddress(metaTableOffset).pcAddress,
  );
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
  return { terrainMetaIndex, terrainTileOffset, terrainTypeMetaAddress };
};

const readGraphicsInfo = (
  romData: Buffer,
  opcodeEntries: OpcodeEntry[],
): GraphicInfo[] => {
  const loadGraphicsSubroutine = findSubroutine(
    opcodeEntries,
    LoadGraphicsWithTerrainIndexSubroutine,
  );
  const terrainDataIndex = findSubroutineArgument(
    opcodeEntries,
    loadGraphicsSubroutine,
    'LDA',
  );
  const readDmaTransfersResult = readDmaTransfers(romData, terrainDataIndex);
  let mainGraphicAddress = readDmaTransfersResult.compressedGraphicAddress;

  /* Some level use this subroutine with bank and address as "argument"
     Only used by Temple terrain type. For example: ADM code $B98D06 */
  if (!mainGraphicAddress) {
    const loadTerrainDataSubroutine = findOpcodeEntryByAddress(
      opcodeEntries,
      LoadGraphicsWithAddressSubroutine,
    );
    if (!loadTerrainDataSubroutine) {
      throw new Error(
        `Subroutine not found (${LoadGraphicsWithAddressSubroutine.toString()})`,
      );
    }

    const subroutineIndex = opcodeEntries.indexOf(loadTerrainDataSubroutine);
    const bank = readOpcodeEntryArgument(opcodeEntries[subroutineIndex - 2]);
    const absolute = readOpcodeEntryArgument(
      opcodeEntries[subroutineIndex - 3],
    );

    mainGraphicAddress = RomAddress.fromBankAndAbsolute(bank, absolute);
  }

  return readDmaTransfersResult.dmaTransfers.map((dmaTransfer) => {
    const isMainGraphic = dmaTransfer.origin.bank === MainGraphicAddress.bank;
    const offset = isMainGraphic
      ? dmaTransfer.origin.snesAddress - MainGraphicAddress.snesAddress
      : 0;

    return {
      address: isMainGraphic
        ? mainGraphicAddress!.getOffsetAddress(offset)
        : dmaTransfer.origin,
      isCompressed: isMainGraphic,
      offset: offset,
      length: dmaTransfer.length,
      /* PPU destination are starting at 0x2000
         PPU is a 16 bits storage, must multiply by 2 */
      placeAt: (dmaTransfer.destination - 0x2000) * 2,
    };
  });
};

const readLevelTileMapInfo = (
  romData: Buffer,
  entranceId: number,
  levelTileMapBank: number,
  terrainTileOffset: number,
) => {
  // Level Tile Maps are in the same bank as the Terrain Type Meta
  const { levelXStart, levelXEnd } = readLevelBounds(romData, entranceId);
  const levelTileMapAddress = RomAddress.fromBankAndAbsolute(
    levelTileMapBank,
    levelXStart + terrainTileOffset,
  );
  const levelTileMapLength = levelXEnd - levelXStart;

  return { levelTileMapAddress, levelTileMapLength };
};

const readLevelBounds = (romData: Buffer, entranceId: number) => {
  // Ref: ASM Code at $FCB052
  const levelOffset = entranceId * 2;
  const boundsIndex =
    read16(
      romData,
      RomAddress.fromBankAndAbsolute(LevelBoundsBank, LevelBoundsPointerTable)
        .pcAddress + levelOffset,
    ) - 4;

  const levelXStart = read16(
    romData,
    RomAddress.fromBankAndAbsolute(LevelBoundsBank, boundsIndex).pcAddress,
  );
  let levelXEnd = read16(
    romData,
    RomAddress.fromBankAndAbsolute(LevelBoundsBank, boundsIndex + 2).pcAddress,
  );

  // End bound is from the left side of the screen
  levelXEnd += SCREEN_WIDTH;

  return { levelXStart, levelXEnd };
};

const readTerrainPaletteAddress = (
  opcodeEntries: OpcodeEntry[],
  loadTerrainPaletteSubroutine: OpcodeEntry,
) => {
  const paletteAbsoluteAddress = findSubroutineArgument(
    opcodeEntries,
    loadTerrainPaletteSubroutine,
    'LDA',
  );
  return RomAddress.fromBankAndAbsolute(
    TerrainPaletteBank,
    paletteAbsoluteAddress,
  );
};

const isLevelVertical = (
  opcodeEntries: OpcodeEntry[],
  loadTerrainPaletteSubroutine: OpcodeEntry,
) => {
  const xArgument = findSubroutineArgument(
    opcodeEntries,
    loadTerrainPaletteSubroutine,
    'LDX',
  );
  // Discovered that vertical level use this value here
  return xArgument === 0x40;
};

const findOpcodeEntryByAddress = (
  opcodeEntries: OpcodeEntry[],
  address: RomAddress,
) => opcodeEntries.find((o) => o.address.snesAddress === address.snesAddress);

const findOpcodeEntryByName = (opcodeEntries: OpcodeEntry[], name: string) =>
  opcodeEntries.find((o) => o.opcode.name.includes(name));

const readOpcodeEntryArgument = (opcodeEntry: OpcodeEntry) => {
  if (opcodeEntry.bytes.length === 1) return read8(opcodeEntry.bytes, 0);
  if (opcodeEntry.bytes.length === 2) return read16(opcodeEntry.bytes, 0);
  if (opcodeEntry.bytes.length === 3) return read24(opcodeEntry.bytes, 0);
  throw Error(
    `Unsupported number of bytes to read argument (${opcodeEntry.opcode.name})`,
  );
};

const findSubroutine = (
  opcodeEntries: OpcodeEntry[],
  subroutineAddress: RomAddress,
): OpcodeEntry => {
  const subroutine = findOpcodeEntryByAddress(opcodeEntries, subroutineAddress);
  if (!subroutine) {
    throw new Error(`Subroutine not found (${subroutineAddress.toString()})`);
  }
  return subroutine;
};

const findSubroutineArgument = (
  opcodeEntries: OpcodeEntry[],
  subroutineOpcode: OpcodeEntry,
  argumentOpcode: string,
): number => {
  const previousOpcodesToSearch = 4;
  const subroutineIndex = opcodeEntries.indexOf(subroutineOpcode);
  const argument = findOpcodeEntryByName(
    opcodeEntries
      .slice(subroutineIndex - previousOpcodesToSearch, subroutineIndex)
      .reverse(),
    argumentOpcode,
  );

  if (!argument) {
    throw new Error(`Can't find subroutine argument (${argumentOpcode})`);
  }

  return readOpcodeEntryArgument(argument);
};
