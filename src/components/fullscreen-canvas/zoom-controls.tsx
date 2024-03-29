import React, { useEffect, useState } from 'react';
import { CanvasController } from './canvas-controller';
import styled from 'styled-components';

type ZoomControlsProps = {
  canvasController: CanvasController;
};

export const ZoomControlsContainer = styled.div`
  pointer-events: auto;
`;

export const ZoomControls = ({ canvasController }: ZoomControlsProps) => {
  const [scale, setScale] = useState<number>(canvasController.scale);

  useEffect(() => {
    canvasController.onScaleChange((s) => setScale(s));
  }, []);

  const onZoomOutClick = () => {
    const center = {
      x: canvasController.canvas.width / 2,
      y: canvasController.canvas.height / 2,
    };
    canvasController.zoom('out', center.x, center.y);
  };

  const onZoomInClick = () => {
    const center = {
      x: canvasController.canvas.width / 2,
      y: canvasController.canvas.height / 2,
    };
    canvasController.zoom('in', center.x, center.y);
  };

  const onResetZoomClick = () => {
    canvasController.scale = 1;
    canvasController.translatePosition = { x: 0, y: 0 };
    canvasController.draw();
  };

  console.log('Render ZoomControls');
  return (
    <ZoomControlsContainer className="field has-addons is-small">
      <p className="control">
        <button className="button" onClick={onZoomOutClick}>
          <span className="icon is-small">
            <i className="fas fa-magnifying-glass-minus"></i>
          </span>
        </button>
      </p>
      <p className="control">
        <button className="button" onClick={onResetZoomClick}>
          <span>{Math.round(scale * 100)}%</span>
        </button>
      </p>
      <p className="control">
        <button className="button" onClick={onZoomInClick}>
          <span className="icon is-small">
            <i className="fas fa-magnifying-glass-plus"></i>
          </span>
        </button>
      </p>
    </ZoomControlsContainer>
  );
};
