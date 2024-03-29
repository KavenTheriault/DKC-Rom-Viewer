import { FullscreenCanvas } from '../components/fullscreen-canvas';
import React, { useEffect, useRef } from 'react';

export const CanvasTest = () => {
  const image = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    loadImage();
  }, []);

  const loadImage = () => {
    image.current.src = 'dk2.png';
  };

  const draw = (
    _canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    if (image.current) context.drawImage(image.current, 0, 0);
  };

  return <FullscreenCanvas draw={draw} />;
};
