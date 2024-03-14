import { RomAddress } from '../types/address';
import { read16 } from '../utils/buffer';
import { readOpcodeUntil } from '../asm/read';

/*
Terrain Type Data = Compressed data to form all terrain tile parts
Terrain Type Meta = How to stitch all terrain tile parts together
Level Tile Map = How to stitch all terrain tiles together
 */

export type EntranceInfo = {
  // Internal index used to load data
  terrainDataIndex: number;
  // Internal index used to load meta
  terrainMetaIndex: number;

  // Terrain
  terrainTypeDataAddress: RomAddress;
  terrainTypeMetaAddress: RomAddress;
  terrainPalettesAddress: RomAddress;

  // Level
  levelTileMapAddress: RomAddress;
};

const LoadEntrancesBank = RomAddress.fromSnesAddress(0xb90000);
const LoadEntrancesPointerTable = 0x801e;

const LoadTerrainMetaSubroutineAddress = RomAddress.fromSnesAddress(0x818c66);

// Ref: ASM Code at $B98009
export const loadTerrainMetaIndex = (romData: Buffer, entranceId: number) => {
  const entranceOffset = entranceId * 2;
  const loadEntrancePointerAddress = LoadEntrancesBank.getOffsetAddress(
    LoadEntrancesPointerTable + entranceOffset,
  );

  const absoluteAddress = read16(romData, loadEntrancePointerAddress.pcAddress);
  const opcodeEntries = readOpcodeUntil(
    romData,
    LoadEntrancesBank.getOffsetAddress(absoluteAddress),
  );

  for (let i = 0; i < opcodeEntries.length; i++) {
    const entry = opcodeEntries[i];

    if (
      entry.address.snesAddress === LoadTerrainMetaSubroutineAddress.snesAddress
    ) {
      const setMetaIndexEntry = opcodeEntries[i - 2];
      return read16(setMetaIndexEntry.bytes, 0);
    }
  }

  throw new Error('Meta Index not found');
};
