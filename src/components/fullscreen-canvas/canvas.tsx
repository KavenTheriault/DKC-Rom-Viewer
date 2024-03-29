import React, { useEffect, useRef, useState } from 'react';
import { CustomCanvas } from './styles';
import { CanvasController } from './canvas-controller';

const ZOOM_SPEED_PERCENTAGE = 1.2;

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
  draw: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
};

export const Canvas = ({ canvasController, draw }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<Size>(getWindowSize());

  useEffect(() => {
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
    internalDraw();
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
    const factor =
      event.deltaY < 0 ? ZOOM_SPEED_PERCENTAGE : 1 / ZOOM_SPEED_PERCENTAGE;
    zoom(factor, event.clientX, event.clientY);
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

      internalDraw();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const zoom = (factor: number, mouseX: number, mouseY: number) => {
    canvasController.scale *= factor;

    const currentPosition = canvasController.translatePosition;
    canvasController.translatePosition = {
      x: (currentPosition.x -= (mouseX - currentPosition.x) * (factor - 1)),
      y: (currentPosition.y -= (mouseY - currentPosition.y) * (factor - 1)),
    };

    internalDraw();
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

  const internalDraw = () => {
    applyTransform();

    const { canvas, context } = getCanvas();
    context.clearRect(0, 0, canvas.width, canvas.height);
    draw(canvas, context);
  };

  console.log('Render Canvas');
  return <CustomCanvas ref={canvasRef} color={'#1e1f22'} {...canvasSize} />;
};
