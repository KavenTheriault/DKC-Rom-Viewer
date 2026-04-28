import { RomAddress } from '../../../rom/address';
import { TilesDecodeSpec } from '../types';

export interface NonLevelEntranceInfo {
  branchAddress: RomAddress;
  type: 'world-map' | 'service';
}

export interface BackgroundAddresses {
  tilemapAddress: RomAddress;
  tilesetAddress: RomAddress;
  paletteAddress: RomAddress;
}

export interface WorldMapInfo {
  firstEntranceId: number;
  worldIndices: number[];
  backgroundAddresses: BackgroundAddresses[];
  backgroundSpecs: TilesDecodeSpec[];
}

export interface ServiceInfo {
  backgroundSpecs: TilesDecodeSpec[];
}
