import { Buffer } from 'buffer';
import { extract, read16 } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';
import { Array2D, Color, Image } from '../../../rom-parser/sprites/types';
import { create2DArray } from '../../../rom-parser/utils/array';
import {
  buildImageFromPixelsAndPalette,
  grayscalePalette,
} from '../../../rom-parser/palette';
import { parsePixelsV2 } from '../../../rom-parser/sprites/tile';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const tileImages = test(selectedRom.data);

  const forestBitplaneAddress = RomAddress.fromSnesAddress(0x231180);
  const forestDataAddress = RomAddress.fromSnesAddress(0x03bd00);

  const bitplaneData = extract(
    selectedRom.data,
    forestBitplaneAddress.pcAddress,
    0x10000, // TODO: Improve this length
  );
  const decompressedBitplane = decompressDKC1(bitplaneData);

  const forestData = extract(
    selectedRom.data,
    forestDataAddress.pcAddress,
    0x30a0,
  );

  // Display Bitplane in Grayscale
  const bitplaneTitles = extractBitplaneTiles(
    Buffer.from(decompressedBitplane),
  );
  const combinedTiles = combineBitplaneTiles(bitplaneTitles);
  const palette = grayscalePalette();
  const image: Image = buildImageFromPixelsAndPalette(combinedTiles, palette);

  return (
    <div className="columns">
      <div className="column">
        <ImageCanvas
          image={tileImages[4]}
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

const extractBitplaneTiles = (bitplaneData: Buffer) => {
  const tiles = [];
  for (let offset = 0; offset < bitplaneData.length; offset += BYTES_PER_TILE) {
    const tileData = extract(bitplaneData, offset, BYTES_PER_TILE);
    tiles.push(parsePixelsV2(tileData));
  }
  return tiles;
};

const combineBitplaneTiles = (tiles: Array2D[]) => {
  const totalTileRows = Math.ceil(tiles.length / TILES_PER_ROW);

  const pxHeight = totalTileRows * TILE_PIXEL_HEIGHT;
  const pxWidth = TILES_PER_ROW * TILE_PIXEL_WIDTH;
  const combinedBitplane = create2DArray(pxWidth, pxHeight);

  for (let tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
    const tile = tiles[tileIndex];
    const currentTileRow =
      (tileIndex - (tileIndex % TILES_PER_ROW)) / TILES_PER_ROW;

    const widthPixelOffset = (tileIndex % TILES_PER_ROW) * TILE_PIXEL_WIDTH;
    const heightPixelOffset = currentTileRow * TILE_PIXEL_HEIGHT;

    for (let x = 0; x < TILE_PIXEL_HEIGHT; x++) {
      for (let y = 0; y < TILE_PIXEL_WIDTH; y++) {
        const pixelX = widthPixelOffset + x;
        const pixelY = heightPixelOffset + y;
        combinedBitplane[pixelX][pixelY] = tile[x][y];
      }
    }
  }

  return combinedBitplane;
};

const test = (romData: Buffer) => {
  const palettes = readPalettesFromROM(
    romData,
    RomAddress.fromSnesAddress(0xb9a1dc).pcAddress,
    8,
    16,
  );

  const bitplaneData = extract(
    romData,
    RomAddress.fromSnesAddress(0xd58fc0).pcAddress,
    0x10000,
  );
  const decompressedChars = decompressDKC1(bitplaneData);
  const lvlXBoundStart = 0xd91500;
  const lvlXBoundEnd = 0xd91700;
  const chars = readEveryChar(palettes, Buffer.from(decompressedChars));
  const meta = extract(
    romData,
    RomAddress.fromSnesAddress(0xd9a3c0).pcAddress,
    0x24a * 0x20,
  );
  return readTileFromMeta(meta, chars, palettes);
};

// This is only reading the first 0x20 bytes?????
const readEveryChar = (
  palette: Color[][],
  decompressedChars: Buffer,
): Buffer[] => {
  const result = [];

  let paletteIndex = 0;
  while (paletteIndex < 1) {
    const pal = palette[paletteIndex++];

    for (let i = 0; i < decompressedChars.length; i += 0x20) {
      const arr = extract(decompressedChars, i, 0x20);
      result.push(arr);
    }
  }

  return result;
};

const readTileFromMeta = (
  meta: Buffer,
  chars: Buffer[],
  palette: Color[][],
) => {
  const result = [];

  for (let i = 0; i < meta.length; i += 0x20) {
    const metaSub = extract(meta, i, 0x20);

    // Look at each tile
    let index = 0;
    const bmp: Image = new Array(32)
      .fill(null)
      .map(() => new Array(32).fill(null));

    // Set each tile up from TL to BR
    for (let x = 0; x < 32; x += 8) {
      for (let y = 0; y < 32; y += 8) {
        let pointer = read16(metaSub, index);
        index += 2;
        const attr = pointer & 0xfc00;
        const paletteIndex = (attr & 0x1c00) >> 10;
        pointer &= 0x3ff;

        let charImage = drawChar(chars[pointer], palette[paletteIndex]);

        if ((attr & 0x4000) > 0) {
          charImage = charImage.map((c) => c.reverse());
        }
        if ((attr & 0x8000) > 0) {
          charImage = charImage.reverse();
        }

        for (let x2 = 0; x2 < charImage.length; x2++) {
          for (let y2 = 0; y2 < charImage[0].length; y2++) {
            bmp[x + x2][y + y2] = charImage[x2][y2];
          }
        }
      }
    }

    result.push(bmp);
  }

  return result;
};

const drawChar = (char: Buffer, palette: Color[]) => {
  const bmp: Image = new Array(8).fill(null).map(() => new Array(8).fill(null));

  for (let i = 0, index = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let colorIndex = 0;

      for (let k = 0; k < 4 /* bpp */ / 2; k++) {
        const x = ((char[index + k * 16] >> (7 - j)) & 1) << (k * 2);
        const y = ((char[index + 1 + k * 16] >> (7 - j)) & 1) << (k * 2 + 1);
        colorIndex |= x | y;
      }

      bmp[i][j] = palette[colorIndex];
    }
    index += 2;
  }

  return bmp;
};

const readPalettesFromROM = (
  romData: Buffer,
  offset: number,
  rows: number,
  cols: number,
) => {
  const result = [];

  let paletteOffset = offset;
  for (let i = 0; i < rows; i++) {
    const palette = [];
    for (let j = 0; j < cols; j++) {
      const raw = read16(romData, paletteOffset);
      paletteOffset += 2;

      const r = ((raw >> 0) & 0x1f) << 3;
      const g = ((raw >> 5) & 0x1f) << 3;
      const b = ((raw >> 10) & 0x1f) << 3;

      palette.push({ r, g, b });
    }
    result.push(palette);
  }

  return result;
};
