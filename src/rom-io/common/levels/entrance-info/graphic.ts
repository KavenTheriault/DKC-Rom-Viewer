import { toHexString } from '../../../../website/utils/hex';
import { RomAddress } from '../../../rom/address';
import { OpcodeEntry } from './asm/read';
import { readDmaTransfers } from './dma-transfers';
import { GameLevelConstant, GraphicInfo } from '../types';
import {
  findArgumentInPreviousOpcodes,
  findOpcodeEntryByAddress,
  findSubroutine,
  readOpcodeEntryArgument,
} from './utils';

export const readGraphicsInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
): GraphicInfo[] => {
  const loadGraphicsSubroutine = findSubroutine(
    opcodeEntries,
    levelConstant.subroutines.loadGraphicsWithTerrainIndex,
  );
  const terrainDataIndex = findArgumentInPreviousOpcodes(
    opcodeEntries,
    loadGraphicsSubroutine,
    'LDA',
  );
  const readDmaTransfersResult = readDmaTransfers(
    romData,
    levelConstant,
    terrainDataIndex,
  );

  for (const test of readDmaTransfersResult.dmaTransfers) {
    console.log('dmaTransfers:', test.origin.toString());
    console.log('dmaTransfers length', toHexString(test.length));
    console.log('dmaTransfers destination', toHexString(test.destination));
  }
  for (const test of readDmaTransfersResult.otherDmaTransfers) {
    console.log(
      'otherDmaTransfers:',
      test.origin.toString(),
      toHexString(test.origin.pcAddress),
    );
    console.log('otherDmaTransfers length', toHexString(test.length));
    console.log('otherDmaTransfers destination', toHexString(test.destination));
  }

  let mainGraphicAddress = readDmaTransfersResult.compressedGraphicAddress;

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

  return readDmaTransfersResult.dmaTransfers.map((dmaTransfer) => {
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
