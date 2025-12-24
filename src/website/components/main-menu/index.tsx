import React, { useEffect, useState } from 'react';
import { setState, useAppSelector } from '../../state';
import { MainMenuGroup, MainMenuItem } from '../../types/layout';
import { MenuDiv, MenuItemA } from './styles';

export const MainMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableMenu, setAvailableMenu] = useState<MainMenuGroup[]>([]);

  const appState = useAppSelector((s) => s);
  const selectedItem = useAppSelector((s) => s.mainMenu.selectedItem);

  useEffect(() => {
    const availableGroups: MainMenuGroup[] = [];
    for (const group of appState.mainMenu.groups) {
      const availableItems = group.items.filter(
        (i) => !i.isAvailable || i.isAvailable(appState),
      );
      if (availableItems.length > 0) {
        availableGroups.push({ ...group, items: availableItems });
      }
    }
    setAvailableMenu(availableGroups);
  }, [appState]);

  const renderItem = (item: MainMenuItem) => (
    <li key={item.label.toLowerCase()}>
      <MenuItemA
        className={selectedItem === item ? 'is-active' : ''}
        onClick={() => {
          setState(() => ({
            mainMenu: { selectedItem: item },
          }));
          setIsOpen(false);
        }}
      >
        {item.fasIcon && (
          <i className={`fas ${item.fasIcon}`} aria-hidden="true"></i>
        )}
        {item.label}
      </MenuItemA>
    </li>
  );

  const renderGroup = (item: MainMenuGroup) => (
    <>
      <p className="menu-label">{item.label}</p>
      <ul className="menu-list">{item.items.map(renderItem)}</ul>
    </>
  );

  return (
    <div className={`dropdown ${isOpen ? 'is-active' : ''}`}>
      <div className="dropdown-trigger">
        <button
          className="button"
          aria-haspopup="true"
          aria-controls="dropdown-menu"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <span className="icon is-small">
            <i
              className={
                selectedItem ? `fas ${selectedItem.fasIcon}` : 'fas fa-bars'
              }
              aria-hidden="true"
            ></i>
          </span>
          <span>{selectedItem ? selectedItem.label : 'Menu'}</span>
          <span className="icon is-small">
            <i
              className={isOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'}
              aria-hidden="true"
            ></i>
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content">
          <MenuDiv>
            <aside className="menu">{availableMenu.map(renderGroup)}</aside>
          </MenuDiv>
        </div>
      </div>
    </div>
  );
};
