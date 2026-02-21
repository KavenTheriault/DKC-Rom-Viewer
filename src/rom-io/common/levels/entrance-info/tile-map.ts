import { read16 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant } from '../types';

const SCREEN_WIDTH = 0x100;

export const readLevelTilemapInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  entranceId: number,
  levelTilemapBank: number,
  terrainTileOffset: number,
) => {
  // Level Tile Maps are in the same bank as the Terrain Type Meta
  const { levelXStart, levelXEnd } = readLevelBounds(
    romData,
    levelConstant,
    entranceId,
  );
  const levelTilemapAddress = RomAddress.fromBankAndAbsolute(
    levelTilemapBank,
    levelXStart + terrainTileOffset,
  );
  const levelTilemapLength = levelXEnd - levelXStart;

  return { levelTilemapAddress, levelTilemapLength };
};

const readLevelBounds = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  entranceId: number,
) => {
  // Ref: ASM Code at $BCB052
  const levelOffset = entranceId * 2;
  const boundsIndex =
    read16(
      romData,
      RomAddress.fromBankAndAbsolute(
        levelConstant.banks.levelBounds,
        levelConstant.pointerTables.levelBounds,
      ).pcAddress + levelOffset,
    ) - 4;

  const levelXStart = read16(
    romData,
    RomAddress.fromBankAndAbsolute(levelConstant.banks.levelBounds, boundsIndex)
      .pcAddress,
  );
  let levelXEnd = read16(
    romData,
    RomAddress.fromBankAndAbsolute(
      levelConstant.banks.levelBounds,
      boundsIndex + 2,
    ).pcAddress,
  );

  // End bound is from the left side of the screen
  levelXEnd += SCREEN_WIDTH;

  return { levelXStart, levelXEnd };
};
