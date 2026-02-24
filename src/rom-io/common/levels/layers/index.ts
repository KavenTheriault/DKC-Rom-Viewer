import { Size } from '../../../../website/types/spatial';
import { extract } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { readPalette } from '../../palettes';
import {
  buildTerrainTilemapFromLevelTilemap,
  readLevelTilemap,
} from '../index';
import { assembleImages } from '../tiles/assemble';
import { decodeTiles } from '../tiles/decode-tiles';
import { EntranceInfo } from '../types';
import { buildVramFromDma, ManualTransfer } from './vram';

const BG_IMAGE_DATA_LENGTH = 0x800;
const BG_PART_SIZE = 32;

export const buildLayer = (
  romData: Uint8Array,
  entranceInfo: EntranceInfo,
  layerIndex: number,
) => {
  const layer = entranceInfo.backgroundRegisters.layers[layerIndex];

  const terrainTilesetAddress =
    entranceInfo.backgroundRegisters.layers[0].tilesetAddress;
  /* Find layers using the levels tilemap and terrain tileset */
  const layerUsingTerrainTileset = entranceInfo.backgroundRegisters.layers.find(
    (t) =>
      t.tilesetAddress === terrainTilesetAddress &&
      t.tilemapAddress !== entranceInfo.terrain.levelsTilemapVramAddress,
  );

  const manualTransfers: ManualTransfer[] = [];
  if (
    entranceInfo.terrain.levelsTilemapBackgroundAddress &&
    layer === layerUsingTerrainTileset
  ) {
    const bgTilemap = buildScreenTilemap(
      romData,
      entranceInfo.terrain.tilemapAddress,
      entranceInfo.terrain.levelsTilemapBackgroundAddress,
      layer.size,
    );
    manualTransfers.push({
      data: bgTilemap,
      destination: layer.tilemapAddress,
    });
  }

  const vram = buildVramFromDma(
    romData,
    entranceInfo.terrain.dmaTransfers,
    manualTransfers,
  );
  const tileset = extract(vram, layer.tilesetAddress * 2, 0x8000);
  const tilemap = extract(vram, layer.tilemapAddress * 2, 0x4000);

  const palette = readPalette(
    romData,
    entranceInfo.terrain.palettesAddress,
    128,
  );

  const widthPartCount = layer.size.width / BG_PART_SIZE;
  const heightPartCount = layer.size.height / BG_PART_SIZE;

  const pageImages = [];
  for (let i = 0; i < widthPartCount * heightPartCount; i++) {
    const tiles = decodeTiles({
      tileset: tileset,
      tilemap: {
        data: tilemap,
        address: RomAddress.fromSnesAddress(BG_IMAGE_DATA_LENGTH * i).pcAddress,
      },
      tilemapSize: { dataLength: BG_IMAGE_DATA_LENGTH },
      palette,
      bpp: layerIndex > 1 ? BPP.Two : BPP.Four,
      options: {
        opaqueZero: layerIndex > 1,
      },
    });
    pageImages.push(assembleImages(tiles, BG_PART_SIZE));
  }

  return assembleImages(pageImages, widthPartCount);
};

const buildScreenTilemap = (
  romData: Uint8Array,
  terrainTilemapAddress: RomAddress,
  levelsTilemapAddress: RomAddress,
  size: Size,
) => {
  const tilemap: number[] = [];

  const levelMatrix = readLevelTilemap(romData, levelsTilemapAddress, {
    tilemapOffset: 0,
    tilemapLength: 0x200, // 0x200 fits 64x64 bg size
    isVertical: false,
  }); // 16x16

  for (let y = 0; y < size.height / BG_PART_SIZE; y++) {
    for (let x = 0; x < size.width / BG_PART_SIZE; x++) {
      const bgPart = levelMatrix.subMatrix(x * 8, y * 8, 8, 8); // 8x8

      const terrainTilemap = buildTerrainTilemapFromLevelTilemap(
        romData,
        bgPart,
        terrainTilemapAddress,
      );

      for (let pY = 0; pY < terrainTilemap.height; pY++) {
        for (let pX = 0; pX < terrainTilemap.width; pX++) {
          tilemap.push(...terrainTilemap.get(pX, pY));
        }
      }
    }
  }

  return Uint8Array.from(tilemap);
};
