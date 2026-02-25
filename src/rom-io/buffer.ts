export const extract = (buffer: Uint8Array, position: number, length: number) =>
  buffer.subarray(position, position + length);

export const read8 = (buffer: Uint8Array, position: number) => {
  const bytes = extract(buffer, position, 1);
  return bytes[0];
};

export const read16 = (buffer: Uint8Array, position: number) => {
  const bytes = extract(buffer, position, 2);
  return (bytes[1] << 8) | bytes[0];
};

export const read24 = (buffer: Uint8Array, position: number) => {
  const bytes = extract(buffer, position, 3);
  return (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
};

export const read32 = (buffer: Uint8Array, position: number) => {
  const bytes = extract(buffer, position, 4);
  return (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
};
