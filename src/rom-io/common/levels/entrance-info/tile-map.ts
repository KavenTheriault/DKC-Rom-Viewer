import { read16 } from '../../../buffer';
import { RomAddress } from '../../../rom/address';
import { GameLevelConstant } from '../types';

const SCREEN_WIDTH = 0x100;

export const readLevelTileMapInfo = (
  romData: Buffer,
  levelConstant: GameLevelConstant,
  entranceId: number,
  levelTileMapBank: number,
  terrainTileOffset: number,
) => {
  // Level Tile Maps are in the same bank as the Terrain Type Meta
  const { levelXStart, levelXEnd } = readLevelBounds(
    romData,
    levelConstant,
    entranceId,
  );
  const levelTileMapAddress = RomAddress.fromBankAndAbsolute(
    levelTileMapBank,
    levelXStart + terrainTileOffset,
  );
  const levelTileMapLength = levelXEnd - levelXStart;

  return { levelTileMapAddress, levelTileMapLength };
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
