import { MainMenuGroup, MainMenuItem } from '../types/layout';
import { About } from './components/about';
import { LoadRom } from './components/load-rom';
import { RomInfo } from './components/rom-info';

export const loadRomMenuItem: MainMenuItem = {
  label: 'Load Rom',
  fasIcon: 'fa-upload',
  component: LoadRom,
};

export const romInfoMenuItem: MainMenuItem = {
  label: 'Rom Info',
  fasIcon: 'fa-file',
  component: RomInfo,
  isAvailable: (s) => !!s.rom,
};

export const aboutMenuItem: MainMenuItem = {
  label: 'About',
  fasIcon: 'fa-circle-info',
  component: About,
};

export const generalMenuGroup: MainMenuGroup = {
  label: 'General',
  items: [loadRomMenuItem],
};

export const otherMenuGroup: MainMenuGroup = {
  label: 'Other',
  items: [romInfoMenuItem, aboutMenuItem],
};

export const menuGroups: MainMenuGroup[] = [generalMenuGroup, otherMenuGroup];
