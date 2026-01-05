import { MainMenuGroup, MainMenuItem } from '../../../types/layout';
import { About } from './items/about';
import { Dkc1Animation } from './items/dkc1/animation';
import { Dkc1Entity } from './items/dkc1/entity';
import { Dkc1Level } from './items/dkc1/level';
import { Dkc1Palette } from './items/dkc1/palette';
import { Dkc1Sprite } from './items/dkc1/sprite';
import { RomSelection } from './items/rom-selection';
import { RomInfo } from './items/rom-info';

// General
export const romSelectionMenuItem: MainMenuItem = {
  label: 'Rom Selection',
  fasIcon: 'fa-upload',
  component: RomSelection,
};
export const generalMenuGroup: MainMenuGroup = {
  label: 'General',
  items: [romSelectionMenuItem],
};

// Dkc1
export const entityMenuItem: MainMenuItem = {
  label: 'Entity',
  fasIcon: 'fa-object-group',
  component: Dkc1Entity,
};
export const animationMenuItem: MainMenuItem = {
  label: 'Animation',
  fasIcon: 'fa-panorama',
  component: Dkc1Animation,
};
export const spriteMenuItem: MainMenuItem = {
  label: 'Sprite',
  fasIcon: 'fa-image',
  component: Dkc1Sprite,
};
export const paletteMenuItem: MainMenuItem = {
  label: 'Palette',
  fasIcon: 'fa-palette',
  component: Dkc1Palette,
};
export const levelMenuItem: MainMenuItem = {
  label: 'Level',
  fasIcon: 'fa-scroll',
  component: Dkc1Level,
};
export const dkc1MenuGroup: MainMenuGroup = {
  label: 'Donkey Kong Country',
  items: [
    entityMenuItem,
    animationMenuItem,
    spriteMenuItem,
    paletteMenuItem,
    levelMenuItem,
  ],
};

// Other
export const romInfoMenuItem: MainMenuItem = {
  label: 'Rom Info',
  fasIcon: 'fa-file',
  component: RomInfo,
};
export const aboutMenuItem: MainMenuItem = {
  label: 'About this project',
  fasIcon: 'fa-circle-info',
  component: About,
};
export const otherMenuGroup: MainMenuGroup = {
  label: 'Other',
  items: [aboutMenuItem],
};

export const menuGroups: MainMenuGroup[] = [generalMenuGroup, otherMenuGroup];
