import { Rom } from './types';
import { getRomHeader, RomHeader } from './header';

const ROM_HEADER_LENGTH = 512;

export const readRomFile = async (buffer: Buffer): Promise<Rom> => {
  try {
    const romData: Buffer = getRomData(buffer);
    const romHeader: RomHeader = getRomHeader(romData);

    return { header: romHeader, data: romData };
  } catch (e: unknown) {
    const errorMessage: string =
      e instanceof Error ? e.message : 'An error occurred';
    throw new Error(`Unable to read rom file: ${errorMessage}`);
  }
};

/* Remove Rom header data if present */
export const getRomData = (bytes: Buffer): Buffer => {
  return hasHeader(bytes)
    ? bytes.subarray(ROM_HEADER_LENGTH, bytes.length)
    : bytes;
};

/* The optional 512 bytes header of a Rom file
   Ref: https://snes.nesdev.org/wiki/ROM_file_formats */
const hasHeader = (bytes: Buffer): boolean => {
  // Rom file length without header should always be a division of 32768
  // If there are exactly 512 extra bytes, it means there's a file header
  return bytes.length % 0x8000 === ROM_HEADER_LENGTH;
};
