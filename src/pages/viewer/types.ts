import { RomAddress } from '../../rom-parser/types/address';
import { SelectedRom } from '../../types/selected-rom';

export enum ViewerMode {
  Entity = 'Entity',
  Animation = 'Animation',
  Sprite = 'Sprite',
  Palette = 'Palette',
}

export type LoadViewerMode = (mode: ViewerMode, address: RomAddress) => void;

export type ViewerModeBaseProps = {
  selectedRom: SelectedRom;
  loadViewerMode: LoadViewerMode;
  initRomAddress?: RomAddress;
};
