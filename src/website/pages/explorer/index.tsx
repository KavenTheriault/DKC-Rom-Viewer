import React from 'react';
import { Overlay } from '../../components/overlay';
import { stateSelector } from '../../state/selector';
import { OverlaySlotsContainer } from './styles';
import { MainMenu } from '../../components/main-menu';
import { CanvasWithControl } from '../../components/canvas-with-controls';

export const Explorer = () => {
  const selectedItem = stateSelector((s) => s.mainMenu.selectedItem);
  const canvasController = stateSelector((s) => s.canvasController);

  const ItemComponent = selectedItem.component;
  return (
    <ItemComponent>
      {(slots) => (
        <Overlay
          slots={{
            ...slots,
            top: {
              ...slots.top,
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
