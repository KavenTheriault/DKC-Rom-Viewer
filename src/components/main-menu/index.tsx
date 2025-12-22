import React from 'react';
import { MenuDiv, MenuItemA } from './styles';
import { MainMenuGroup, MainMenuItem } from './types';
import { useAppSelector } from '../../state';

export const MainMenu = () => {
  const mainMenuGroups = useAppSelector((s) => s.mainMenuGroups);

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<MainMenuItem>();

  const renderMainMenuItem = (item: MainMenuItem) => (
    <li>
      <MenuItemA
        className={selectedItem === item ? 'is-active' : ''}
        onClick={() => {
          setSelectedItem(item);
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

  const renderMainMenuGroup = (item: MainMenuGroup) => (
    <>
      <p className="menu-label">{item.label}</p>
      <ul className="menu-list">{item.items.map(renderMainMenuItem)}</ul>
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
            <aside className="menu">
              {mainMenuGroups.map(renderMainMenuGroup)}
            </aside>
          </MenuDiv>
        </div>
      </div>
    </div>
  );
};
