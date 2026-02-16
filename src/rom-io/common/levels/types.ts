import { RomAddress } from '../../rom/address';
import { BPP } from '../../types/bpp';
import { BackgroundRegisters } from './entrance-info/vram-registers';

export type GraphicInfo = {
  address: RomAddress;
  isCompressed: boolean;
  length: number;
  offset: number;
  placeAt: number;
};

export type TerrainInfo = {
  // Internal index used to load meta
  metaIndex: number;
  metaAddress: RomAddress;
  palettesAddress: RomAddress;
  tileMapAddress: RomAddress;
  graphicsInfo: GraphicInfo[];
};

export type LevelInfo = {
  tileMapAddress: RomAddress;
  tileMapOffset: number;
  tileMapLength: number;
  isVertical: boolean;
};

export type EntranceInfo = {
  terrain: TerrainInfo;
  level: LevelInfo;
  backgroundRegisters: BackgroundRegisters;
};

export interface TilesDecodeSpec {
  bitplane: {
    address: RomAddress;
    length: number;
    offset?: number;
  };
  tileMeta: {
    address: RomAddress;
    length: number;
  };
  paletteAddress: RomAddress;
  bpp: BPP;
}

export interface GameLevelConstant {
  address: {
    mainGraphic: RomAddress;
  };
  banks: {
    terrainPalette: number;
    loadEntrances: number;
    levelBounds: number;
  };
  pointerTables: {
    loadEntrances: number;
    levelBounds: number;
  };
  subroutines: {
    loadTerrainMeta: RomAddress;
    loadGraphicsWithAddress: RomAddress;
    loadGraphicsWithTerrainIndex: RomAddress;
    loadTerrainPalette: RomAddress;
  };
  tables: {
    terrainMetaPointer: RomAddress;
    terrainMetaTileOffset: RomAddress;
    terrainMetaBank: RomAddress;
    terrainTileMapBank: RomAddress;
    terrainGraphicsInfo: RomAddress;
  };
  entrances: {
    correctedTileMapOffset: Record<number, number>;
    correctedTileMapLength: Record<number, number>;
    isVertical: number[];
  };
}
