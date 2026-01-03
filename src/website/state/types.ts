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
  dkc1: {
    animationAddress?: number;
    animationIndex: number;
    entityAddress?: number;
    entityReference?: number;
    paletteAddress: number;
    paletteReference?: number;
    spriteAddress?: number;
    spritePointer: number;
  };
}
