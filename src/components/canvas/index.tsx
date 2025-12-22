import React, { useEffect, useRef, useState } from 'react';
import { CustomCanvas } from './styles';
import { CanvasController } from './canvas-controller';
import { Size } from '../../common/types';

const getWindowSize = (): Size => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export type CanvasProps = {
  canvasController: CanvasController;
};

export const Canvas = React.memo(({ canvasController }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [windowSize, setWindowSize] = useState<Size>(getWindowSize());

  useEffect(() => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasController.attachCanvas(canvasRef.current, context);

    window.addEventListener('resize', onResizeWindow);
    canvasRef.current.addEventListener('wheel', onWheel);
    canvasRef.current.addEventListener('mousedown', onMouseDown);
    return () => {
      if (!canvasRef.current) return;

      window.removeEventListener('resize', onResizeWindow);
      canvasRef.current.removeEventListener('wheel', onWheel);
      canvasRef.current.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  useEffect(() => {
    canvasController.draw();
  }, [windowSize]);

  const onResizeWindow = () => {
    setWindowSize(getWindowSize());
  };

  const onWheel = (event: WheelEvent) => {
    const direction = event.deltaY < 0 ? 'in' : 'out';
    canvasController.zoom(direction, event.clientX, event.clientY);
  };

  const onMouseDown = (mouseDownEvent: MouseEvent) => {
    let startX = mouseDownEvent.clientX;
    let startY = mouseDownEvent.clientY;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const currentPosition = canvasController.translatePosition;
      canvasController.translatePosition = {
        x: currentPosition.x + mouseMoveEvent.clientX - startX,
        y: (currentPosition.y += mouseMoveEvent.clientY - startY),
      };

      startX = mouseMoveEvent.clientX;
      startY = mouseMoveEvent.clientY;

      canvasController.draw();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <CustomCanvas
      ref={canvasRef}
      color={'#1e1f22'}
      width={windowSize.width}
      height={windowSize.height}
    />
  );
});
