import { clone } from 'lodash';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant, TilesetInfo } from '../types';
import { OpcodeEntry } from './asm/read';
import { DmaTransfer } from './dma-transfers';
import { findOpcodeEntryByAddress, readOpcodeEntryArgument } from './utils';

export const buildTilesetsInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  dmaTransfers: DmaTransfer[],
  opcodeEntries: OpcodeEntry[],
): TilesetInfo[] => {
  let mainTilesetAddress: RomAddress | undefined;
  const validDmaTransfers: DmaTransfer[] = [];
  for (const dmaTransfer of dmaTransfers) {
    if (dmaTransfer.isCompressed) {
      mainTilesetAddress = dmaTransfer.origin;

      const mainDmaTransfer = clone(dmaTransfer);
      // DMA transfer for main tilesets is stored at $7E79FC
      mainDmaTransfer.origin = levelConstant.address.mainTileset;
      // Force main tilesets to 0x2000 for simplicity
      mainDmaTransfer.destination = 0x2000;

      validDmaTransfers.push(mainDmaTransfer);
      break;
    } else {
      validDmaTransfers.push(dmaTransfer);
    }
  }

  /* Some level use this subroutine with bank and address as "argument"
     Only used by Temple terrain type. For example: ADM code $B98D06 */
  if (!mainTilesetAddress) {
    const loadTilesetSubroutine = findOpcodeEntryByAddress(
      opcodeEntries,
      levelConstant.subroutines.loadTilesetWithAddress,
    );
    if (loadTilesetSubroutine) {
      const subroutineIndex = opcodeEntries.indexOf(loadTilesetSubroutine);
      const bank = readOpcodeEntryArgument(opcodeEntries[subroutineIndex - 2]);
      const absolute = readOpcodeEntryArgument(
        opcodeEntries[subroutineIndex - 3],
      );

      mainTilesetAddress = RomAddress.fromBankAndAbsolute(bank, absolute);
    }
  }

  return validDmaTransfers.map((dmaTransfer) => {
    const isMainTileset =
      !!mainTilesetAddress &&
      dmaTransfer.origin.bank === levelConstant.address.mainTileset.bank;
    const offset = isMainTileset
      ? dmaTransfer.origin.snesAddress -
        levelConstant.address.mainTileset.snesAddress
      : 0;

    return {
      address: isMainTileset
        ? mainTilesetAddress!.getOffsetAddress(offset)
        : dmaTransfer.origin,
      isCompressed: isMainTileset,
      offset: offset,
      length: dmaTransfer.length,
      /* PPU destination are starting at 0x2000
         PPU is a 16 bits storage, must multiply by 2 */
      placeAt: (dmaTransfer.destination - 0x2000) * 2,
    };
  });
};
