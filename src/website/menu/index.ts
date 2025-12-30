import { MainMenuGroup, MainMenuItem } from '../types/layout';
import { About } from './components/about';
import { Dkc1Sprite } from './components/dkc1/sprite';
import { LoadRom } from './components/load-rom';
import { RomInfo } from './components/rom-info';

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
export const spriteMenuItem: MainMenuItem = {
  label: 'Sprite',
  fasIcon: 'fa-image',
  component: Dkc1Sprite,
  isAvailable: (s) =>
    s.rom?.header.title.toUpperCase().trim() === 'DONKEY KONG COUNTRY',
};
export const dkc1MenuGroup: MainMenuGroup = {
  label: 'Donkey Kong Country',
  items: [spriteMenuItem],
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
