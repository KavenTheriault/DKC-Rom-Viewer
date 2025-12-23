import React from 'react';
import { MenuDiv, MenuItemA } from './styles';
import { setState, useAppSelector } from '../../state';
import { MainMenuGroup, MainMenuItem } from '../../types/layout';

export const MainMenu = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const groups = useAppSelector((s) => s.mainMenu.groups);
  const selectedItem = useAppSelector((s) => s.mainMenu.selectedItem);

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
            <aside className="menu">{groups.map(renderGroup)}</aside>
          </MenuDiv>
        </div>
      </div>
    </div>
  );
};
