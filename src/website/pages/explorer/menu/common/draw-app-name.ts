import { useEffect } from 'react';
import { useAppSelector } from '../../../../state';

export const useDrawAppName = () => {
  const canvasController = useAppSelector((s) => s.canvasController);

  useEffect(() => {
    canvasController.registerDrawHandler(drawAppName);
    canvasController.draw();

    return () => {
      canvasController.unregisterDrawHandler(drawAppName);
    };
  }, []);

  const drawAppName = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    const text = 'Donkey Kong Country - Explorer';
    context.fillStyle = 'white';
    context.font = '48px Arial';

    const textSize = context.measureText(text);
    context.fillText(
      text,
      canvas.width / 2 - textSize.width / 2,
      canvas.height / 2,
    );
  };
};
