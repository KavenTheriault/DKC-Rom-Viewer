import React from 'react';
import { OverlayContainer, OverlayRowContainer } from './styles';
import { CanvasController } from './canvas-controller';
import { ZoomControls } from './zoom-controls';

type OverlayProps = {
  canvasController: CanvasController;
};

export const Overlay = ({ canvasController }: OverlayProps) => {
  console.log('Render Overlay');
  return (
    <OverlayContainer>
      <OverlayRowContainer>
        <div>{/*Top Left*/}</div>
        <div>{/*Top Middle*/}</div>
        <div>{/*Top Right*/}</div>
      </OverlayRowContainer>
      <OverlayRowContainer>
        <div>{/*Center Left*/}</div>
        <div>{/*Center Middle*/}</div>
        <div>{/*Center Right*/}</div>
      </OverlayRowContainer>
      <OverlayRowContainer>
        <div>{/*Bottom Left*/}</div>
        <div>{/*Bottom Middle*/}</div>
        <div>
          {/*Bottom Right*/}
          <ZoomControls canvasController={canvasController} />
        </div>
      </OverlayRowContainer>
    </OverlayContainer>
  );
};
