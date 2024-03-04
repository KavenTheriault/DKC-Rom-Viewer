import { Buffer } from 'buffer';
import { extract } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const test = RomAddress.fromSnesAddress(0x231180);
  const data = extract(selectedRom.data, test.pcAddress, 0x10000);
  const decompressedBitplane = decompressDKC1(data);
  const bitplaneImage = dumpBitplane(decompressedBitplane);

  /* const tilesData = chunk(test2, TILE_DATA_LENGTH);
  const tiles = tilesData.map((td) => parsePixels(Buffer.from(td)));

  // Test code
  const rows = chunk(tiles, 16);

  const totalTilesToShow = tiles.length - (tiles.length % 16);

  const width = 16;
  const height = totalTilesToShow / 16;

  const allPixels: Array2D = create2DArray(width * 8, height * 8);

  for (let c = 0; c < width; c++) {
    for (let r = 0; r < height; r++) {
      const tile = rows[r][c];

      for (let x = 0; x < tile.length; x++) {
        for (let y = 0; y < tile[0].length; y++) {
          allPixels[x + c * 8][y + r * 8] = tile[x][y];
        }
      }
    }
  }

  const palette = readPalette(
    selectedRom.data,
    RomAddress.fromSnesAddress(0x39a1dc),
  );
  const image: Image = buildImageFromPixelsAndPalette(allPixels, palette);*/

  return (
    <div className="columns">
      <pre>{bitplaneImage.length}</pre>
      <div className="column">
        <ImageCanvas defaultSize={{ width: 256, height: 256 }} />
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

const dumpBitplane = (bitplane: number[]) => {
  const width = 16;
  const tileCount = bitplane.length / 32;
  const bitsPerPixel = 4;

  let pxHeight = ((tileCount - (tileCount % width)) / width) * 8;
  if (tileCount % width) pxHeight += 8;
  const pxWidth = width * 8;

  const imgSize = pxWidth * pxHeight * 4;
  const image: number[] = new Array(imgSize).fill(0);

  let offset = 0;

  const bits: number[] = [128, 64, 32, 16, 8, 4, 2, 1];
  const byte = new Array(4).fill(0);

  for (let i = 0; i < tileCount; i++) {
    // Each Tile
    const tile_n = i % width;
    if (i > width - 1) {
      offset = ((i - (i % width)) / width) * (pxWidth * 8 * 4);
    }

    for (let j = 0; j < 8; j++) {
      // Each line
      byte[0] = bitplane[i * (bitsPerPixel * 8) + j * 2];
      byte[1] = bitplane[i * (bitsPerPixel * 8) + j * 2 + 1];
      byte[2] = bitplane[i * (bitsPerPixel * 8) + j * 2 + 16];
      byte[3] = bitplane[i * (bitsPerPixel * 8) + j * 2 + 17];

      for (let k = 0; k < 8; k++) {
        // Each plane
        let value = 0;

        if ((byte[0] & bits[k]) == bits[k]) value += 1;
        if ((byte[1] & bits[k]) == bits[k]) value += 2;
        if ((byte[2] & bits[k]) == bits[k]) value += 4;
        if ((byte[3] & bits[k]) == bits[k]) value += 8;

        // Bits Per Pixel of 4
        value *= 16;

        const pixelIndex = offset + j * pxWidth * 4 + tile_n * 32 + k * 4;

        image[pixelIndex] = value;
        image[pixelIndex + 1] = value;
        image[pixelIndex + 2] = value;

        if (value == 0) {
          image[pixelIndex + 3] = 0;
        } else {
          image[pixelIndex + 3] = 255;
        }
      }
    }
  }

  return image;
};
