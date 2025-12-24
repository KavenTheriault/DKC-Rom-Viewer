import { SNES_PUBLISHERS } from './publishers';
import { REGIONS_VIDEO_OUTPUT, SNES_REGIONS } from './regions';
import { getChipset } from './chipsets';
import { extract } from '../../buffer';

const HEADER_LENGTH = 48;
const UNKNOWN = 'Unknown';

export interface RomHeader {
  title: string;
  speed: 'Slow' | 'Fast';
  type: RomType;
  chipset: string;
  size: string;
  ramSize: string;
  region: string;
  videoOutput: string;
  publisher: string;
  version: string;
  checksum: number;
  checksumCompliment: number;
}

enum RomType {
  LoROM = 'LoROM',
  HiROM = 'HiROM',
  ExHiROM = 'ExHiROM',
}

const RomTypeHeaderValue: Record<number, RomType> = {
  0: RomType.LoROM,
  1: RomType.HiROM,
  3: RomType.LoROM,
  5: RomType.ExHiROM,
};

const HeaderLocation: Record<RomType, number> = {
  [RomType.LoROM]: 0x007fb0,
  [RomType.HiROM]: 0x00ffb0,
  [RomType.ExHiROM]: 0x40ffb0,
};

const computeRomChecksum = (romData: Buffer) => {
  let checksum = 0x0000;
  for (let i = 0; i < romData.length; i++) {
    // 16-bit - Overflow is discarded
    checksum = (checksum + romData[i]) & 0xffff;
  }
  return checksum;
};

const getHeaderChecksums = (headerData: Buffer) => {
  const checksumCompliment = (headerData[45] << 8) | headerData[44];
  const checksum = (headerData[47] << 8) | headerData[46];
  return {
    checksum,
    checksumCompliment,
  };
};

const isValidChecksums = (
  computedChecksum: number,
  headerChecksum: number,
  headerChecksumCompliment: number,
): boolean => {
  if (computedChecksum !== headerChecksum) return false;
  return headerChecksum + headerChecksumCompliment === 0xffff;
};

const findRomType = (romData: Buffer): RomType => {
  const computedChecksum = computeRomChecksum(romData);
  for (const romType in RomType) {
    const headerLocation = HeaderLocation[romType as RomType];
    const headerData: Buffer = extract(romData, headerLocation, HEADER_LENGTH);
    const { checksum, checksumCompliment } = getHeaderChecksums(headerData);
    if (isValidChecksums(computedChecksum, checksum, checksumCompliment)) {
      return romType as RomType;
    }
  }
  throw new Error('Unable to find Rom Type - Checksum invalid');
};

const getCompanyCode = (headerData: Buffer) => {
  let firstPart: number, secondPart: number;
  if (headerData[42] != 0x33) {
    firstPart = (headerData[42] >> 4) & 0x0f;
    secondPart = headerData[42] & 0x0f;
  } else {
    // No idea how this works - https://github.com/snes9xgit/snes9x/blob/master/memmap.cpp#L2043
    const l = String.fromCharCode(headerData[0]).toUpperCase().charCodeAt(0);
    const r = String.fromCharCode(headerData[1]).toUpperCase().charCodeAt(0);
    firstPart =
      l > '9'.charCodeAt(0) ? l - '7'.charCodeAt(0) : l - '0'.charCodeAt(0);
    secondPart =
      r > '9'.charCodeAt(0) ? r - '7'.charCodeAt(0) : r - '0'.charCodeAt(0);
  }
  return firstPart * 36 + secondPart;
};

export const getRomHeader = (romData: Buffer): RomHeader => {
  const romType: RomType = findRomType(romData);
  const headerData: Buffer = extract(
    romData,
    HeaderLocation[romType],
    HEADER_LENGTH,
  );

  const rawSpeed = (headerData[37] & 0b00010000) >> 4;
  const rawType = headerData[37] & 0b00001111;
  const rawChipset = headerData[38];
  const rawSize = headerData[39];
  const rawRamSize = headerData[40];
  const rawRegion = headerData[41];
  const companyCode = getCompanyCode(headerData);
  const rawVersion = headerData[43];
  const { checksum, checksumCompliment } = getHeaderChecksums(headerData);

  return {
    title: extract(headerData, 16, 21).toString('ascii'),
    speed: rawSpeed === 1 ? 'Fast' : 'Slow',
    type: RomTypeHeaderValue[rawType],
    chipset: getChipset(rawChipset) || UNKNOWN,
    size: `${(1 << rawSize) / 128} MBit`, // Convert KByte to MBit
    ramSize: `${1 << rawRamSize} KByte`,
    region: SNES_REGIONS[rawRegion] || UNKNOWN,
    videoOutput: REGIONS_VIDEO_OUTPUT[rawRegion] || UNKNOWN,
    publisher: SNES_PUBLISHERS[companyCode] || UNKNOWN,
    version: `1.${rawVersion}`,
    checksum: checksum,
    checksumCompliment: checksumCompliment,
  };
};
