import { chunk } from 'lodash';

export const toHexString = (
  val: number,
  options: { addPrefix: boolean } = { addPrefix: false },
) => {
  const hexString = val.toString(16).toString().toUpperCase();
  if (options.addPrefix) return '0x' + hexString;
  else return hexString;
};

const toHexColor = (component: number) => {
  const hex = component.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
};

export const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + toHexColor(r) + toHexColor(g) + toHexColor(b);
};

export const isHexadecimal = (str: string) => /^[0-9A-F]+$/.test(str);

export const bufferToString = (bytes: Buffer): string => {
  const lines = [];
  const allBytes = Array.from(hexFormatValues(bytes));
  for (const line of chunk(allBytes, 32)) {
    lines.push(line.join(' '));
  }
  return lines.join('\n').toUpperCase();
};

const hexFormatValues = function* (buffer: Buffer) {
  for (const x of buffer) {
    const hex = x.toString(16);
    yield hex.padStart(2, '0');
  }
};
