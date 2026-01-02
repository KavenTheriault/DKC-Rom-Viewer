import { AppState } from '../../../state/types';
import { MainMenuGroup, MainMenuItem } from '../../../types/layout';
import { About } from './items/about';
import { Dkc1Animation } from './items/dkc1/animation';
import { Dkc1Sprite } from './items/dkc1/sprite';
import { LoadRom } from './items/load-rom';
import { RomInfo } from './items/rom-info';

// General
export const loadRomMenuItem: MainMenuItem = {
  label: 'Load Rom',
  fasIcon: 'fa-upload',
  component: LoadRom,
};
export const generalMenuGroup: MainMenuGroup = {
  label: 'General',
  items: [loadRomMenuItem],
};

// Dkc1
const isDkc1 = (appState: AppState) =>
  appState.rom?.header.title.toUpperCase().trim() === 'DONKEY KONG COUNTRY';
export const spriteMenuItem: MainMenuItem = {
  label: 'Sprite',
  fasIcon: 'fa-image',
  component: Dkc1Sprite,
  isAvailable: isDkc1,
};
export const animationMenuItem: MainMenuItem = {
  label: 'Animation',
  fasIcon: 'fa-panorama',
  component: Dkc1Animation,
  isAvailable: isDkc1,
};
export const dkc1MenuGroup: MainMenuGroup = {
  label: 'Donkey Kong Country',
  items: [spriteMenuItem, animationMenuItem],
};

// Other
export const romInfoMenuItem: MainMenuItem = {
  label: 'Rom Info',
  fasIcon: 'fa-file',
  component: RomInfo,
  isAvailable: (s) => !!s.rom,
};
export const aboutMenuItem: MainMenuItem = {
  label: 'About this project',
  fasIcon: 'fa-circle-info',
  component: About,
};
export const otherMenuGroup: MainMenuGroup = {
  label: 'Other',
  items: [romInfoMenuItem, aboutMenuItem],
};

export const menuGroups: MainMenuGroup[] = [
  generalMenuGroup,
  dkc1MenuGroup,
  otherMenuGroup,
];
