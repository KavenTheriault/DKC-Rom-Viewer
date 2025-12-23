import { AppState } from './types';
import { generalGroup, otherGroup } from '../menu/groups';
import { aboutItem, loadRomItem } from '../menu/items';
import { CanvasController } from '../components/canvas/canvas-controller';

export const defaultAppState: AppState = {
  canvasController: new CanvasController(),
  mainMenu: {
    groups: [
      { ...generalGroup, items: [loadRomItem] },
      { ...otherGroup, items: [aboutItem] },
    ],
    selectedItem: loadRomItem,
  },
};
