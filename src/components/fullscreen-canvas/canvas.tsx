import React, { useEffect, useRef, useState } from 'react';
import { CustomCanvas } from './styles';
import { CanvasController } from './canvas-controller';

export type Size = {
  width: number;
  height: number;
};

const getWindowSize = (): Size => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export type CanvasProps = {
  canvasController: CanvasController;
};

export const Canvas = React.memo(({ canvasController }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<Size>(getWindowSize());

  useEffect(() => {
    const { canvas, context } = getCanvas();
    canvasController.attachCanvas(canvas, context, internalDraw);

    window.addEventListener('resize', onResizeWindow);
    canvasRef.current?.addEventListener('wheel', onWheel);
    canvasRef.current?.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('resize', onResizeWindow);
      canvasRef.current?.removeEventListener('wheel', onWheel);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  useEffect(() => {
    canvasController.draw();
  }, [canvasSize]);

  const onResizeWindow = () => {
    setCanvasSize(getWindowSize());
  };

  const getCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) return { canvas, context };
    }
    throw new Error();
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

  const applyTransform = () => {
    const { context } = getCanvas();

    context.setTransform(
      canvasController.scale,
      0,
      0,
      canvasController.scale,
      canvasController.translatePosition.x,
      canvasController.translatePosition.y,
    );
  };

  const internalDraw = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    applyTransform();

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  };

  console.log('Render Canvas');
  return <CustomCanvas ref={canvasRef} color={'#1e1f22'} {...canvasSize} />;
});
