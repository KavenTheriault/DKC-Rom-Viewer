import { extract } from '../../../buffer';
import { Buffer } from '../../../types/buffer';
import { decompress } from '../compression';
import { DmaTransfer } from '../entrance-info/dma-transfers';

const SNES_VRAM_LENGTH = 0x10000;

export type ManualTransfer = {
  data: Buffer;
  destination: number;
};

export const buildVramFromDma = (
  romData: Buffer,
  dmaTransfers: DmaTransfer[],
  manualTransfers: ManualTransfer[],
): Buffer => {
  const vram = new Uint8Array(SNES_VRAM_LENGTH);

  for (const transfer of dmaTransfers) {
    const { origin, destination, length } = transfer;

    let sourceData: Buffer;
    if (transfer.isCompressed) {
      sourceData = decompress(romData, transfer.origin);
    } else {
      sourceData = extract(romData, origin.pcAddress, length);
    }

    updateVram(vram, sourceData, destination);
  }

  for (const transfer of manualTransfers) {
    updateVram(vram, transfer.data, transfer.destination);
  }

  return vram;
};

export const updateVram = (vram: Buffer, data: Buffer, destination: number) => {
  /* `destination` is a VRAM *word* address (increments in 16-bit units) */
  vram.set(data, destination * 2);
};

export const readVram = (vram: Buffer, address: number, length: number) => {
  /* `destination` is a VRAM *word* address (increments in 16-bit units) */
  return extract(vram, address * 2, length);
};
