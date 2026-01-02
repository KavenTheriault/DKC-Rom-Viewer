import { CanvasController } from '../components/canvas/canvas-controller';
import { loadRomMenuItem, menuGroups } from '../pages/explorer/menu';
import { AppState } from './types';

export const defaultAppState: AppState = {
  canvasController: new CanvasController(),
  mainMenu: {
    groups: menuGroups,
    selectedItem: loadRomMenuItem,
  },
  rom: null,
};
