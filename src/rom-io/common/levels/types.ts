import { RomAddress } from '../../rom/address';

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
  levelTileMapOffset: number;
  levelTileMapLength: number;
  isVertical: boolean;
};

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
