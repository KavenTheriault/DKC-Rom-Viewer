import React from 'react';
import { stateSelector, useAppStore } from '../../state/selector';
import { MainMenuItemComponent } from '../../types/layout';
import { Menu } from '../menu';

export const MainMenu = () => {
  const appStore = useAppStore();
  const groups = stateSelector((s) => s.mainMenu.groups);
  const selectedItem = stateSelector((s) => s.mainMenu.selectedItem);

  return (
    <Menu<MainMenuItemComponent>
      groups={groups}
      selectedItem={selectedItem}
      onSelectItem={(item) => {
        appStore.set((s) => {
          s.mainMenu.selectedItem = item;
        });
      }}
    />
  );
};
