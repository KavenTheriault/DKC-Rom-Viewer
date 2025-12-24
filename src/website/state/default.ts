import { CanvasController } from '../components/canvas/canvas-controller';
import { menuGroups, loadRomMenuItem } from '../menu';
import { AppState } from './types';

export const defaultAppState: AppState = {
  canvasController: new CanvasController(),
  mainMenu: {
    groups: menuGroups,
    selectedItem: loadRomMenuItem,
  },
  rom: null,
};
