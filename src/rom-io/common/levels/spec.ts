import { extract } from '../../buffer';
import { Buffer } from '../../types/buffer';
import { ImageMatrix } from '../../types/image-matrix';
import { readPalette } from '../palettes';
import { assembleImages } from './tiles/assemble';
import { DecodeTileOptions } from './tiles/decode-tile';
import { decodeTiles } from './tiles/decode-tiles';
import { TilesDecodeSpec } from './types';

export const decodeTilesFromSpec = (
  romData: Buffer,
  spec: TilesDecodeSpec,
  decodeTileOptions?: DecodeTileOptions,
): ImageMatrix => {
  const tilesetOffset = spec.tileset.offset ?? 0;
  const tileset = new Uint8Array(tilesetOffset + spec.tileset.length);
  tileset.set(
    extract(romData, spec.tileset.address.pcAddress, spec.tileset.length),
    tilesetOffset,
  );
  const palette = readPalette(romData, spec.paletteAddress, 128);

  const tiles = decodeTiles({
    tileset,
    tilemap: {
      data: romData,
      address: spec.tilemap.address.pcAddress,
    },
    tilemapSize: { dataLength: spec.tilemap.length },
    palette,
    bpp: spec.bpp,
    options: decodeTileOptions,
  });
  return assembleImages(tiles, spec.tilesPerRow);
};
