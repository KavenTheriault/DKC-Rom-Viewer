import { MenuGroup, MenuItem } from '../../../../../../components/menu/types';

export interface SpriteAndPalette {
  spritePointer: number;
  paletteAddress: number;
}

export type SpriteItem = MenuItem<SpriteAndPalette>;
export type SpriteGroup = MenuGroup<SpriteAndPalette>;
