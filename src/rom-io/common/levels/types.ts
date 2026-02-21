import { RomAddress } from '../../rom/address';
import { BPP } from '../../types/bpp';
import { DmaTransfer } from './entrance-info/dma-transfers';
import { BackgroundRegisters } from './entrance-info/vram-registers';

export type TilesetInfo = {
  address: RomAddress;
  isCompressed: boolean;
  length: number;
  offset: number;
  placeAt: number;
};

export type TerrainInfo = {
  tilemapAddress: RomAddress;
  tilesetsInfo: TilesetInfo[];
  palettesAddress: RomAddress;
  levelsTilemapStart: RomAddress;
  transfers: DmaTransfer[];
};

export type LevelInfo = {
  tilemapAddress: RomAddress;
  tilemapOffset: number;
  tilemapLength: number;
  isVertical: boolean;
};

export type EntranceInfo = {
  terrain: TerrainInfo;
  level: LevelInfo;
  backgroundRegisters: BackgroundRegisters;
};

export interface TilesDecodeSpec {
  tileset: {
    address: RomAddress;
    length: number;
    offset?: number;
  };
  tilemap: {
    address: RomAddress;
    length: number;
  };
  paletteAddress: RomAddress;
  bpp: BPP;
}

export interface GameLevelConstant {
  address: {
    mainTileset: RomAddress;
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
    loadTerrainTilemap: RomAddress;
    loadTilesetWithAddress: RomAddress;
    loadTilesetWithTerrainIndex: RomAddress;
    loadTerrainPalette: RomAddress;
  };
  tables: {
    levelsTilemapBank: RomAddress;
    levelsTilemapOffset: RomAddress;
    terrainTilesetInfo: RomAddress;
    terrainTilemapBank: RomAddress;
    terrainTilemapPointer: RomAddress;
  };
  entrances: {
    correctedTilemapOffset: Record<number, number>;
    correctedTilemapLength: Record<number, number>;
    isVertical: number[];
  };
}
