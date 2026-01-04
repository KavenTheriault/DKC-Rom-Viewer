import { cloneDeep } from 'lodash';
import { CanvasController } from '../components/canvas/canvas-controller';
import { loadRomMenuItem, menuGroups } from '../pages/explorer/menu';
import {
  DEFAULT_ANIMATION_INDEX,
  DEFAULT_ENTITY,
  DEFAULT_PALETTE,
  DEFAULT_SPRITE_POINTER,
} from '../pages/explorer/menu/items/dkc1/defaults';
import { AppState } from './types';

export const defaultAppState: AppState = {
  canvasController: new CanvasController(),
  mainMenu: {
    groups: cloneDeep(menuGroups),
    selectedItem: loadRomMenuItem,
  },
  rom: null,
  dkc1: {
    animationIndex: DEFAULT_ANIMATION_INDEX,
    entityAddress: DEFAULT_ENTITY,
    paletteAddress: DEFAULT_PALETTE,
    spritePointer: DEFAULT_SPRITE_POINTER,
  },
};
