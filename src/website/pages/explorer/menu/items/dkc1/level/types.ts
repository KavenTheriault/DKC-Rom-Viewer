import { MenuGroup, MenuItem } from '../../../../../../components/menu/types';

export interface Level {
  entranceIndex: number;
}

export type LevelItem = MenuItem<Level>;
export type LevelGroup = MenuGroup<Level>;
