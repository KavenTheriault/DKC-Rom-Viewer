import React from 'react';
import { Canvas, CanvasProps } from '../canvas';
import { Overlay } from '../overlay';
import { ZoomControls } from '../zoom-controls';

export const CanvasWithControl = ({ canvasController }: CanvasProps) => (
  <Overlay
    slots={{
      bottom: {
        right: <ZoomControls canvasController={canvasController} />,
      },
    }}
  >
    <Canvas canvasController={canvasController} />
  </Overlay>
);
