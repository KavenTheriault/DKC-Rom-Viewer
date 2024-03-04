import { Buffer } from 'buffer';
import { extract } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { chunk } from 'lodash';
import {
  parsePixels,
  TILE_DATA_LENGTH,
} from '../../../rom-parser/sprites/tile';
import { Array2D, Image } from '../../../rom-parser/sprites/types';
import {
  buildImageFromPixelsAndPalette,
  readPalette,
} from '../../../rom-parser/palette';
import { ImageCanvas } from '../../../components/image-canvas';
import { create2DArray } from '../../../rom-parser/utils/array';

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const test = RomAddress.fromSnesAddress(0xd58fc0);
  const data = extract(selectedRom.data, test.pcAddress, 0x10000);
  const test2 = decompressDKC1(data);

  const tilesData = chunk(test2, TILE_DATA_LENGTH);
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
  const image: Image = buildImageFromPixelsAndPalette(allPixels, palette);

  return (
    <div className="columns">
      <pre>
        {tiles.length}
        {'|'}
        {totalTilesToShow / 32}
      </pre>
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
