import { FullscreenCanvas } from '../components/fullscreen-canvas';
import React, { useEffect, useRef } from 'react';
import { CanvasController } from '../components/fullscreen-canvas/canvas-controller';

export const CanvasTest = () => {
  const canvasController = useRef<CanvasController>(new CanvasController());
  const image = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    loadImage();
    canvasController.current.onDraw(draw);
  }, []);

  const loadImage = () => {
    image.current.onload = () => {
      canvasController.current.draw();
    };
    image.current.src = 'dk2.png';
  };

  const draw = (
    _canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    if (image.current) context.drawImage(image.current, 0, 0);
  };

  return <FullscreenCanvas canvasController={canvasController.current} />;
};
