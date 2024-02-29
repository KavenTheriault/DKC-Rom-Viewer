import { RomAddress } from '../types/address';
import { Color, Image } from '../sprites/types';
import { read16 } from '../utils/buffer';

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
  pixels: number[][],
  palette: Color[],
): Image => {
  const width: number = pixels.length;
  const height: number = pixels[0].length;
  const coloredPixels: Image = new Array(width)
    .fill(0)
    .map(() => new Array(height).fill(0));

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const paletteIdx: number = pixels[x][y];
      coloredPixels[x][y] = paletteIdx !== 0 ? palette[paletteIdx - 1] : null;
    }
  }

  return coloredPixels;
};

export const palettePointerToSnesAddress = (
  palettePointer: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(0x3c0000 | palettePointer);
};
