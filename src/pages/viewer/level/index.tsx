import { Buffer } from 'buffer';
import { extract, read16 } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';
import { Color, Image } from '../../../rom-parser/sprites/types';
import { combineMatrixIntoGrid, Matrix } from '../../../types/matrix';
import { parseTilePixels } from '../../../rom-parser/sprites/tile';
import {
  buildImageFromPixelsAndPalette,
  readPalettes,
} from '../../../rom-parser/palette';
import { Palette } from '../../../rom-parser/palette/types';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const tileImages = extractLevelTiles(selectedRom.data);
  const combinedImage = combineMatrixIntoGrid(tileImages);
  const tileMap = readTileMap(selectedRom.data);
  const levelImage = buildLevel(tileMap, tileImages);
  console.log('DEBUG', tileMap);

  return (
    <div className="columns">
      <div className="column">
        <ImageCanvas
          image={levelImage}
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
  const palettes = readPalettes(
    romData,
    RomAddress.fromSnesAddress(0xb9a1dc),
    8,
    16,
  );

  const bitplaneData = extract(
    romData,
    RomAddress.fromSnesAddress(0xd58fc0).pcAddress,
    0x10000,
  );
  const decompressedChars = decompressDKC1(bitplaneData);
  const tilesData = getTilesData(Buffer.from(decompressedChars));
  const meta = extract(
    romData,
    RomAddress.fromSnesAddress(0xd9a3c0).pcAddress,
    0x24a * 0x20,
  );
  return readTileFromMeta(meta, tilesData, palettes);
};

const getTilesData = (decompressedChars: Buffer): Buffer[] => {
  const result = [];

  for (let i = 0; i < decompressedChars.length; i += 0x20) {
    const arr = extract(decompressedChars, i, 0x20);
    result.push(arr);
  }

  return result;
};

const readTileFromMeta = (
  meta: Buffer,
  tilesData: Buffer[],
  palette: Palette[],
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
          tilesData[pointer],
          palette[paletteIndex],
        );

        if ((attr & 0x4000) > 0) {
          smallLevelTile.flip('horizontal');
        }
        if ((attr & 0x8000) > 0) {
          smallLevelTile.flip('vertical');
        }

        for (let x2 = 0; x2 < smallLevelTile.width; x2++) {
          for (let y2 = 0; y2 < smallLevelTile.height; y2++) {
            largeLevelTile.set(y + x2, x + y2, smallLevelTile.get(x2, y2));
          }
        }
      }
    }

    result.push(largeLevelTile);
  }

  return result;
};

const getSmallLevelTile = (tileData: Buffer, palette: Palette) => {
  const pixels = parseTilePixels(tileData);
  return buildImageFromPixelsAndPalette(pixels, palette.colors, 0);
};

const readTileMap = (romData: Buffer) => {
  const jungleBoundStart = 0xd91500;
  const jungleBoundEnd = 0xd91700;

  const jungleTileMapSize = jungleBoundEnd - jungleBoundStart;
  const jungleTileMapAddress = RomAddress.fromSnesAddress(0xd90000);

  const rawTileMap = extract(
    romData,
    jungleTileMapAddress.pcAddress,
    jungleTileMapSize,
  );

  let length = rawTileMap.length;
  // Array has 2 bytes per tile
  length /= 2;
  // Divide out tiles per column
  length /= 0x10;
  const result = new Matrix<number>(length, 0x10, 0);

  let offset = 0;
  for (let x = 0; x < length; x++) {
    for (let y = 0; y < 16; y++) {
      const pointer = read16(rawTileMap, offset);

      result.set(x, y, pointer);
      offset += 2;
    }
  }

  return result;
};

const buildLevel = (tileMap: Matrix<number>, tileImages: Image[]) => {
  const result = new Matrix<Color | null>(
    tileMap.width * 32,
    tileMap.width * 32,
    null,
  );

  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tileInfo = tileMap.get(x, y);

      const tileIndex = tileInfo & 0x3ff;
      const tileImage = tileImages[tileIndex].clone();

      if ((tileInfo & 0x4000) > 0) {
        tileImage.flip('horizontal');
      }
      if ((tileInfo & 0x8000) > 0) {
        tileImage.flip('vertical');
      }

      for (let x2 = 0; x2 < tileImage.width; x2++) {
        for (let y2 = 0; y2 < tileImage.height; y2++) {
          result.set(x * 32 + x2, y * 32 + y2, tileImage.get(x2, y2));
        }
      }
    }
  }

  return result;
};
