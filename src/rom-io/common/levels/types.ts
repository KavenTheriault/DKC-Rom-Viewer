import { RomAddress } from '../../rom/address';
import { BPP } from '../../types/bpp';
import { DmaTransfer } from './entrance-info/dma-transfers';
import { BackgroundRegister } from './entrance-info/vram-registers';

export type TilesetInfo = {
  address: RomAddress;
  isCompressed: boolean;
  length: number;
  offset: number;
  placeAt: number;
};

export type TerrainInfo = {
  dmaTransfers: DmaTransfer[];
  levelsTilemapAddress: RomAddress;
  levelsTilemapBackgroundAddress?: RomAddress;
  levelsTilemapVramAddress: number;
  palettesAddress: RomAddress;
  tilemapAddress: RomAddress;
  tilesetsInfo: TilesetInfo[];
};

export type LevelInfo = {
  tilemapOffset: number;
  tilemapLength: number;
  isVertical: boolean;
};

export type Layer = {
  type: 'Level' | 'Tileset' | 'Image';
} & BackgroundRegister;

export type EntranceInfo = {
  terrain: TerrainInfo;
  level: LevelInfo;
  layers: Layer[];
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
  tilesPerRow: number;
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
    loadTerrainBackgroundTilemap: RomAddress;
    loadTilesetWithAddress: RomAddress;
    loadTilesetWithTerrainIndex: RomAddress;
    loadTerrainPalette: RomAddress;
    loadVramRegisters: RomAddress;
    loadEntrance: RomAddress;
    loadWorld: RomAddress;
  };
  tables: {
    levelsTilemapBank: RomAddress;
    levelsTilemapOffset: RomAddress;
    levelsTilemapVramAddress: RomAddress;
    terrainTilemapBank: RomAddress;
    terrainTilemapPointer: RomAddress;
    terrainTilesetInfo: RomAddress;
    vramRegisters: RomAddress;
    worldIndex: RomAddress;
    worldAddresses: RomAddress;
  };
  entrances: {
    correctedTilemapOffset: Record<number, number>;
    correctedTilemapLength: Record<number, number>;
    isVertical: number[];
  };
}
