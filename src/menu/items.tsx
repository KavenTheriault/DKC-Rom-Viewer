import { MainMenuItem } from '../types/layout';
import { LoadRom } from './components/load-rom';
import { About } from './components/about';

export const loadRomItem: MainMenuItem = {
  label: 'Load Rom',
  fasIcon: 'fa-upload',
  component: LoadRom,
};

export const aboutItem: MainMenuItem = {
  label: 'About',
  fasIcon: 'fa-circle-info',
  component: About,
};
