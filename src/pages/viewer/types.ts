import { SelectedRom } from '../../types/selected-rom';

export enum ViewerMode {
  Entity = 'Entity',
  Animation = 'Animation',
  Sprite = 'Sprite',
  Palette = 'Palette',
  Level = 'Level',
}

export type NavigateToMode = (mode: ViewerMode) => void;

export type ViewerModeBaseProps = {
  selectedRom: SelectedRom;
  navigateToMode: NavigateToMode;
};
