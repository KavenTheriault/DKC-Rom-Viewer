import { RomAddress } from '../types/address';
import { Color, Image } from '../sprites/types';
import { read16 } from '../utils/buffer';
import { EntityPaletteBank } from '../constants/dkc1';
import { Matrix } from '../../types/matrix';

const PALETTE_LENGTH = 15;

export const colorToSnes = (color: Color): number => {
  let r: number = color.r;
  let g: number = color.g;
  let b: number = color.b;

  r >>= 3;
  g >>= 3;
  b >>= 3;

  return (r << 0) | (g << 5) | (b << 10);
};

export const snesToColor = (rawSnes: number): Color => {
  // Pattern is: XBBBBBGGGGGRRRRR
  const r: number = ((rawSnes >> 0) & 0x1f) << 3;
  const g: number = ((rawSnes >> 5) & 0x1f) << 3;
  const b: number = ((rawSnes >> 10) & 0x1f) << 3;
  return { r, g, b };
};

export const grayscalePalette = (): Color[] => {
  const palette: Color[] = [];
  const increment = 256 / PALETTE_LENGTH;
  for (let i = 0; i < PALETTE_LENGTH; i++) {
    const grayTone = Math.floor(i * increment);
    palette.push({ r: grayTone, g: grayTone, b: grayTone });
  }
  return palette;
};

export const readPalette = (
  romData: Buffer,
  paletteAddress: RomAddress,
): Color[] => {
  const palette: Color[] = [];
  for (let i = 0; i < PALETTE_LENGTH; i++) {
    const value: number = read16(romData, paletteAddress.pcAddress + i * 2);
    palette.push(snesToColor(value));
  }
  return palette;
};

export const buildImageFromPixelsAndPalette = (
  pixels: Matrix<number>,
  palette: Color[],
): Image => {
  const width: number = pixels.width;
  const height: number = pixels.height;
  const coloredPixels = new Matrix<Color | null>(width, height, null);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const paletteIdx: number = pixels.get(x, y);
      if (paletteIdx !== 0) coloredPixels.set(x, y, palette[paletteIdx - 1]);
    }
  }

  return coloredPixels;
};

export const paletteReferenceToSnesAddress = (
  paletteReference: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(EntityPaletteBank | paletteReference);
};

export const snesAddressToPaletteReference = (romAddress: RomAddress) => {
  return romAddress.snesAddress & 0x00ffff;
};
