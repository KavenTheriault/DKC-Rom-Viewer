import { RomAddress } from '../../../rom/address';
import { BPP } from '../../../types/bpp';
import { Color } from '../../../types/color';
import { ImageMatrix } from '../../../types/image-matrix';
import { Matrix } from '../../../types/matrix';
import { readOpcodeEntry, readOpcodeUntil } from '../entrance-info/asm/read';
import {
  filterOpcodeEntryByValue,
  findArgumentInPreviousOpcodes,
  findOpcodeEntryByValue,
  readOpcodeEntryValue,
} from '../entrance-info/utils';
import { decodeTilesFromSpec } from '../spec';
import { DecodeTileOptions } from '../tiles/decode-tile';
import { GameLevelConstant, TilesDecodeSpec } from '../types';
import { readNonLevelEntranceInfo } from './common';
import { ServiceInfo } from './types';

export const readServiceInfo = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  entranceId: number,
): ServiceInfo | undefined => {
  const nonLevelEntranceInfo = readNonLevelEntranceInfo(
    romData,
    levelConstant,
    entranceId,
  );
  if (nonLevelEntranceInfo?.type !== 'service') return;

  const jumpOpcode = readOpcodeEntry(
    romData,
    nonLevelEntranceInfo.branchAddress,
  );
  const absolute = readOpcodeEntryValue(jumpOpcode);
  const loadServiceAddress = RomAddress.fromBankAndAbsolute(
    nonLevelEntranceInfo.branchAddress.bank,
    absolute,
  );

  const opcodeEntries = readOpcodeUntil(
    romData,
    loadServiceAddress,
    undefined,
    {
      readLimit: 50,
      skipAllJump: true,
    },
  );

  const loadVramSubroutines = filterOpcodeEntryByValue(
    opcodeEntries,
    RomAddress.fromSnesAddress(0xb999ad).snesAddress,
  );
  const loadPaletteSubroutine = findOpcodeEntryByValue(
    opcodeEntries,
    levelConstant.subroutines.loadTerrainPalette.snesAddress,
  );
  if (!loadPaletteSubroutine) {
    throw new Error(
      `Can't find subroutine (${levelConstant.subroutines.loadTerrainPalette})`,
    );
  }

  const vramTransfers: {
    address: RomAddress;
    length: number;
  }[] = [];
  for (const loadVramSubroutine of loadVramSubroutines) {
    const bank = findArgumentInPreviousOpcodes(
      opcodeEntries,
      loadVramSubroutine,
      'LDX',
    );
    const absolute = findArgumentInPreviousOpcodes(
      opcodeEntries,
      loadVramSubroutine,
      'LDA',
    );
    const length = findArgumentInPreviousOpcodes(
      opcodeEntries,
      loadVramSubroutine,
      'LDY',
    );
    const address = RomAddress.fromBankAndAbsolute(bank, absolute);
    vramTransfers.push({
      address,
      length,
    });
  }

  const paletteAbsolute = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadPaletteSubroutine,
    'LDA',
  );
  const paletteAddress = RomAddress.fromBankAndAbsolute(
    levelConstant.banks.terrainPalette,
    paletteAbsolute,
  );

  const specCount = Math.floor(vramTransfers.length / 2);
  const offset = vramTransfers.length >= 3 ? 2 : 1;

  const specs: TilesDecodeSpec[] = [];
  for (let i = 0; i < specCount; i++) {
    specs.push({
      tileset: vramTransfers[i],
      tilemap: vramTransfers[i + offset],
      paletteAddress,
      bpp: BPP.Four,
      tilesPerRow: 32,
    });
  }

  return {
    backgroundSpecs: specs,
  };
};

export const buildServiceImage = (
  romData: Uint8Array,
  serviceInfo: ServiceInfo,
  decodeTileOptions?: DecodeTileOptions,
): ImageMatrix => {
  const options: DecodeTileOptions = {
    ...decodeTileOptions,
    opaqueZero: false,
  };

  const allMatrix = serviceInfo.backgroundSpecs.map((spec) =>
    decodeTilesFromSpec(romData, spec, options),
  );
  const width = Math.max(...allMatrix.map((m) => m.width));
  const height = Math.max(...allMatrix.map((m) => m.height));

  if (decodeTileOptions?.opaqueZero) {
    allMatrix.unshift(
      new Matrix<Color | null>(width, height, { r: 0, g: 0, b: 0 }),
    );
  }

  const imageMatrix = new Matrix<Color | null>(width, height, null);
  for (const matrix of allMatrix) {
    for (let x = 0; x < matrix.width; x++) {
      for (let y = 0; y < matrix.height; y++) {
        const pixel = matrix.get(x, y);
        if (pixel) {
          imageMatrix.set(x, y, pixel);
        }
      }
    }
  }
  return imageMatrix;
};
