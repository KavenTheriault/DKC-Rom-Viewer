export function decodePalette(
  rom: Buffer | Uint8Array,
  count: number,
): Uint8Array {
  const rgb = new Uint8Array(count * 3);

  for (let i = 0; i < count; i++) {
    const low = rom[i * 2] & 0xff;
    const high = rom[i * 2 + 1] & 0xff;

    rgb[i * 3] = (low & 0x1f) * 8;
    rgb[i * 3 + 1] = ((((low & 0xe0) >> 5) + ((high & 0x03) << 3)) * 8) & 0xff;
    rgb[i * 3 + 2] = (((high & 0x7c) >> 2) * 8) & 0xff;
  }

  return rgb;
}
