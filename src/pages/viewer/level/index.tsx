import { Buffer } from 'buffer';
import { extract, read16 } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';
import { Color } from '../../../rom-parser/sprites/types';
import { Matrix } from '../../../types/matrix';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const tileImages = extractLevelTiles(selectedRom.data);
  const combinedImage = combineMatrixIntoGrid(tileImages);

  return (
    <div className="columns">
      <div className="column">
        <ImageCanvas
          image={combinedImage}
          defaultSize={{ width: 256, height: 256 }}
          defaultZoom={1}
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

const extractLevelTiles = (romData: Buffer) => {
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
    const largeLevelTile = new Matrix<Color | null>(32, 32, null);

    // Set each tile up from TL to BR
    for (let x = 0; x < 32; x += 8) {
      for (let y = 0; y < 32; y += 8) {
        let pointer = read16(metaSub, index);
        index += 2;
        const attr = pointer & 0xfc00;
        const paletteIndex = (attr & 0x1c00) >> 10;
        pointer &= 0x3ff;

        const smallLevelTile = getSmallLevelTile(
          chars[pointer],
          palette[paletteIndex],
        );

        if ((attr & 0x4000) > 0) {
          smallLevelTile.flip('vertical');
        }
        if ((attr & 0x8000) > 0) {
          smallLevelTile.flip('horizontal');
        }

        for (let x2 = 0; x2 < smallLevelTile.width; x2++) {
          for (let y2 = 0; y2 < smallLevelTile.height; y2++) {
            largeLevelTile.set(x + x2, y + y2, smallLevelTile.get(x2, y2));
          }
        }
      }
    }

    result.push(largeLevelTile);
  }

  return result;
};

const getSmallLevelTile = (char: Buffer, palette: Color[]) => {
  const smallLevelTile = new Matrix<Color | null>(8, 8, null);

  for (let i = 0, index = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let colorIndex = 0;

      for (let k = 0; k < 4 /* bpp */ / 2; k++) {
        const x = ((char[index + k * 16] >> (7 - j)) & 1) << (k * 2);
        const y = ((char[index + 1 + k * 16] >> (7 - j)) & 1) << (k * 2 + 1);
        colorIndex |= x | y;
      }

      if (colorIndex > 0) smallLevelTile.set(i, j, palette[colorIndex]);
    }
    index += 2;
  }

  return smallLevelTile;
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

const combineMatrixIntoGrid = <T extends object>(
  matrices: Matrix<T | null>[],
  imagesPerRow = 16,
) => {
  const imageWidth = matrices[0].width;
  const imageHeight = matrices[0].height;
  const totalImageRows = Math.ceil(matrices.length / imagesPerRow);

  const pxHeight = totalImageRows * imageHeight;
  const pxWidth = imagesPerRow * imageWidth;
  const combinedImage = new Matrix<T | null>(pxWidth, pxHeight, null);

  for (let imageIndex = 0; imageIndex < matrices.length; imageIndex++) {
    const image = matrices[imageIndex];
    const currentTileRow =
      (imageIndex - (imageIndex % imagesPerRow)) / imagesPerRow;

    const widthPixelOffset = (imageIndex % imagesPerRow) * imageWidth;
    const heightPixelOffset = currentTileRow * imageHeight;

    for (let x = 0; x < imageHeight; x++) {
      for (let y = 0; y < imageWidth; y++) {
        const pixelX = widthPixelOffset + x;
        const pixelY = heightPixelOffset + y;
        combinedImage.set(pixelX, pixelY, image.get(x, y));
      }
    }
  }

  return combinedImage;
};
