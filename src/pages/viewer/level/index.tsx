import { Buffer } from 'buffer';
import { extract } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';
import { Image } from '../../../rom-parser/sprites/types';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const test = RomAddress.fromSnesAddress(0x231180);
  const data = extract(selectedRom.data, test.pcAddress, 0x10000);
  const decompressedBitplane = decompressDKC1(data);
  const bitplaneImage = dumpBitplane(decompressedBitplane);

  return (
    <div className="columns">
      <pre>{bitplaneImage.length}</pre>
      <div className="column">
        <ImageCanvas
          image={bitplaneImage}
          defaultSize={{ width: 256, height: 256 }}
        />
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

const createEmptyImage = (width: number, height: number): Image =>
  new Array(width).fill(0).map(() => new Array(height).fill(null));

const dumpBitplane = (bitplaneData: number[]) => {
  const bitsPerPixel = 4;

  const tileCount = bitplaneData.length / BYTES_PER_TILE;
  const totalTileRows = Math.ceil(tileCount / TILES_PER_ROW);

  const pxHeight = totalTileRows * TILE_PIXEL_HEIGHT;
  const pxWidth = TILES_PER_ROW * TILE_PIXEL_WIDTH;
  const image: Image = createEmptyImage(pxWidth, pxHeight);

  const bits: number[] = [128, 64, 32, 16, 8, 4, 2, 1];
  const byte = new Array(4).fill(0);

  for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
    const currentTileRow =
      (tileIndex - (tileIndex % TILES_PER_ROW)) / TILES_PER_ROW;

    const widthPixelOffset = (tileIndex % TILES_PER_ROW) * TILE_PIXEL_WIDTH;
    const heightPixelOffset = currentTileRow * TILE_PIXEL_HEIGHT;

    for (let j = 0; j < TILE_PIXEL_HEIGHT; j++) {
      // Each line
      byte[0] = bitplaneData[tileIndex * (bitsPerPixel * 8) + j * 2];
      byte[1] = bitplaneData[tileIndex * (bitsPerPixel * 8) + j * 2 + 1];
      byte[2] = bitplaneData[tileIndex * (bitsPerPixel * 8) + j * 2 + 16];
      byte[3] = bitplaneData[tileIndex * (bitsPerPixel * 8) + j * 2 + 17];

      for (let k = 0; k < TILE_PIXEL_WIDTH; k++) {
        // Each plane
        let value = 0;

        if ((byte[0] & bits[k]) === bits[k]) value += 1;
        if ((byte[1] & bits[k]) === bits[k]) value += 2;
        if ((byte[2] & bits[k]) === bits[k]) value += 4;
        if ((byte[3] & bits[k]) === bits[k]) value += 8;

        // Bits Per Pixel of 4
        value *= 16;

        const pixelX = widthPixelOffset + k;
        const pixelY = heightPixelOffset + j;

        if (value !== 0) {
          image[pixelX][pixelY] = { r: value, g: value, b: value };
        }
      }
    }
  }

  return image;
};
