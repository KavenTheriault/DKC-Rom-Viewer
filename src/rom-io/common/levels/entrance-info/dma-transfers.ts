import { read16, read8 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant } from '../types';

export type DmaTransfer = {
  origin: RomAddress;
  length: number;
  destination: number;
  isCompressed: boolean;
};

const DATA_ORIGIN_BANK_OFFSET = 0; //$a994
const DATA_ORIGIN_ABSOLUTE_OFFSET = 1; //$a995
const DATA_DESTINATION_OFFSET = 3; //$a997
const DATA_LENGTH_OFFSET = 5; // $a999

// Ref: ASM Code at $B9A924
export const readDmaTransfers = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  terrainTypeDataIndex: number,
): DmaTransfer[] => {
  const dmaTransfers: DmaTransfer[] = [];

  let currentOffset = read16(
    romData,
    levelConstant.tables.terrainGraphicsInfo.getOffsetAddress(
      terrainTypeDataIndex * 2,
    ).pcAddress,
  );

  while (currentOffset < 0x1000) {
    const doneIfZero = read8(
      romData,
      levelConstant.tables.terrainGraphicsInfo.getOffsetAddress(currentOffset)
        .pcAddress,
    );
    if (doneIfZero == 0) break;

    const goToDefaultIfNegative = read8(
      romData,
      levelConstant.tables.terrainGraphicsInfo
        .getOffsetAddress(4)
        .getOffsetAddress(currentOffset).pcAddress,
    );

    const isCompressed = goToDefaultIfNegative > 0x7f;
    const dmaTransfer = readDmaTransfer(
      romData,
      levelConstant,
      currentOffset,
      isCompressed,
    );
    dmaTransfers.push(dmaTransfer);

    currentOffset += 7;
  }

  return dmaTransfers;
};

const readDmaTransfer = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  offset: number,
  isCompressed: boolean,
): DmaTransfer => {
  const bank = read8(
    romData,
    levelConstant.tables.terrainGraphicsInfo
      .getOffsetAddress(DATA_ORIGIN_BANK_OFFSET)
      .getOffsetAddress(offset).pcAddress,
  );
  const absolute = read16(
    romData,
    levelConstant.tables.terrainGraphicsInfo
      .getOffsetAddress(DATA_ORIGIN_ABSOLUTE_OFFSET)
      .getOffsetAddress(offset).pcAddress,
  );
  const originAddress = RomAddress.fromBankAndAbsolute(bank, absolute);

  let destination = read16(
    romData,
    levelConstant.tables.terrainGraphicsInfo
      .getOffsetAddress(DATA_DESTINATION_OFFSET)
      .getOffsetAddress(offset).pcAddress,
  );
  if (isCompressed) {
    destination &= 0x7fff;
  }

  const size = read16(
    romData,
    levelConstant.tables.terrainGraphicsInfo
      .getOffsetAddress(DATA_LENGTH_OFFSET)
      .getOffsetAddress(offset).pcAddress,
  );

  return {
    origin: originAddress,
    length: size,
    destination: destination,
    isCompressed: isCompressed,
  };
};
