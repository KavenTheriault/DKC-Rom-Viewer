import { read16 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { Color } from '../../types/color';
import { Palette } from './types';

const SPRITE_PALETTE_LENGTH = 15;

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
  const increment = 256 / SPRITE_PALETTE_LENGTH;
  for (let i = 0; i < SPRITE_PALETTE_LENGTH; i++) {
    const grayTone = Math.floor(i * increment);
    palette.push({ r: grayTone, g: grayTone, b: grayTone });
  }
  return palette;
};

export const readPalette = (
  romData: Buffer,
  paletteAddress: RomAddress,
  paletteLength: number = SPRITE_PALETTE_LENGTH,
): Palette => {
  const colors: Color[] = [];
  for (let i = 0; i < paletteLength; i++) {
    const value: number = read16(romData, paletteAddress.pcAddress + i * 2);
    colors.push(snesToColor(value));
  }
  return { address: paletteAddress, colors: colors };
};

export const readPalettes = (
  romData: Buffer,
  palettesAddress: RomAddress,
  paletteQuantity: number,
  paletteLength: number,
): Palette[] => {
  const palettes: Palette[] = [];
  for (let i = 0; i < paletteQuantity; i++) {
    const paletteAddress = palettesAddress.getOffsetAddress(
      i * paletteLength * 2,
    );
    const palette = readPalette(romData, paletteAddress, paletteLength);
    palettes.push(palette);
  }
  return palettes;
};
