export const decodeTile = (
  bpData: Buffer,
  rawData: Buffer,
  rgb: Uint8Array, // length should be 384 (128 colors * 3)
  bitplane: Buffer, // RGBA output buffer
  rawAddress: number,
  bpOfs: number,
  bpLen: number,
  mode: number,
  bg: number,
): void => {
  const low = rawData[rawAddress + 1] >>> 0;
  let high = rawData[rawAddress] >>> 0;

  let palOfs = 0;
  let vFlip = 0;
  let hFlip = 0;
  let priority = 0;

  if (low & 1) high += 256;
  if (low & 2) high += 512;
  if (low & 4) palOfs += 1;
  if (low & 8) palOfs += 2;
  if (low & 16) palOfs += 4;
  if (low & 32) priority = 1;
  if (low & 64) hFlip = 1;
  if (low & 128) vFlip = 1;

  let imgOfs: number;
  if (mode === 3) {
    imgOfs = high * 16; // 2bpp
  } else {
    imgOfs = high * 32; // 4bpp
  }

  let override = 0;
  if (imgOfs > bpLen) override = 1; // Edge case. (Skidda's Row)

  if (mode === 3) {
    palOfs *= 4; // 2bpp
  } else {
    palOfs *= 16; // 4bpp
  }

  const bits = [128, 64, 32, 16, 8, 4, 2, 1];
  const outOfs = mode === 1 ? 128 : 32;

  let xPos = 0;
  let yPos = 0;

  for (let i = 0; i < 8; i++) {
    const one = bpData[imgOfs + i * 2];
    const two = bpData[imgOfs + i * 2 + 1];

    // Only used for 4bpp
    const three = mode !== 3 ? bpData[imgOfs + i * 2 + 16] : 0;
    const four = mode !== 3 ? bpData[imgOfs + i * 2 + 17] : 0;

    if (vFlip === 1) i = 7 - i; // mutates loop index when flipped

    for (let j = 0; j < 8; j++) {
      let value = 0;

      if ((one & bits[j]) === bits[j]) value += 1;
      if ((two & bits[j]) === bits[j]) value += 2;

      if (mode !== 3) {
        if ((three & bits[j]) === bits[j]) value += 4;
        if ((four & bits[j]) === bits[j]) value += 8;
      }

      if (override === 1) value = 0;

      if (xPos >= 8) {
        xPos = 0;
        yPos++;
      }
      if (yPos >= 8) yPos = 0;

      if (hFlip === 1) j = 7 - j;

      const px = bpOfs + i * outOfs + j * 4;

      if (bg & 2 && priority === 0) {
        // Don't draw background tiles.
        bitplane[px] = 255;
        bitplane[px + 1] = 255;
        bitplane[px + 2] = 255;
        bitplane[px + 3] = 0;
      } else if (bg & 4 && priority === 1) {
        // Don't draw foreground tiles.
        bitplane[px] = 255;
        bitplane[px + 1] = 255;
        bitplane[px + 2] = 255;
        bitplane[px + 3] = 0;
      } else if (bg & 1 && value === 0) {
        // Opaque pixel (for special screen backgrounds)
        bitplane[px] = rgb[0];
        bitplane[px + 1] = rgb[1];
        bitplane[px + 2] = rgb[2];
        bitplane[px + 3] = 255;
      } else if (value === 0 || value % 16 === 0) {
        // Transparent pixel (for almost everything else)
        bitplane[px] = 255;
        bitplane[px + 1] = 255;
        bitplane[px + 2] = 255;
        bitplane[px + 3] = 0;
      } else {
        // Normal
        const base = (palOfs + value) * 3;
        bitplane[px] = rgb[base]; // R
        bitplane[px + 1] = rgb[base + 1]; // G
        bitplane[px + 2] = rgb[base + 2]; // B
        bitplane[px + 3] = 255; // A
      }

      xPos++;

      if (hFlip === 1) j = 7 - j; // undo the j mutation (matches C)
    }

    if (vFlip === 1) i = 7 - i; // undo the i mutation (matches C)
  }
};
