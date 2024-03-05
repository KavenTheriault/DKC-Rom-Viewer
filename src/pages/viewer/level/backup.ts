import { Buffer } from 'buffer';

const decodeBitplane = (decompressedBitplane: Buffer, forestData: Buffer) => {
  const raw_len = forestData.length / 32;
  for (let i = 0; i < raw_len; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        // j * 32 => Because 8 pixels multiply by 4 times (k)
        // k * 1024 => Because 8 pixels multiply by 4 then multiply by 32
        // i * 4096 => 8 * 4 * 32 * 4
        decodeTile(
          decompressedBitplane,
          forestData,
          i * 32 + j * 2 + k * 8,
          i * 4096 + j * 32 + k * 1024,
        );
      }
    }
  }
};

const decodeTile = (
  decompressedBitplane: Buffer,
  forestData: Buffer,
  dataAddress: number,
  bitplaneOffset: number,
) => {
  const low = forestData[dataAddress + 1];
  let high = forestData[dataAddress];

  let pal_ofs = 0,
    vflip = 0,
    hflip = 0,
    priority = 0;

  if (low & 1) high += 256;
  if (low & 2) high += 512;
  if (low & 4) pal_ofs += 1;
  if (low & 8) pal_ofs += 2;
  if (low & 16) pal_ofs += 4;
  if (low & 32) priority = 1;
  if (low & 64) hflip = 1;
  if (low & 128) vflip = 1;

  const img_ofs = high * 32;
  pal_ofs *= 16;
};
