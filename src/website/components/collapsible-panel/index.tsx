import React, { ReactNode } from 'react';
import { Box, HeaderHr } from './styles';

interface CollapsiblePanelProps {
  children: ReactNode;
  title: string;
}

export const CollapsiblePanel = ({
  children,
  title,
}: CollapsiblePanelProps) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const renderShowHideButton = ({ isHidden }: { isHidden: boolean }) => (
    <button
      className={[
        'button',
        'is-small',
        'is-outlined',
        'is-rounded',
        ...(isHidden ? ['is-hidden'] : []),
      ].join(' ')}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="icon is-small">
        <i
          className={isOpen ? 'fas fa-eye-slash' : 'fas fa-eye'}
          aria-hidden="true"
        ></i>
      </span>
      {!isOpen && <span>{title}</span>}
    </button>
  );

  return (
    <>
      {renderShowHideButton({ isHidden: isOpen })}
      <Box className={['box', ...(!isOpen ? ['is-hidden'] : [])].join(' ')}>
        <div className="is-flex is-flex-direction-column">
          <div className="pt-1 is-flex is-flex-direction-row is-align-items-center">
            {renderShowHideButton({ isHidden: !isOpen })}
            <span className="pl-2 is-size-6 has-text-weight-bold">{title}</span>
          </div>
          <HeaderHr className="has-background-grey-lighter" />
        </div>
        {children}
      </Box>
    </>
  );
};
