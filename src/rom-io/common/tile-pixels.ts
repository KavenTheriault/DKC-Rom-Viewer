import { BPP } from '../types/bpp';
import { Matrix } from '../types/matrix';

export const parseTilePixels = (
  pixelData: number[],
  bpp: BPP = BPP.Four,
): Matrix<number> => {
  const pixels = new Matrix(8, 8, 0);

  switch (bpp) {
    case BPP.Two:
      {
        for (let row = 0; row < 8; row++) {
          const offset = row * 2;
          const plane0 = pixelData[offset];
          const plane1 = pixelData[offset + 1];

          for (let column = 0; column < 8; column++) {
            const bitShift: number = 7 - column;
            const bit0 = (plane0 >> bitShift) & 0b1;
            const bit1 = (plane1 >> bitShift) & 0b1;

            const val = (bit1 << 1) | bit0;
            pixels.set(column, row, val);
          }
        }
      }
      break;
    case BPP.Four:
      {
        for (let row = 0; row < 8; row++) {
          const offset: number = row * 2;
          const rowBitplanes: number[] = [
            pixelData[offset],
            pixelData[0x01 + offset],
            pixelData[0x10 + offset],
            pixelData[0x11 + offset],
          ];

          for (let column = 0; column < 8; column++) {
            const bitShift: number = 7 - column;
            const pixelBits: number[] = [
              (rowBitplanes[3] >> bitShift) & 0b1,
              (rowBitplanes[2] >> bitShift) & 0b1,
              (rowBitplanes[1] >> bitShift) & 0b1,
              (rowBitplanes[0] >> bitShift) & 0b1,
            ];
            const val =
              (pixelBits[0] << 3) |
              (pixelBits[1] << 2) |
              (pixelBits[2] << 1) |
              pixelBits[3];
            pixels.set(column, row, val);
          }
        }
      }
      break;
  }

  return pixels;
};
