import { Buffer as WebBuffer } from 'buffer';
import { extract } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { readPalette } from '../../palettes';
import { assembleImages } from '../tiles/assemble';
import { decodeTiles } from '../tiles/decode-tiles';
import { EntranceInfo } from '../types';
import { buildVramFromDma } from './vram';

const BG_IMAGE_DATA_LENGTH = 0x800;

// Cannot support layer 0, built by CPU
export const tryBackground = (
  romData: Buffer,
  entranceInfo: EntranceInfo,
  layerIndex: number,
) => {
  const vram = WebBuffer.from(
    buildVramFromDma(romData, entranceInfo.terrain.transfers),
  );

  const layer = entranceInfo.backgroundRegisters.layers[layerIndex];

  const tileMapData = extract(vram, layer.tilesetAddress * 2, 0x4000);
  const tileSetData = extract(vram, layer.tilemapAddress * 2, 0x4000);

  const palette = readPalette(
    romData,
    entranceInfo.terrain.palettesAddress,
    128,
  );

  let imageCount = 0,
    imagesPerRow = 0;
  switch (layer.size) {
    case '32x32':
      imageCount = 1;
      imagesPerRow = 1;
      break;
    case '64x32':
      imageCount = 2;
      imagesPerRow = 2;
      break;
    case '32x64':
      imageCount = 2;
      imagesPerRow = 1;
      break;
    case '64x64':
      imageCount = 4;
      imagesPerRow = 2;
      break;
  }

  const pageImages = [];
  for (let i = 0; i < imageCount; i++) {
    const tiles = decodeTiles({
      romData: tileSetData,
      bitplane: Uint8Array.from(tileMapData),
      palette,
      tilesMetaAddress: RomAddress.fromSnesAddress(BG_IMAGE_DATA_LENGTH * i),
      tilesMetaLength: { dataLength: BG_IMAGE_DATA_LENGTH },
      bpp: layerIndex > 1 ? BPP.Two : BPP.Four,
      options: {
        opaqueZero: layerIndex > 1,
      },
    });
    pageImages.push(assembleImages(tiles, 32));
  }

  return assembleImages(pageImages, imagesPerRow);
};
