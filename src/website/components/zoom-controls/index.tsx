import React, { useEffect, useState } from 'react';
import {
  CanvasController,
  OnScaleChangeHandler,
} from '../canvas/canvas-controller';
import { ClickableDiv } from './styles';

type ZoomControlsProps = {
  canvasController: CanvasController;
};

export const ZoomControls = ({ canvasController }: ZoomControlsProps) => {
  const [scale, setScale] = useState<number>(canvasController.scale);

  useEffect(() => {
    const onScaleChange: OnScaleChangeHandler = (s) => setScale(s);
    canvasController.registerScaleChangeHandler(onScaleChange);

    return () => {
      canvasController.unregisterScaleChangeHandler(onScaleChange);
    };
  }, []);

  const onZoomOutClick = () => {
    canvasController.zoom('out', canvasController.center);
  };

  const onZoomInClick = () => {
    canvasController.zoom('in', canvasController.center);
  };

  const onResetZoomClick = () => {
    canvasController.resetTransform();
    canvasController.draw();
  };

  return (
    <ClickableDiv className="field has-addons is-small">
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
    </ClickableDiv>
  );
};
