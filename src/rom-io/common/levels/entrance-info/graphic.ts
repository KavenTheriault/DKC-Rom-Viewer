import { clone } from 'lodash';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant, GraphicInfo } from '../types';
import { OpcodeEntry } from './asm/read';
import { DmaTransfer } from './dma-transfers';
import { findOpcodeEntryByAddress, readOpcodeEntryArgument } from './utils';

export const buildGraphicsInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  dmaTransfers: DmaTransfer[],
  opcodeEntries: OpcodeEntry[],
): GraphicInfo[] => {
  let mainGraphicAddress: RomAddress | undefined;
  const validDmaTransfers: DmaTransfer[] = [];
  for (const dmaTransfer of dmaTransfers) {
    if (dmaTransfer.isCompressed) {
      mainGraphicAddress = dmaTransfer.origin;

      const mainDmaTransfer = clone(dmaTransfer);
      // DMA transfer for main graphics is stored at $7E79FC
      mainDmaTransfer.origin = levelConstant.address.mainGraphic;
      // Force main graphics to 0x2000 for simplicity
      mainDmaTransfer.destination = 0x2000;

      validDmaTransfers.push(mainDmaTransfer);
      break;
    } else {
      validDmaTransfers.push(dmaTransfer);
    }
  }

  /* Some level use this subroutine with bank and address as "argument"
     Only used by Temple terrain type. For example: ADM code $B98D06 */
  if (!mainGraphicAddress) {
    const loadTerrainDataSubroutine = findOpcodeEntryByAddress(
      opcodeEntries,
      levelConstant.subroutines.loadGraphicsWithAddress,
    );
    if (loadTerrainDataSubroutine) {
      const subroutineIndex = opcodeEntries.indexOf(loadTerrainDataSubroutine);
      const bank = readOpcodeEntryArgument(opcodeEntries[subroutineIndex - 2]);
      const absolute = readOpcodeEntryArgument(
        opcodeEntries[subroutineIndex - 3],
      );

      mainGraphicAddress = RomAddress.fromBankAndAbsolute(bank, absolute);
    }
  }

  return validDmaTransfers.map((dmaTransfer) => {
    const isMainGraphic =
      !!mainGraphicAddress &&
      dmaTransfer.origin.bank === levelConstant.address.mainGraphic.bank;
    const offset = isMainGraphic
      ? dmaTransfer.origin.snesAddress -
        levelConstant.address.mainGraphic.snesAddress
      : 0;

    return {
      address: isMainGraphic
        ? mainGraphicAddress!.getOffsetAddress(offset)
        : dmaTransfer.origin,
      isCompressed: isMainGraphic,
      offset: offset,
      length: dmaTransfer.length,
      /* PPU destination are starting at 0x2000
         PPU is a 16 bits storage, must multiply by 2 */
      placeAt: (dmaTransfer.destination - 0x2000) * 2,
    };
  });
};
