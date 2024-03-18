import { read16, read8 } from '../utils/buffer';
import { RomAddress } from '../types/address';

type ReadDmaTransferResult = {
  compressedGraphicAddress?: RomAddress;
  dmaTransfers: DmaTransfer[];
};

type DmaTransfer = {
  origin: RomAddress;
  length: number;
  destination: number;
};

const TerrainGraphicsInfoTable = RomAddress.fromSnesAddress(0xb9a994);
const DATA_ORIGIN_BANK_OFFSET = 0; //$a994
const DATA_ORIGIN_ABSOLUTE_OFFSET = 1; //$a995
const DATA_DESTINATION_OFFSET = 3; //$a997
const DATA_LENGTH_OFFSET = 5; // $a999

// Ref: ASM Code at $39A987
export const MainGraphicAddress = RomAddress.fromSnesAddress(0x7e79fc);

// Ref: ASM Code at $B9A924
export const readDmaTransfers = (
  romData: Buffer,
  terrainTypeDataIndex: number,
): ReadDmaTransferResult => {
  const dmaTransfers: DmaTransfer[] = [];

  let currentOffset = read16(
    romData,
    TerrainGraphicsInfoTable.getOffsetAddress(terrainTypeDataIndex * 2)
      .pcAddress,
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const doneIfZero = read8(
      romData,
      TerrainGraphicsInfoTable.getOffsetAddress(currentOffset).pcAddress,
    );
    if (doneIfZero == 0) return { dmaTransfers };

    const goToDefaultIfNegative = read8(
      romData,
      TerrainGraphicsInfoTable.getOffsetAddress(4).getOffsetAddress(
        currentOffset,
      ).pcAddress,
    );
    if (goToDefaultIfNegative > 0x7f) break;

    dmaTransfers.push(readDmaTransfer(romData, currentOffset));
    currentOffset += 7;
  }

  const mainDmaTransfer = readDmaTransfer(romData, currentOffset);
  const compressedGraphicsAddress = mainDmaTransfer.origin;

  // DMA transfer for main graphics is stored at $7E79FC
  mainDmaTransfer.origin = MainGraphicAddress;
  // Force main graphics to 0x2000 for simplicity
  mainDmaTransfer.destination = 0x2000;
  dmaTransfers.push(mainDmaTransfer);

  return { compressedGraphicAddress: compressedGraphicsAddress, dmaTransfers };
};

const readDmaTransfer = (romData: Buffer, offset: number): DmaTransfer => {
  const bank = read8(
    romData,
    TerrainGraphicsInfoTable.getOffsetAddress(
      DATA_ORIGIN_BANK_OFFSET,
    ).getOffsetAddress(offset).pcAddress,
  );
  const absolute = read16(
    romData,
    TerrainGraphicsInfoTable.getOffsetAddress(
      DATA_ORIGIN_ABSOLUTE_OFFSET,
    ).getOffsetAddress(offset).pcAddress,
  );
  const originAddress = RomAddress.fromBankAndAbsolute(bank, absolute);

  const destination =
    read16(
      romData,
      TerrainGraphicsInfoTable.getOffsetAddress(
        DATA_DESTINATION_OFFSET,
      ).getOffsetAddress(offset).pcAddress,
    ) & 0x7fff;
  const size = read16(
    romData,
    TerrainGraphicsInfoTable.getOffsetAddress(
      DATA_LENGTH_OFFSET,
    ).getOffsetAddress(offset).pcAddress,
  );

  return {
    origin: originAddress,
    length: size,
    destination: destination,
  };
};
