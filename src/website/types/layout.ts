import React from 'react';
import { MenuGroup, MenuItem } from '../components/menu/types';

export type OverlaySlots = {
  top?: {
    left?: React.ReactNode;
    middle?: React.ReactNode;
    right?: React.ReactNode;
  };
  center?: {
    left?: React.ReactNode;
    middle?: React.ReactNode;
    right?: React.ReactNode;
  };
  bottom?: {
    left?: React.ReactNode;
    middle?: React.ReactNode;
    right?: React.ReactNode;
  };
};

export type MainMenuItemComponent = React.FC<{
  children: (slots: OverlaySlots) => React.ReactNode;
}>;

export type MainMenuItem = MenuItem<MainMenuItemComponent>;
export type MainMenuGroup = MenuGroup<MainMenuItemComponent>;
