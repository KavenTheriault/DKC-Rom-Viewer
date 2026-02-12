import { Buffer as WebBuffer } from 'buffer';

export const alloc = (
  size: number,
  fill: string | Uint8Array | number = 0,
): Buffer => {
  return WebBuffer.alloc(size, fill);
};
