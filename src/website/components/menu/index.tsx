import React, { useState } from 'react';
import { MenuDiv, MenuItemA } from './styles';
import { MenuGroup, MenuItem } from './types';

interface MenuProps<ValueType> {
  groups: MenuGroup<ValueType>[];
  onSelectItem: (item: MenuItem<ValueType>) => void;
  selectedItem: MenuItem<ValueType> | null;
}

export const Menu = <ValueType,>({
  groups,
  selectedItem,
  onSelectItem,
}: MenuProps<ValueType>) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderItem = (item: MenuItem<ValueType>) => (
    <li key={item.label.toLowerCase()}>
      <MenuItemA
        className={selectedItem === item ? 'is-active' : ''}
        onClick={() => {
          onSelectItem(item);
          setIsOpen(false);
        }}
      >
        {item.fasIcon && (
          <i className={`fas ${item.fasIcon}`} aria-hidden="true" />
        )}
        {item.label}
      </MenuItemA>
    </li>
  );

  const renderGroup = (group: MenuGroup<ValueType>) => (
    <React.Fragment key={group.label.toLowerCase()}>
      <p className="menu-label">{group.label}</p>
      <ul className="menu-list">{group.items.map(renderItem)}</ul>
    </React.Fragment>
  );

  return (
    <div
      className={`is-flex is-flex-direction-column is-align-items-stretch dropdown is-small ${isOpen ? 'is-active' : ''}`}
    >
      <div className="is-flex is-flex-direction-column is-align-items-stretch dropdown-trigger is-small">
        <button
          className="button is-small"
          aria-haspopup="true"
          aria-controls="dropdown-menu"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {selectedItem?.fasIcon && (
            <span className="icon is-small">
              <i
                className={`fas ${selectedItem.fasIcon}`}
                aria-hidden="true"
              ></i>
            </span>
          )}
          <span>{selectedItem ? selectedItem.label : 'Menu'}</span>
          <span className="icon is-small">
            <i
              className={isOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'}
              aria-hidden="true"
            ></i>
          </span>
        </button>
      </div>
      <div className="dropdown-menu is-small" id="dropdown-menu" role="menu">
        <div className="dropdown-content is-small">
          <MenuDiv>
            <aside className="menu is-small">{groups.map(renderGroup)}</aside>
          </MenuDiv>
        </div>
      </div>
    </div>
  );
};
