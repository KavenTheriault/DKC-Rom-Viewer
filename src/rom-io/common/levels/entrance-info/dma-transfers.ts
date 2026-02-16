import { toHexString } from '../../../../website/utils/hex';
import { read16, read8 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant } from '../types';

type ReadDmaTransferResult = {
  compressedGraphicAddress?: RomAddress;
  dmaTransfers: DmaTransfer[];
  otherDmaTransfers: DmaTransfer[];
};

type DmaTransfer = {
  origin: RomAddress;
  length: number;
  destination: number;
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
): ReadDmaTransferResult => {
  const dmaTransfers: DmaTransfer[] = [];
  const otherDmaTransfers: DmaTransfer[] = [];

  console.log('terrainTypeDataIndex:', toHexString(terrainTypeDataIndex));

  let currentOffset = read16(
    romData,
    levelConstant.tables.terrainGraphicsInfo.getOffsetAddress(
      terrainTypeDataIndex * 2,
    ).pcAddress,
  );
  let compressedGraphicsAddress;

  // eslint-disable-next-line no-constant-condition
  while (currentOffset < 0x1000) {
    const doneIfZero = read8(
      romData,
      levelConstant.tables.terrainGraphicsInfo.getOffsetAddress(currentOffset)
        .pcAddress,
    );
    if (doneIfZero == 0) {
      console.log('doneIfZero');
      break;
    }

    const goToDefaultIfNegative = read8(
      romData,
      levelConstant.tables.terrainGraphicsInfo
        .getOffsetAddress(4)
        .getOffsetAddress(currentOffset).pcAddress,
    );

    if (goToDefaultIfNegative > 0x7f) {
      const mainDmaTransfer = readDmaTransfer(
        romData,
        levelConstant,
        currentOffset,
      );
      compressedGraphicsAddress = mainDmaTransfer.origin;

      // DMA transfer for main graphics is stored at $7E79FC
      mainDmaTransfer.origin = levelConstant.address.mainGraphic;
      // Force main graphics to 0x2000 for simplicity
      mainDmaTransfer.destination = 0x2000;
      dmaTransfers.push(mainDmaTransfer);
    }

    const dmaTransfer = readDmaTransfer(romData, levelConstant, currentOffset);

    if (dmaTransfer.destination === 0x2000) otherDmaTransfers.push(dmaTransfer);
    else dmaTransfers.push(dmaTransfer);
    currentOffset += 7;
  }

  return {
    compressedGraphicAddress: compressedGraphicsAddress,
    dmaTransfers,
    otherDmaTransfers,
  };
};

const readDmaTransfer = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  offset: number,
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

  const destination =
    read16(
      romData,
      levelConstant.tables.terrainGraphicsInfo
        .getOffsetAddress(DATA_DESTINATION_OFFSET)
        .getOffsetAddress(offset).pcAddress,
    ) & 0x7fff;
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
  };
};
