import React from 'react';

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

export interface MainMenuItem {
  label: string;
  fasIcon?: string;
  component: MainMenuItemComponent;
}

export interface MainMenuGroup {
  label: string;
  items: MainMenuItem[];
}
