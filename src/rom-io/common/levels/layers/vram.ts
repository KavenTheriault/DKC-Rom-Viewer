import { extract } from '../../../buffer';
import { decompress } from '../compression';
import { DmaTransfer } from '../entrance-info/dma-transfers';

const SNES_VRAM_LENGTH = 0x10000;

export type ManualTransfer = {
  data: Uint8Array;
  destination: number;
};

export const buildVramFromDma = (
  romData: Uint8Array,
  dmaTransfers: DmaTransfer[],
  manualTransfers: ManualTransfer[],
): Uint8Array => {
  const vram = new Uint8Array(SNES_VRAM_LENGTH);

  const updateVram = (data: Uint8Array, destination: number) => {
    /* `destination` is a VRAM *word* address (increments in 16-bit units) */
    vram.set(data, destination * 2);
  };

  for (const transfer of dmaTransfers) {
    const { origin, destination, length } = transfer;

    let sourceData: Uint8Array;
    if (transfer.isCompressed) {
      sourceData = decompress(romData, transfer.origin);
    } else {
      sourceData = extract(romData, origin.pcAddress, length);
    }

    updateVram(sourceData, destination);
  }

  for (const transfer of manualTransfers) {
    updateVram(transfer.data, transfer.destination);
  }

  return vram;
};
