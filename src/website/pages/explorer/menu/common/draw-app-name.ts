import { useEffect } from 'react';
import { stateSelector } from '../../../../state/selector';

export const useDrawAppName = () => {
  const canvasController = stateSelector((s) => s.canvasController);

  useEffect(() => {
    canvasController.resetTransform();
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
