import {
  buildHeaderFromTileQuantity,
  getSpriteTilesQuantity,
  SpriteHeader,
} from './header';

export const validateSpriteHeader = (spriteHeader: SpriteHeader): boolean => {
  // Must contain at least one tile
  const tilesQuantity: number = getSpriteTilesQuantity(spriteHeader);
  if (tilesQuantity <= 0) return false;

  // Can't have small2 if no small1
  if (
    spriteHeader.tileQuantity.small2 > 0 &&
    spriteHeader.tileQuantity.small1 === 0
  )
    return false;

  // There's no sprite that large
  if (spriteHeader.tileQuantity.large > 64) return false;
  if (spriteHeader.tileQuantity.small1 > 64) return false;
  if (spriteHeader.tileQuantity.small2 > 64) return false;

  const computedHeader: SpriteHeader = buildHeaderFromTileQuantity(
    spriteHeader.tileQuantity,
  );
  if (computedHeader.offsets.small1Offset !== spriteHeader.offsets.small1Offset)
    return false;
  if (computedHeader.offsets.small2Offset !== spriteHeader.offsets.small2Offset)
    return false;
  if (computedHeader.dma.group1TileQty !== spriteHeader.dma.group1TileQty)
    return false;
  if (computedHeader.dma.group2TileQty !== spriteHeader.dma.group2TileQty)
    return false;
  // noinspection RedundantIfStatementJS
  if (computedHeader.dma.group2Offset !== spriteHeader.dma.group2Offset)
    return false;

  return true;
};
