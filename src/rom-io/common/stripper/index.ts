import { Color } from '../../types/color';
import { Matrix } from '../../types/matrix';
import { assembleScreen } from './assemble-screen';
import { alloc } from './buffer-helper';
import { decodeBitplane } from './decode-bitplane';

export interface DKC_LEVEL {
  bp_len: number; // uint16
  raw_len: number; // uint16
  bp_ofs: number; // uint16
  raw_ofs: number; // uint16
  bp_addr: number; // uint32 (C: unsigned)
  raw_addr: number; // uint32 (C: unsigned)
  palette: number; // uint32 (C: unsigned)
  mode: number; // uint8
  name: string; // C: char*
}

export const testStripper = (rom: Buffer) => {
  const spec: DKC_LEVEL = {
    bp_len: 0x1800,
    raw_len: 0x800,
    bp_ofs: 0,
    raw_ofs: 0,
    bp_addr: 0x238bfb,
    raw_addr: 0x2383fb,
    palette: 0x39c623,
    mode: 3,
    name: 'Forest BG3',
  };
  const spec2: DKC_LEVEL = {
    bp_len: 0x400,
    raw_len: 0x2000,
    bp_ofs: 0,
    raw_ofs: 0,
    bp_addr: 0x27fce9,
    raw_addr: 0x27dce9,
    palette: 0x39a01c,
    mode: 3,
    name: 'Cave FG3',
  };

  return bitplaneOnly(rom, spec2);
};

const bitplaneOnly = (rom: Buffer, d: DKC_LEVEL) => {
  const bitplane = alloc(0x10a000, 0); // zero-filled like calloc

  // These are "views" into the same underlying memory, like pointer offsets in C.
  const bpData = bitplane.subarray(0x100000);
  const rawData = bitplane.subarray(0x108000);

  // If you want them to be capped to the original intended regions, slice lengths explicitly:
  // const bpDataSized = bitplane.subarray(0x100000, 0x108000); // 0x8000 bytes
  // const rawDataSized = bitplane.subarray(0x108000, 0x10a000); // 0x2000 bytes

  rom.copy(
    bpData as unknown as Uint8Array,
    d.bp_ofs,
    d.bp_addr,
    d.bp_addr + d.bp_len,
  );
  rom.copy(
    rawData as unknown as Uint8Array,
    d.raw_ofs,
    d.raw_addr,
    d.raw_addr + d.raw_len,
  );

  decodeBitplane(
    rom,
    bpData,
    rawData,
    bitplane,
    d.palette,
    d.raw_len + d.raw_ofs,
    d.bp_len + d.bp_ofs,
    d.mode,
    0, // I have no idea what this if for
  );
  const { out, pixelWidth, pixelHeight } = assembleScreen(
    bitplane,
    d.raw_len,
    32,
  );

  const matrix = outToColorMatrix(out, pixelWidth, pixelHeight);

  console.log('DEBUG not crashing');
  console.log(matrix);

  return matrix;
};

export function outToColorMatrix(
  out: Uint8Array,
  pixelWidth: number,
  pixelHeight: number,
): Matrix<Color | null> {
  // `out` is RGBA, 4 bytes per pixel
  if (out.length < pixelWidth * pixelHeight * 4) {
    throw new Error(
      `out buffer too small: got ${out.length}, need ${pixelWidth * pixelHeight * 4}`,
    );
  }

  const m = new Matrix<Color | null>(pixelWidth, pixelHeight, null);

  for (let y = 0; y < pixelHeight; y++) {
    for (let x = 0; x < pixelWidth; x++) {
      const idx = (y * pixelWidth + x) * 4;
      // Ignore alpha; just take RGB
      if (out[idx + 3] !== 0) {
        m.set(x, y, { r: out[idx], g: out[idx + 1], b: out[idx + 2] });
      }
    }
  }

  return m;
}
