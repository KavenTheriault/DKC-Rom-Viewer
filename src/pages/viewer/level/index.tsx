import { Buffer } from 'buffer';
import { extract, read16 } from '../../../rom-parser/utils/buffer';
import { ViewerModeBaseProps } from '../types';
import { RomAddress } from '../../../rom-parser/types/address';
import { combineMatrixIntoGrid, Matrix } from '../../../types/matrix';
import { parseTilePixels } from '../../../rom-parser/sprites/tile';
import {
  buildImageFromPixelsAndPalette,
  readPalettes,
} from '../../../rom-parser/palette';
import { Palette } from '../../../rom-parser/palette/types';
import { BitmapCanvas } from '../../../components/bitmap-canvas';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { convertToImageBitmap } from '../../../utils/image-bitmap';
import { Color, ImageMatrix } from '../../../types/image-matrix';
import { decompress } from '../../../rom-parser/level/compression';

const ScrollDiv = styled.div`
  overflow: scroll;
`;

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [bitmapImage, setBitmapImage] = useState<ImageBitmap>();

  useEffect(() => {
    const tileImages = extractLevelTiles(selectedRom.data);
    const tileMapImage = combineMatrixIntoGrid(tileImages);
    const tileMap = readTileMap(selectedRom.data);
    const levelImage = buildLevel(tileMap, tileImages);

    const loadImage = async () => {
      const res = await convertToImageBitmap(levelImage);
      setBitmapImage(res);
    };
    loadImage();
  }, []);

  return (
    <ScrollDiv>
      <BitmapCanvas
        image={bitmapImage}
        defaultSize={{ width: 256, height: 256 }}
      />
    </ScrollDiv>
  );
};

const extractLevelTiles = (romData: Buffer) => {
  const palettes = readPalettes(
    romData,
    RomAddress.fromSnesAddress(0xb9a1dc),
    8,
    16,
  );

  const decompressedChars = decompress(
    romData,
    RomAddress.fromSnesAddress(0xd58fc0),
  );
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

const getLevelSize = (romData: Buffer) => {
  const jungleLevelCode = 0x16;
  let tempX = jungleLevelCode << 1;

  const levelSizeAddress = RomAddress.fromSnesAddress(0xbc8000);
  tempX = read16(romData, levelSizeAddress.pcAddress + tempX) - 4;

  const lvlXBoundEnd = read16(
    romData,
    RomAddress.fromSnesAddress(0xbc0002).pcAddress + tempX,
  );
  const lvlXBoundStart = read16(
    romData,
    RomAddress.fromSnesAddress(0xbc0000).pcAddress + tempX,
  );

  return lvlXBoundEnd - lvlXBoundStart + 0x100;
};

const readTileMap = (romData: Buffer) => {
  const jungleTileMapSize = getLevelSize(romData);
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

const buildLevel = (tileMap: Matrix<number>, tileImages: ImageMatrix[]) => {
  const result = new Matrix<Color | null>(
    tileMap.width * 32,
    tileMap.height * 32,
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
