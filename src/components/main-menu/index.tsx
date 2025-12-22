import React from 'react';
import { MenuDiv, MenuItemA } from './styles';

interface MainMenuItem {
  label: string;
  fasIcon?: string;
}

interface MainMenuGroup {
  label: string;
  items: MainMenuItem[];
}

interface MainMenuProps {
  menuGroups: MainMenuGroup[];
}

export const MainMenu = ({ menuGroups }: MainMenuProps) => {
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
            <i className="fas fa-bars" aria-hidden="true"></i>
          </span>
          <span>{`Menu${selectedItem ? ' | ' + selectedItem.label : ''}`}</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down" aria-hidden="true"></i>
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content">
          <MenuDiv>
            <aside className="menu">
              {menuGroups.map(renderMainMenuGroup)}
            </aside>
          </MenuDiv>
        </div>
      </div>
    </div>
  );
};
