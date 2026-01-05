import { GameLevelConstant } from '../common/levels/types';
import { RomAddress } from '../rom/address';

export const Dkc1AnimationScriptBank = 0x3e0000;
export const Dkc1AnimationScriptTable = 0x8572;

export const Dkc1SpritePointerTable = 0x3bcc9c;

export const Dkc1EntityBank = 0xb50000;
export const Dkc1EntityPaletteBank = 0x3c0000;
export const Dkc1EntitiesStartReference = 0x856d;
export const Dkc1EntitiesEndReference = 0xfff7;

export const Dkc1SlipslideRideEntrances = [
  0x6d, 0x62, 0xab, 0xc5, 0xc6, 0xc7, 0xc8, 0xca, 0xcb,
];
export const Dkc1SlipslideTileMapLength = 0x3a00;

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
    correctedTileMapLength: {
      0xde: 0xc380,
      ...Dkc1SlipslideRideEntrances.reduce<Record<number, number>>((acc, e) => {
        acc[e] = Dkc1SlipslideTileMapLength;
        return acc;
      }, {}),
    },
    isVertical: [0xde, ...Dkc1SlipslideRideEntrances],
  },
};
