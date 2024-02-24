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
