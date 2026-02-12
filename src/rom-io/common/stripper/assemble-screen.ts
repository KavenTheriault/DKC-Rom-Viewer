export function assembleScreen(
  bitplane: Buffer,
  rawLen: number,
  width: number,
): { out: Uint8Array; pixelWidth: number; pixelHeight: number } {
  const height = Math.floor(rawLen / 2 / width);

  const pixelWidth = width * 8;
  const pixelHeight = height * 8;

  // == width * height tiles * 256 bytes per tile
  const out = new Uint8Array(width * height * 256);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      for (let k = 0; k < 8; k++) {
        const dst = i * 8192 + j * 32 + k * 1024;
        const src = i * 8192 + j * 256 + k * 32;

        out.set(bitplane.subarray(src, src + 32), dst);
      }
    }
  }

  return { out, pixelWidth, pixelHeight };
}
