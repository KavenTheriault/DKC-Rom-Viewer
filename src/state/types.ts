import { MainMenuGroup, MainMenuItem } from '../types/layout';
import { CanvasController } from '../components/canvas/canvas-controller';

export interface AppState {
  canvasController: CanvasController;
  mainMenu: {
    groups: MainMenuGroup[];
    selectedItem: MainMenuItem;
  };
  rom?: object;
}
