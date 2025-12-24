import { MainMenuGroup, MainMenuItem } from '../types/layout';
import { CanvasController } from '../components/canvas/canvas-controller';
import { Rom } from '../../rom-io/rom/types';

export interface AppState {
  canvasController: CanvasController;
  mainMenu: {
    groups: MainMenuGroup[];
    selectedItem: MainMenuItem;
  };
  rom: Rom | null;
}
