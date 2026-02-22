import { bufferToString, toHexString } from '../../../../website/utils/hex';
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
  findOpcodeEntriesByName,
  findOpcodeEntryByAddress,
  findSubroutine,
  readOpcodeEntryArgument,
} from './utils';
import { readVramRegisters } from './vram-registers';

export const logOpcodeEntry = ({ opcode, bytes, address }: OpcodeEntry) => {
  console.log({
    name: opcode.name,
    opcode: opcode,
    bytes: bufferToString(bytes),
    address: address.toString(),
  });
};

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
  /*for (const opcodeEntry of opcodeEntries) {
    logOpcodeEntry(opcodeEntry);
  }*/

  const {
    levelsTilemapOffset,
    levelsTilemapBank,
    terrainTilemapAddress,
    levelTilemapVramAddress,
  } = readTerrainTypeMeta(romData, levelConstant, opcodeEntries);

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

  const loadTerrainBackgroundTilemapSubroutine = findOpcodeEntryByAddress(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainBackgroundTilemap,
  );

  let levelsTilemapBackgroundAddress: RomAddress | undefined = undefined;
  if (loadTerrainBackgroundTilemapSubroutine) {
    const index = opcodeEntries.indexOf(loadTerrainBackgroundTilemapSubroutine);
    const ldaOpcodes = findOpcodeEntriesByName(
      opcodeEntries.slice(Math.max(index - 6, 0), index).reverse(),
      'LDA',
    );

    if (ldaOpcodes.length > 0) {
      const backgroundTilemapConst = readOpcodeEntryArgument(ldaOpcodes[0]);
      const backgroundTilemapConst2 =
        ldaOpcodes.length > 1 ? readOpcodeEntryArgument(ldaOpcodes[1]) : 0;
      console.log(
        'backgroundTilemapConst:',
        toHexString(backgroundTilemapConst),
      );
      console.log(
        'backgroundTilemapConst2:',
        toHexString(backgroundTilemapConst2),
      );

      let temp = backgroundTilemapConst;
      // ADC #$0100
      temp += 0x0100;
      temp &= 0xffff;
      // AND #$FFE0
      temp &= 0xffe0;
      // ADC $D3 (levelsTilemapOffset)
      temp += levelsTilemapOffset;
      temp &= 0xffff;

      if (backgroundTilemapConst2 > 0) {
        let temp2 = backgroundTilemapConst2;
        // AND #$01E0
        temp2 &= 0x01e0;
        // LSR (x4)
        temp2 = temp2 >> 4;
        temp2 &= 0xffff;
        // ADC $4C
        temp += temp2;
        temp &= 0xffff;
      }

      // The value is always 0x20 before the real start
      temp += 0x20;
      temp &= 0xffff;

      levelsTilemapBackgroundAddress = RomAddress.fromBankAndAbsolute(
        levelsTilemapBank,
        temp,
      );

      console.log(
        'levelsTilemapBackgroundAddress:',
        toHexString(levelsTilemapBackgroundAddress.snesAddress),
      );
    }
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
    levelTilemapVramAddress,
    levelsTilemapBackgroundAddress,
    levelsTilemapStart,
    palettesAddress: terrainPalettesAddress,
    tilemapAddress: terrainTilemapAddress,
    tilesetsInfo,
    transfers: dmaTransfers,
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
