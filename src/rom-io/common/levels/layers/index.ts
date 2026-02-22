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
import { buildVramFromDma } from './vram';

const BG_IMAGE_DATA_LENGTH = 0x800;

export const getLayer = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
  layerIndex: number,
) => {
  const layer = entranceInfo.backgroundRegisters.layers[layerIndex];

  const mainTilesetAddress =
    entranceInfo.backgroundRegisters.layers[0].tilesetAddress;
  const layerUsingLevelTileset = entranceInfo.backgroundRegisters.layers.find(
    (t) =>
      t.tilesetAddress === mainTilesetAddress &&
      t.tilemapAddress !== entranceInfo.terrain.levelTilemapVramAddress,
  );

  const vramArray = buildVramFromDma(romData, entranceInfo.terrain.transfers);

  if (
    entranceInfo.terrain.levelsTilemapBackgroundAddress &&
    layer === layerUsingLevelTileset
  ) {
    const bgTilemap = readLevelTilemapData(
      romData,
      entranceInfo.terrain.tilemapAddress,
      entranceInfo.terrain.levelsTilemapBackgroundAddress,
      layer.size,
    );
    vramArray.set(bgTilemap, layer.tilemapAddress * 2);
  }

  const vram = WebBuffer.from(vramArray);

  const tileset = extract(vram, layer.tilesetAddress * 2, 0x8000);
  const tilemap = extract(vram, layer.tilemapAddress * 2, 0x4000);

  const palette = readPalette(
    romData,
    entranceInfo.terrain.palettesAddress,
    128,
  );

  const widthPartCount = layer.size.width / 32;
  const heightPartCount = layer.size.height / 32;

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
    pageImages.push(assembleImages(tiles, 32));
  }

  return assembleImages(pageImages, widthPartCount);
};

const readLevelTilemapData = (
  romData: Buffer,
  terrainTilemapAddress: RomAddress,
  levelTilemapAddress: RomAddress,
  size: Size,
) => {
  const result: number[] = [];

  const levelMatrix = readLevelTilemap(romData, {
    tilemapAddress: levelTilemapAddress,
    tilemapOffset: 0,
    tilemapLength: 0x200, // 0x200 fits 64x64 bg size
    isVertical: false,
  }); // 16x16

  for (let pY = 0; pY < size.height / 32; pY++) {
    for (let pX = 0; pX < size.width / 32; pX++) {
      const bgPart = levelMatrix.subMatrix(pX * 8, pY * 8, 8, 8); // 8x8

      const fullBytesMatrix = new Matrix<number[]>(size.width, size.height, []);
      for (let x = 0; x < bgPart.width; x++) {
        for (let y = 0; y < bgPart.height; y++) {
          const tileInfo = bgPart.get(x, y);

          // Flips = 11000000 00000000
          const flips = (tileInfo & 0xc000) >> 14;

          // Tileset Index = 00000011 11111111
          const tilesetIndex = tileInfo & 0x3ff;

          const tileBytesMatrix = readTerrainTilemapTile(
            romData,
            terrainTilemapAddress,
            tilesetIndex,
            {
              hFlip: (flips & 0b01) > 0,
              vFlip: (flips & 0b10) > 0,
            },
          );

          if ((flips & 0b01) > 0) {
            tileBytesMatrix.flip('horizontal');
          }
          if ((flips & 0b10) > 0) {
            tileBytesMatrix.flip('vertical');
          }

          fullBytesMatrix.setMatrixAt(
            x * tileBytesMatrix.width,
            y * tileBytesMatrix.height,
            tileBytesMatrix,
          );
        }
      }

      for (let y = 0; y < fullBytesMatrix.height; y++) {
        for (let x = 0; x < fullBytesMatrix.width; x++) {
          const part = fullBytesMatrix.get(x, y);
          result.push(...part);
        }
      }
    }
  }

  return result;
};

const PARTS_IN_TILE = 16;
const readTerrainTilemapTile = (
  romData: Buffer,
  tilemapAddress: RomAddress,
  tilemapIndex: number,
  options: { vFlip: boolean; hFlip: boolean },
) => {
  const tilemapOffset = tilemapIndex * BYTES_PER_TILE_META * PARTS_IN_TILE;

  const tileBytesMatrix = new Matrix<number[]>(4, 4, []);
  let offset = tilemapOffset;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const bytes = extract(
        romData,
        tilemapAddress.getOffsetAddress(offset).pcAddress,
        BYTES_PER_TILE_META,
      );

      const test = Array.from(bytes);

      if (options.vFlip) {
        test[1] ^= 0x80;
      }

      if (options.hFlip) {
        test[1] ^= 0x40;
      }
      tileBytesMatrix.set(x, y, test);

      offset += BYTES_PER_TILE_META;
    }
  }

  return tileBytesMatrix;
};
