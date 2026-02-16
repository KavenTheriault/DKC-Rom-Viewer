import { toHexString } from '../../../../website/utils/hex';
import { extract } from '../../../buffer';
import { decompress } from '../compression';
import { DmaTransfer } from './dma-transfers';

export const buildVramFromDma = (
  romData: Buffer,
  transfers: DmaTransfer[],
): Uint8Array => {
  // SNES VRAM is 64KB
  const vram = new Uint8Array(0x10000);

  for (const transfer of transfers) {
    const { origin, destination, length } = transfer;

    let sourceData: number[];

    if (transfer.origin.bank === 0x7e || transfer.origin.bank === 0x7f) {
      console.log('Data from WRAM');
    }

    // Determine if source is ROM or RAM
    if (transfer.isCompressed) {
      // Extract from WRAM buffer
      sourceData = decompress(romData, transfer.origin);
      console.log(`Decompress: $${toHexString(transfer.origin.snesAddress)}`);
    } else {
      sourceData = Array.from(extract(romData, origin.pcAddress, length));
    }

    vram.set(sourceData, destination * 2);
    console.log(
      `DMA: $${origin.snesAddress.toString(16).toUpperCase().padStart(6, '0')} → VRAM:$${destination.toString(16).toUpperCase().padStart(4, '0')} (${length} bytes)`,
    );
  }

  return vram;
};

export function logBufferHexSimple(buffer: number[]): void {
  const hexBytes = Array.from(buffer).map((byte) =>
    (byte ?? 0).toString(16).toUpperCase().padStart(2, '0'),
  );
  console.log(hexBytes.join(' '));
}
