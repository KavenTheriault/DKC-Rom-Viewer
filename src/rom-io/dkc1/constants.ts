import { GameLevelConstant } from '../common/levels/types';
import { RomAddress } from '../rom/address';

export const Dkc1AnimationScriptBank = 0x3e0000;
export const Dkc1AnimationScriptTable = 0x8572;

export const Dkc1SpritePointerTable = 0x3bcc9c;

export const Dkc1EntityBank = 0xb50000;
export const Dkc1EntityPaletteBank = 0x3c0000;
export const Dkc1EntitiesStartReference = 0x856d;
export const Dkc1EntitiesEndReference = 0xfff7;

const CoralCapers = {
  entranceIndex: 0xbf,
  tileMapOffset: 0x8c00,
  tileMapLength: 0x1e00,
};
const ClamCity = {
  entranceIndex: 0xde,
  tileMapOffset: 0xaa00,
  tileMapLength: 0x1900,
};
const PoisonPond = {
  entranceIndex: 0x22,
  tileMapOffset: 0,
  tileMapLength: 0x3080,
};
const CroctopusChase = {
  entranceIndex: 0x3e,
  tileMapOffset: 0x3080,
  tileMapLength: 0x4400,
};
const SlipslideRide = {
  entranceIndex: 0x6d,
  tileMapOffset: 0x0400,
  tileMapLength: 0x2e00,
};

const IceCaves = {
  entrancesIndex: [0x62, 0xab, 0xc5, 0xc6, 0xc7, 0xc8, 0xca, 0xcb],
  tileMapLength: 0x3a00,
};
const Underwater = {
  entrancesIndex: [0x2a, 0x3f, 0xc0, 0xdf],
  tileMapLength: 0xc380,
};

export const Dkc1LevelConstant: GameLevelConstant = {
  address: {
    mainGraphic: RomAddress.fromSnesAddress(0x7e79fc),
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
    loadTerrainMeta: RomAddress.fromSnesAddress(0x818c66),
    loadGraphicsWithAddress: RomAddress.fromSnesAddress(0xb896fc),
    loadGraphicsWithTerrainIndex: RomAddress.fromSnesAddress(0xb9a924),
    loadTerrainPalette: RomAddress.fromSnesAddress(0xb999f1),
  },
  tables: {
    terrainMetaPointer: RomAddress.fromSnesAddress(0x818bbe),
    terrainMetaTileOffset: RomAddress.fromSnesAddress(0x818b94),
    terrainMetaBank: RomAddress.fromSnesAddress(0x818bc0),
    terrainTileMapBank: RomAddress.fromSnesAddress(0x818b96),
    terrainGraphicsInfo: RomAddress.fromSnesAddress(0xb9a994),
  },
  entrances: {
    correctedTileMapOffset: {
      [CoralCapers.entranceIndex]: CoralCapers.tileMapOffset,
      [ClamCity.entranceIndex]: ClamCity.tileMapOffset,
      [PoisonPond.entranceIndex]: PoisonPond.tileMapOffset,
      [CroctopusChase.entranceIndex]: CroctopusChase.tileMapOffset,
      [SlipslideRide.entranceIndex]: SlipslideRide.tileMapOffset,
    },
    correctedTileMapLength: {
      [CoralCapers.entranceIndex]: CoralCapers.tileMapLength,
      [ClamCity.entranceIndex]: ClamCity.tileMapLength,
      [PoisonPond.entranceIndex]: PoisonPond.tileMapLength,
      [CroctopusChase.entranceIndex]: CroctopusChase.tileMapLength,
      [SlipslideRide.entranceIndex]: SlipslideRide.tileMapLength,
      ...IceCaves.entrancesIndex.reduce<Record<number, number>>((acc, e) => {
        acc[e] = IceCaves.tileMapLength;
        return acc;
      }, {}),
      ...Underwater.entrancesIndex.reduce<Record<number, number>>((acc, e) => {
        acc[e] = Underwater.tileMapLength;
        return acc;
      }, {}),
    },
    isVertical: [
      CoralCapers.entranceIndex,
      ClamCity.entranceIndex,
      PoisonPond.entranceIndex,
      CroctopusChase.entranceIndex,
      SlipslideRide.entranceIndex,
      ...IceCaves.entrancesIndex,
      ...Underwater.entrancesIndex,
    ],
  },
};
