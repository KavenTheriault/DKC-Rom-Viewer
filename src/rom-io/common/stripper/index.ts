import { extract } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { readPalette } from '../palettes';
import { assembleTiles } from '../tiles';
import { decodeTiles } from './decode-tiles';
import { BPP } from './decode-tile';

export interface GraphicInfo {
  bitplane: {
    address: RomAddress;
    length: number;
    offset?: number;
  };
  tileMeta: {
    address: RomAddress;
    length: number;
  };
  paletteAddress: RomAddress;
  bpp: BPP;
}

export const testStripperMode3 = (rom: Buffer) => {
  const forest: GraphicInfo = {
    bitplane: {
      address: RomAddress.fromSnesAddress(0x238bfb),
      length: 0x1800,
    },
    tileMeta: {
      address: RomAddress.fromSnesAddress(0x2383fb),
      length: 0x800,
    },
    paletteAddress: RomAddress.fromSnesAddress(0x39c623),
    bpp: BPP.Two,
  };
  return bitplaneOnly(rom, forest);
};

export const testStripperMode3_2 = (rom: Buffer) => {
  const temple: GraphicInfo = {
    bitplane: {
      address: RomAddress.fromSnesAddress(0x14eb52),
      length: 0x1300,
    },
    tileMeta: {
      address: RomAddress.fromSnesAddress(0x14df52),
      length: 0x800,
    },
    paletteAddress: RomAddress.fromSnesAddress(0x39b3a3),
    bpp: BPP.Two,
  };
  return bitplaneOnly(rom, temple);
};

export const testStripperMode2 = (rom: Buffer) => {
  const overworld: GraphicInfo = {
    bitplane: {
      address: RomAddress.fromSnesAddress(0x0116f1),
      length: 0x7000,
    },
    tileMeta: {
      address: RomAddress.fromSnesAddress(0x010ff0),
      length: 0x700,
    },
    paletteAddress: RomAddress.fromSnesAddress(0x39be03),
    bpp: BPP.Four,
  };

  return bitplaneOnly(rom, overworld);
};

export const testStripperMode2WithOffset = (rom: Buffer) => {
  const treeTopTown: GraphicInfo = {
    bitplane: {
      address: RomAddress.fromSnesAddress(0xc3bfe),
      length: 0x21a0,
      offset: 0xe60,
    },
    tileMeta: {
      address: RomAddress.fromSnesAddress(0xc33fe),
      length: 0x800,
    },
    paletteAddress: RomAddress.fromSnesAddress(0x39b2a3),
    bpp: BPP.Four,
  };
  return bitplaneOnly(rom, treeTopTown);
};

export const testStripperMode2WithRawOffset = (rom: Buffer) => {
  const nintendo: GraphicInfo = {
    bitplane: {
      address: RomAddress.fromSnesAddress(0x240690),
      length: 0x2000,
    },
    tileMeta: {
      address: RomAddress.fromSnesAddress(0x240450),
      length: 0x280,
    },
    paletteAddress: RomAddress.fromSnesAddress(0x39c203),
    bpp: BPP.Four,
  };
  return bitplaneOnly(rom, nintendo);
};

const bitplaneOnly = (romData: Buffer, d: GraphicInfo) => {
  const bitplaneOffset = d.bitplane.offset ?? 0;
  const bitplaneData = new Uint8Array(bitplaneOffset + d.bitplane.length);
  bitplaneData.set(
    extract(romData, d.bitplane.address.pcAddress, d.bitplane.length),
    bitplaneOffset,
  );
  const palette = readPalette(romData, d.paletteAddress, 128);

  const tiles = decodeTiles({
    romData,
    bitplaneData,
    palette,
    tilesMetaAddress: d.tileMeta.address,
    tilesMetaLength: { dataLength: d.tileMeta.length },
    bpp: d.bpp,
    options: {
      opaqueZero: true,
    },
  });
  return assembleTiles(tiles, 32);
};
