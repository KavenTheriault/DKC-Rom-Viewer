export const extract = (buffer: Buffer, position: number, length: number) =>
  buffer.subarray(position, position + length);

export const read8 = (buffer: Buffer, position: number) => {
  const bytes: Buffer = extract(buffer, position, 1);
  return bytes[0];
};

export const read16 = (buffer: Buffer, position: number) => {
  const bytes: Buffer = extract(buffer, position, 2);
  return (bytes[1] << 8) | bytes[0];
};

export const read32 = (buffer: Buffer, position: number) => {
  const bytes: Buffer = extract(buffer, position, 4);
  return (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
};
