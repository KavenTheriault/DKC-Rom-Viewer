import { GameLevelConstant, TilesDecodeSpec } from '../common/levels/types';
import { RomAddress } from '../rom/address';
import { BPP } from '../types/bpp';

export const Dkc1AnimationScriptBank = 0x3e0000;
export const Dkc1AnimationScriptTable = 0x8572;

export const Dkc1SpritePointerTable = 0x3bcc9c;

export const Dkc1EntityBank = 0xb50000;
export const Dkc1EntityPaletteBank = 0x3c0000;
export const Dkc1EntitiesStartReference = 0x856d;
export const Dkc1EntitiesEndReference = 0xfff7;

const CoralCapers = {
  entranceIndex: 0xbf,
  tilemapOffset: 0x8c00,
  tilemapLength: 0x1e00,
};
const ClamCity = {
  entranceIndex: 0xde,
  tilemapOffset: 0xaa00,
  tilemapLength: 0x1900,
};
const PoisonPond = {
  entranceIndex: 0x22,
  tilemapOffset: 0,
  tilemapLength: 0x3080,
};
const CroctopusChase = {
  entranceIndex: 0x3e,
  tilemapOffset: 0x3080,
  tilemapLength: 0x4400,
};
const EnguardedBonus = {
  entranceIndex: 0xa6,
  tilemapOffset: 0x7500,
  tilemapLength: 0x1700,
};
const SlipslideRide = {
  entranceIndex: 0x6d,
  tilemapOffset: 0x0400,
  tilemapLength: 0x2e00,
};

const IceCaves = {
  entrancesIndex: [0x62, 0xab, 0xc5, 0xc6, 0xc7, 0xc8, 0xca, 0xcb],
  tilemapLength: 0x3a00,
};
const Underwater = {
  entrancesIndex: [0x2a, 0x3f, 0xc0, 0xdf],
  tilemapLength: 0xc380,
};

export const Dkc1LevelConstant: GameLevelConstant = {
  address: {
    mainTileset: RomAddress.fromSnesAddress(0x7e79fc),
  },
  banks: {
    terrainPalette: 0xb9,
    loadEntrances: 0xb9,
    levelBounds: 0xbc,
  },
  pointerTables: {
    loadEntrances: 0x801e,
    levelBounds: 0x8000,
  },
  subroutines: {
    loadTerrainTilemap: RomAddress.fromSnesAddress(0x818c66),
    loadTerrainBackgroundTilemap: RomAddress.fromSnesAddress(0x818705),
    loadTilesetWithAddress: RomAddress.fromSnesAddress(0xb896fc),
    loadTilesetWithTerrainIndex: RomAddress.fromSnesAddress(0xb9a924),
    loadTerrainPalette: RomAddress.fromSnesAddress(0xb999f1),
    loadVramRegisters: RomAddress.fromSnesAddress(0xb9a4dc),
    loadEntrance: RomAddress.fromSnesAddress(0x80e870),
    loadWorld: RomAddress.fromSnesAddress(0x80e1f8),
  },
  tables: {
    levelsTilemapBank: RomAddress.fromSnesAddress(0x818b96),
    levelsTilemapOffset: RomAddress.fromSnesAddress(0x818b94),
    levelsTilemapVramAddress: RomAddress.fromSnesAddress(0x818be8),
    terrainTilemapBank: RomAddress.fromSnesAddress(0x818bc0),
    terrainTilemapPointer: RomAddress.fromSnesAddress(0x818bbe),
    terrainTilesetInfo: RomAddress.fromSnesAddress(0xb9a994),
    vramRegisters: RomAddress.fromSnesAddress(0xb9a50e),
    worldIndex: RomAddress.fromSnesAddress(0xbcf44b),
    worldAddresses: RomAddress.fromSnesAddress(0x80e176),
  },
  entrances: {
    correctedTilemapOffset: {
      [CoralCapers.entranceIndex]: CoralCapers.tilemapOffset,
      [ClamCity.entranceIndex]: ClamCity.tilemapOffset,
      [PoisonPond.entranceIndex]: PoisonPond.tilemapOffset,
      [CroctopusChase.entranceIndex]: CroctopusChase.tilemapOffset,
      [EnguardedBonus.entranceIndex]: EnguardedBonus.tilemapOffset,
      [SlipslideRide.entranceIndex]: SlipslideRide.tilemapOffset,
    },
    correctedTilemapLength: {
      [CoralCapers.entranceIndex]: CoralCapers.tilemapLength,
      [ClamCity.entranceIndex]: ClamCity.tilemapLength,
      [PoisonPond.entranceIndex]: PoisonPond.tilemapLength,
      [CroctopusChase.entranceIndex]: CroctopusChase.tilemapLength,
      [EnguardedBonus.entranceIndex]: EnguardedBonus.tilemapLength,
      [SlipslideRide.entranceIndex]: SlipslideRide.tilemapLength,
      ...IceCaves.entrancesIndex.reduce<Record<number, number>>((acc, e) => {
        acc[e] = IceCaves.tilemapLength;
        return acc;
      }, {}),
      ...Underwater.entrancesIndex.reduce<Record<number, number>>((acc, e) => {
        acc[e] = Underwater.tilemapLength;
        return acc;
      }, {}),
    },
    isVertical: [
      CoralCapers.entranceIndex,
      ClamCity.entranceIndex,
      PoisonPond.entranceIndex,
      CroctopusChase.entranceIndex,
      EnguardedBonus.entranceIndex,
      SlipslideRide.entranceIndex,
      ...IceCaves.entrancesIndex,
      ...Underwater.entrancesIndex,
    ],
  },
};
