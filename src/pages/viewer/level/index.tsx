import { Buffer } from 'buffer';
import { extract } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { ImageCanvas } from '../../../components/image-canvas';
import { Array2D, Image } from '../../../rom-parser/sprites/types';
import { create2DArray } from '../../../rom-parser/utils/array';
import {
  buildImageFromPixelsAndPalette,
  grayscalePalette,
} from '../../../rom-parser/palette';
import { parsePixelsV2 } from '../../../rom-parser/sprites/tile';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const test = RomAddress.fromSnesAddress(0x231180);
  const data = extract(selectedRom.data, test.pcAddress, 0x10000);
  const decompressedBitplane = decompressDKC1(data);

  const bitplaneTitles = extractBitplaneTiles(
    Buffer.from(decompressedBitplane),
  );
  const combinedTiles = combineBitplaneTiles(bitplaneTitles);

  const palette = grayscalePalette();
  const image: Image = buildImageFromPixelsAndPalette(combinedTiles, palette);

  return (
    <div className="columns">
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
