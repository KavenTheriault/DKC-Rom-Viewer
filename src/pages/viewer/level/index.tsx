import { Buffer } from 'buffer';
import { extract } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';
import { Image } from '../../../rom-parser/sprites/types';
import { create2DArray } from '../../../rom-parser/utils/array';
import {
  buildImageFromPixelsAndPalette,
  grayscalePalette,
} from '../../../rom-parser/palette';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const test = RomAddress.fromSnesAddress(0x231180);
  const data = extract(selectedRom.data, test.pcAddress, 0x10000);
  const decompressedBitplane = decompressDKC1(data);
  const bitplane = dumpBitplane(decompressedBitplane);

  const palette = grayscalePalette();
  const image: Image = buildImageFromPixelsAndPalette(bitplane, palette);

  return (
    <div className="columns">
      <pre>{image.length}</pre>
      <div className="column">
        <ImageCanvas image={image} defaultSize={{ width: 256, height: 256 }} />
      </div>
    </div>
  );
};

const decompressDKC1 = (compressed: Buffer) => {
  const decompressed: number[] = [];
  let cIndex = 0x80;

  while (compressed[cIndex] !== 0) {
    const command = compressed[cIndex++];
    const rawCommand = command & 0xc0;

    if (rawCommand == 0xc0) {
      // Common
      let commonIndex = (command & 0x3f) * 2;
      decompressed.push(compressed[commonIndex++]);
      decompressed.push(compressed[commonIndex++]);
    } else if (rawCommand == 0x80) {
      // Copy
      let n = command & 0x3f;
      let dIndex = (compressed[cIndex++] << 0) | (compressed[cIndex++] << 8);

      while (n-- > 0) {
        decompressed.push(decompressed[dIndex++]);
      }
    } else if (rawCommand == 0x40) {
      // Write
      let n = command & 0x3f;
      const toRepeat = compressed[cIndex++];
      while (n-- > 0) {
        decompressed.push(toRepeat);
      }
    } else if (rawCommand < 0x40) {
      // Raw
      let n = command & 0x3f;
      while (n-- > 0) {
        decompressed.push(compressed[cIndex++]);
      }
    } else {
      throw new Error('Invalid command');
    }
  }

  return decompressed;
};

const TILES_PER_ROW = 16;
const TILE_PIXEL_WIDTH = 8;
const TILE_PIXEL_HEIGHT = 8;
const BYTES_PER_TILE = 32;

const dumpBitplane = (bitplaneData: number[]) => {
  const bitsPerPixel = 4;

  const tileCount = bitplaneData.length / BYTES_PER_TILE;
  const totalTileRows = Math.ceil(tileCount / TILES_PER_ROW);

  const pxHeight = totalTileRows * TILE_PIXEL_HEIGHT;
  const pxWidth = TILES_PER_ROW * TILE_PIXEL_WIDTH;
  const bitplane = create2DArray(pxWidth, pxHeight);

  for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
    const currentTileRow =
      (tileIndex - (tileIndex % TILES_PER_ROW)) / TILES_PER_ROW;

    const widthPixelOffset = (tileIndex % TILES_PER_ROW) * TILE_PIXEL_WIDTH;
    const heightPixelOffset = currentTileRow * TILE_PIXEL_HEIGHT;

    for (let j = 0; j < TILE_PIXEL_HEIGHT; j++) {
      // Each line
      const offset: number =
        tileIndex * (bitsPerPixel * TILE_PIXEL_WIDTH) + j * 2;
      const rowBitplanes: number[] = [
        bitplaneData[offset],
        bitplaneData[0x01 + offset],
        bitplaneData[0x10 + offset],
        bitplaneData[0x11 + offset],
      ];

      for (let k = 0; k < TILE_PIXEL_WIDTH; k++) {
        // Each plane
        const bitShift: number = 7 - k;
        const pixelBits: number[] = [
          (rowBitplanes[3] >> bitShift) & 0b1,
          (rowBitplanes[2] >> bitShift) & 0b1,
          (rowBitplanes[1] >> bitShift) & 0b1,
          (rowBitplanes[0] >> bitShift) & 0b1,
        ];
        const value =
          (pixelBits[0] << 3) |
          (pixelBits[1] << 2) |
          (pixelBits[2] << 1) |
          pixelBits[3];
        if (value !== 0) {
          const pixelX = widthPixelOffset + k;
          const pixelY = heightPixelOffset + j;
          bitplane[pixelX][pixelY] = value;
        }
      }
    }
  }

  return bitplane;
};
