import { Size } from '../../../../website/types/spatial';
import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { Buffer } from '../../../types/buffer';
import { readPalette } from '../../palettes';
import {
  buildTerrainTilemapFromLevelTilemap,
  readLevelTilemap,
} from '../index';
import { assembleImages } from '../tiles/assemble';
import { DecodeTileOptions } from '../tiles/decode-tile';
import { decodeTiles } from '../tiles/decode-tiles';
import { EntranceInfo } from '../types';
import { buildVramFromDma, ManualTransfer, readVram } from './vram';

const LAYER_PART_SIZE = 32;
const LAYER_TILEMAP_LENGTH = 0x200;
const LAYER_PART_DATA_LENGTH = LAYER_TILEMAP_LENGTH * 4;

export const buildLayer = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
  layerIndex: number,
  decodeTileOptions?: DecodeTileOptions,
) => {
  const layer = entranceInfo.layers[layerIndex];

  const manualTransfers: ManualTransfer[] = [];
  if (
    entranceInfo.terrain.levelsTilemapBackgroundAddress &&
    layer.type === 'Tileset'
  ) {
    const tilemap = buildLayerTilemap(
      romData,
      entranceInfo.terrain.tilemapAddress,
      entranceInfo.terrain.levelsTilemapBackgroundAddress,
      layer.size,
    );
    manualTransfers.push({
      data: tilemap,
      destination: layer.tilemapAddress,
    });
  }

  const vram = buildVramFromDma(
    romData,
    entranceInfo.terrain.dmaTransfers,
    manualTransfers,
  );
  const tileset = readVram(vram, layer.tilesetAddress, 0x8000);
  const tilemap = readVram(vram, layer.tilemapAddress, 0x4000);

  const palette = readPalette(
    romData,
    entranceInfo.terrain.palettesAddress,
    128,
  );

  const widthPartCount = layer.size.width / LAYER_PART_SIZE;
  const heightPartCount = layer.size.height / LAYER_PART_SIZE;

  const partImages = [];
  for (let i = 0; i < widthPartCount * heightPartCount; i++) {
    const tiles = decodeTiles({
      tileset: tileset,
      tilemap: {
        data: tilemap,
        address: RomAddress.fromSnesAddress(LAYER_PART_DATA_LENGTH * i)
          .pcAddress,
      },
      tilemapSize: { dataLength: LAYER_PART_DATA_LENGTH },
      palette,
      bpp: layerIndex > 1 ? BPP.Two : BPP.Four,
      options: decodeTileOptions,
    });
    partImages.push(assembleImages(tiles, LAYER_PART_SIZE));
  }

  return assembleImages(partImages, widthPartCount);
};

const buildLayerTilemap = (
  romData: Buffer,
  terrainTilemapAddress: RomAddress,
  levelsTilemapAddress: RomAddress,
  size: Size,
) => {
  const tilemap: number[] = [];

  const levelMatrix = readLevelTilemap(romData, levelsTilemapAddress, {
    tilemapOffset: 0,
    tilemapLength: LAYER_TILEMAP_LENGTH,
    isVertical: false,
  });
  const partSize = LAYER_PART_SIZE / 4;

  for (let y = 0; y < size.height / LAYER_PART_SIZE; y++) {
    for (let x = 0; x < size.width / LAYER_PART_SIZE; x++) {
      const levelPart = levelMatrix.subMatrix(
        x * partSize,
        y * partSize,
        partSize,
        partSize,
      );

      const terrainTilemap = buildTerrainTilemapFromLevelTilemap(
        romData,
        levelPart,
        terrainTilemapAddress,
      );
      tilemap.push(...terrainTilemap.bytes);
    }
  }

  return Uint8Array.from(tilemap);
};
