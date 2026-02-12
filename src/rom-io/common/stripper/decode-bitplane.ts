import { alloc } from './buffer-helper';
import { decodePalette } from './decode-palette';
import { decodeTile } from './decode-tile';

export function decodeBitplane(
  rom: Buffer,
  bpData: Buffer,
  rawData: Buffer,
  bitplane: Buffer, // RGBA output buffer
  palAddr: number,
  rawLen: number,
  bpLen: number,
  mode: number,
  bg: number,
): Buffer {
  const palData = alloc(0x200);
  rom.copy(palData as unknown as Uint8Array, 0, palAddr, palAddr + 0x200);

  const rgb = decodePalette(palData, 128);

  if (mode === 1) {
    const tiles = Math.floor(rawLen / 32);
    for (let i = 0; i < tiles; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          const rawAddress = i * 32 + j * 2 + k * 8;
          const bpOfs = i * 4096 + j * 32 + k * 1024;

          decodeTile(
            bpData,
            rawData,
            rgb,
            bitplane,
            rawAddress,
            bpOfs,
            bpLen,
            1,
            bg,
          );
        }
      }
    }
  } else {
    // mode === 2 || mode === 3
    const tiles = Math.floor(rawLen / 2);
    for (let i = 0; i < tiles; i++) {
      const rawAddress = i * 2;
      const bpOfs = i * 256;

      decodeTile(
        bpData,
        rawData,
        rgb,
        bitplane,
        rawAddress,
        bpOfs,
        bpLen,
        mode,
        bg,
      );
    }
  }

  return bitplane;
}
