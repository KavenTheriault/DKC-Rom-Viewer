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
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    if (!image.current) return;
    context.drawImage(
      image.current,
      canvas.width / 2 - image.current.width / 2,
      canvas.height / 2 - image.current.height / 2,
    );
    context.strokeRect(
      canvas.width / 2 - image.current.width / 2,
      canvas.height / 2 - image.current.height / 2,
      image.current.width,
      image.current.height,
    );
  };

  return <FullscreenCanvas canvasController={canvasController.current} />;
};
