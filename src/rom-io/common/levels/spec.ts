import { extract } from '../../buffer';
import { ImageMatrix } from '../../types/image-matrix';
import { readPalette } from '../palettes';
import { assembleImages } from './tiles/assemble';
import { decodeTiles } from './tiles/decode-tiles';
import { TilesDecodeSpec } from './types';

export const decodeTilesFromSpec = (
  romData: Buffer,
  spec: TilesDecodeSpec,
  tilesPerRow: number,
): ImageMatrix => {
  const bitplaneOffset = spec.bitplane.offset ?? 0;
  const bitplane = new Uint8Array(bitplaneOffset + spec.bitplane.length);
  bitplane.set(
    extract(romData, spec.bitplane.address.pcAddress, spec.bitplane.length),
    bitplaneOffset,
  );
  const palette = readPalette(romData, spec.paletteAddress, 128);

  const tiles = decodeTiles({
    romData,
    bitplane: bitplane,
    palette,
    tilesMetaAddress: spec.tileMeta.address,
    tilesMetaLength: { dataLength: spec.tileMeta.length },
    bpp: spec.bpp,
    options: {
      opaqueZero: true,
    },
  });
  return assembleImages(tiles, tilesPerRow);
};
