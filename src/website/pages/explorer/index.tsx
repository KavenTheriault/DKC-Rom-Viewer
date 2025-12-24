import React from 'react';
import { useAppSelector } from '../../state';
import { Overlay } from '../../components/overlay';
import { OverlaySlotsContainer } from './styles';
import { MainMenu } from '../../components/main-menu';
import { CanvasWithControl } from '../../components/canvas-with-controls';

export const Explorer = () => {
  const selectedItem = useAppSelector((s) => s.mainMenu.selectedItem);
  const canvasController = useAppSelector((s) => s.canvasController);

  const ItemComponent = selectedItem.component;
  return (
    <ItemComponent>
      {(slots) => (
        <Overlay
          slots={{
            ...slots,
            top: {
              left: (
                <OverlaySlotsContainer>
                  <MainMenu />
                  {slots.top?.left}
                </OverlaySlotsContainer>
              ),
            },
          }}
        >
          <CanvasWithControl canvasController={canvasController} />
        </Overlay>
      )}
    </ItemComponent>
  );
};
