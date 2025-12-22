import React, { ReactNode } from 'react';
import { Box } from './styles';

interface CollapsibleBoxProps {
  children: ReactNode;
}

export const CollapsibleBox = ({ children }: CollapsibleBoxProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const renderShowHideButton = () => {
    return (
      <button className="button is-white" onClick={() => setIsOpen(!isOpen)}>
        <span className="icon is-small">
          <i
            className={isOpen ? 'fas fa-eye-slash' : 'fas fa-eye'}
            aria-hidden="true"
          ></i>
        </span>
        <span>{isOpen ? 'Hide' : 'Show'}</span>
      </button>
    );
  };

  if (!isOpen) return renderShowHideButton();
  return (
    <Box className="box">
      <div className="is-flex is-flex-direction-column is-align-items-center">
        {renderShowHideButton()}
      </div>
      {children}
    </Box>
  );
};
