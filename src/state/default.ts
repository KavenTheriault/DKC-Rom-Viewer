import { AppState } from './types';

export const defaultAppState: AppState = {
  mainMenuGroups: [
    {
      label: 'General',
      items: [
        { fasIcon: 'fa-object-group', label: 'Entity' },
        { fasIcon: 'fa-panorama', label: 'Animation' },
        { fasIcon: 'fa-image', label: 'Sprite' },
        { fasIcon: 'fa-palette', label: 'Palette' },
        { fasIcon: 'fa-scroll', label: 'Level' },
      ],
    },
  ],
};
