import { dropRightWhile } from 'lodash';
import { extract } from '../../buffer';
import { RomAddress } from '../../rom/address';

export const SPRITE_HEADER_LENGTH = 8;
export const VRAM_ROW_LENGTH = 16;

export type SpriteHeader = {
  tileQuantity: {
    large: number;
    small1: number;
    small2: number;
  };
  offsets: {
    small1Offset: number;
    small2Offset: number;
  };
  dma: {
    group1TileQty: number;
    group2Offset: number;
    group2TileQty: number;
  };
};

export const getSpriteTilesQuantity = (spriteHeader: SpriteHeader) =>
  spriteHeader.tileQuantity.large * 4 +
  spriteHeader.tileQuantity.small1 +
  spriteHeader.tileQuantity.small2;

export const getSpriteHeader = (
  romData: Buffer,
  spriteAddress: RomAddress,
): SpriteHeader | undefined => {
  const headerData: Buffer = extract(
    romData,
    spriteAddress.pcAddress,
    SPRITE_HEADER_LENGTH,
  );
  if (headerData.length < SPRITE_HEADER_LENGTH) return undefined;
  return {
    tileQuantity: {
      large: headerData[0],
      small1: headerData[1],
      small2: headerData[3],
    },
    offsets: {
      small1Offset: headerData[2],
      small2Offset: headerData[4],
    },
    dma: {
      group1TileQty: headerData[5],
      group2Offset: headerData[6],
      group2TileQty: headerData[7],
    },
  };
};

enum VramEntry {
  Large = 'L',
  Small1 = 'S1',
  Small2 = 'S2',
  Empty = 'E',
}

type Vram = VramEntry[];

export const buildHeaderFromTileQuantity = (
  tileQuantity: SpriteHeader['tileQuantity'],
): SpriteHeader => {
  const vram: Vram = buildVram(tileQuantity);
  const vramEmptyTrimmed: Vram = dropRightWhile(
    vram,
    (e: VramEntry): boolean => e === VramEntry.Empty,
  );
  const vramWithoutEmpty: Vram = vramEmptyTrimmed.filter(
    (e: VramEntry): boolean => e !== VramEntry.Empty,
  );

  const firstEmptyIndex: number = vramEmptyTrimmed.indexOf(VramEntry.Empty);
  const lastEmptyIndex: number = vramEmptyTrimmed.lastIndexOf(VramEntry.Empty);

  const group1TileQty: number =
    firstEmptyIndex !== -1 ? firstEmptyIndex : vramWithoutEmpty.length;
  const group2TileQty: number =
    firstEmptyIndex !== -1 ? vramWithoutEmpty.length - group1TileQty : 0;
  const group2Offset: number = lastEmptyIndex !== -1 ? lastEmptyIndex + 1 : 0;

  return {
    tileQuantity: tileQuantity,
    offsets: {
      small1Offset: Math.max(vram.indexOf(VramEntry.Small1), 0),
      small2Offset: Math.max(vram.indexOf(VramEntry.Small2), 0),
    },
    dma: {
      group1TileQty: group1TileQty,
      group2TileQty: group2TileQty,
      group2Offset: group2Offset,
    },
  };
};

const buildVram = (tileQuantity: SpriteHeader['tileQuantity']): Vram => {
  const vram: Vram = [];
  const toPlace = {
    topLarge: tileQuantity.large * 2,
    bottomLarge: tileQuantity.large * 2,
    small1: tileQuantity.small1,
    small2: tileQuantity.small2,
  };

  const indexInRow = () => vram.length % VRAM_ROW_LENGTH;
  const addLarge = (key: keyof typeof toPlace): void => {
    const freeSpaceInRow: number = VRAM_ROW_LENGTH - indexInRow();
    const toAddInRow: number = Math.min(freeSpaceInRow, toPlace[key]);
    vram.push(...new Array(toAddInRow).fill(VramEntry.Large));
    toPlace[key] -= toAddInRow;
  };
  const addSmallIfFit = (key: keyof typeof toPlace, vramEntry: VramEntry) => {
    // Small group must fit in one row if remaining large to place
    if (
      indexInRow() + toPlace[key] <= VRAM_ROW_LENGTH ||
      toPlace.topLarge + toPlace.bottomLarge === 0
    ) {
      vram.push(...new Array(toPlace[key]).fill(vramEntry));
      toPlace[key] = 0;
    }
  };

  while (
    toPlace.topLarge !== 0 ||
    toPlace.bottomLarge !== 0 ||
    toPlace.small1 !== 0 ||
    toPlace.small2 !== 0
  ) {
    const currentRow: number = Math.floor(vram.length / VRAM_ROW_LENGTH);
    if (currentRow % 2 === 0) {
      if (toPlace.topLarge > 0) {
        addLarge('topLarge');
        if (indexInRow() === 0) continue; // If row is full
      }
    } else {
      if (toPlace.bottomLarge > 0) {
        addLarge('bottomLarge');
        if (indexInRow() === 0) continue; // If row is full
      }
    }

    if (toPlace.small1 > 0) {
      addSmallIfFit('small1', VramEntry.Small1);
      if (indexInRow() === 0) continue; // If row is full
    }
    if (toPlace.small2 > 0) {
      addSmallIfFit('small2', VramEntry.Small2);
      if (indexInRow() === 0) continue; // If row is full
    }

    // Fill remaining of the row with empty
    const freeSpaceInRow: number = VRAM_ROW_LENGTH - indexInRow();
    vram.push(...new Array(freeSpaceInRow).fill(VramEntry.Empty));
  }
  return vram;
};
