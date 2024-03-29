import React, { useEffect, useState } from 'react';
import { CanvasController } from './canvas-controller';

type ZoomControlsProps = {
  canvasController: CanvasController;
};

export const ZoomControls = ({ canvasController }: ZoomControlsProps) => {
  const [scale, setScale] = useState<number>(canvasController.scale);

  useEffect(() => {
    canvasController.onScaleChange((s) => setScale(s));
  }, []);

  console.log('Render ZoomControls');
  return <div>Zoom {Math.round(scale * 100)}%</div>;
};
