import { Buffer as WebBuffer } from 'buffer';
import { Size } from '../../../../website/types/spatial';
import { extract } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { Matrix } from '../../../types/matrix';
import { readPalette } from '../../palettes';
import { readLevelTilemap } from '../index';
import { assembleImages } from '../tiles/assemble';
import { BYTES_PER_TILE_META } from '../tiles/constants';
import { decodeTiles } from '../tiles/decode-tiles';
import { EntranceInfo } from '../types';
import { buildVramFromDma, ManualTransfer } from './vram';

const BG_IMAGE_DATA_LENGTH = 0x800;
const BG_PART_SIZE = 32;

export const buildLayer = (
  romData: Buffer,
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

  const vram = WebBuffer.from(
    buildVramFromDma(
      romData,
      entranceInfo.terrain.dmaTransfers,
      manualTransfers,
    ),
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
      tileset: Uint8Array.from(tileset),
      tilemap: {
        data: tilemap,
        address: RomAddress.fromSnesAddress(BG_IMAGE_DATA_LENGTH * i),
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
  romData: Buffer,
  terrainTilemapAddress: RomAddress,
  levelsTilemapAddress: RomAddress,
  size: Size,
) => {
  const result: number[] = [];

  const levelMatrix = readLevelTilemap(romData, levelsTilemapAddress, {
    tilemapOffset: 0,
    tilemapLength: 0x200, // 0x200 fits 64x64 bg size
    isVertical: false,
  }); // 16x16

  for (let pY = 0; pY < size.height / BG_PART_SIZE; pY++) {
    for (let pX = 0; pX < size.width / BG_PART_SIZE; pX++) {
      const bgPart = levelMatrix.subMatrix(pX * 8, pY * 8, 8, 8); // 8x8

      const fullBytesMatrix = new Matrix<number[]>(
        BG_PART_SIZE,
        BG_PART_SIZE,
        [],
      );
      for (let x = 0; x < bgPart.width; x++) {
        for (let y = 0; y < bgPart.height; y++) {
          const tileInfo = bgPart.get(x, y);

          // Flips = 11000000 00000000
          const flips = (tileInfo & 0xc000) >> 14;
          const hFlip = (flips & 0b01) > 0;
          const vFlip = (flips & 0b10) > 0;

          // Tileset Index = 00000011 11111111
          const tilesetIndex = tileInfo & 0x3ff;

          const tileBytesMatrix = readTerrainTilemapTileBytes(
            romData,
            terrainTilemapAddress,
            tilesetIndex,
            { hFlip, vFlip },
          );
          if (hFlip) tileBytesMatrix.flip('horizontal');
          if (vFlip) tileBytesMatrix.flip('vertical');

          fullBytesMatrix.setMatrixAt(
            x * tileBytesMatrix.width,
            y * tileBytesMatrix.height,
            tileBytesMatrix,
          );
        }
      }

      for (let y = 0; y < fullBytesMatrix.height; y++) {
        for (let x = 0; x < fullBytesMatrix.width; x++) {
          result.push(...fullBytesMatrix.get(x, y));
        }
      }
    }
  }

  return result;
};

const PARTS_IN_TILE = 16;
const readTerrainTilemapTileBytes = (
  romData: Buffer,
  tilemapAddress: RomAddress,
  tilemapIndex: number,
  options: { vFlip: boolean; hFlip: boolean },
) => {
  const tilemapOffset = tilemapIndex * BYTES_PER_TILE_META * PARTS_IN_TILE;

  const tileBytesMatrix = new Matrix<number[]>(4, 4, []);
  let offset = tilemapOffset;
  for (let y = 0; y < tileBytesMatrix.height; y++) {
    for (let x = 0; x < tileBytesMatrix.width; x++) {
      const tileBytes = Array.from(
        extract(
          romData,
          tilemapAddress.getOffsetAddress(offset).pcAddress,
          BYTES_PER_TILE_META,
        ),
      );

      if (options.vFlip) tileBytes[1] ^= 0x80;
      if (options.hFlip) tileBytes[1] ^= 0x40;
      tileBytesMatrix.set(x, y, tileBytes);

      offset += BYTES_PER_TILE_META;
    }
  }

  return tileBytesMatrix;
};
