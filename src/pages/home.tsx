import { CanvasController } from '../components/canvas/canvas-controller';
import { useEffect, useRef } from 'react';
import { CanvasWithControl } from '../components/canvas-with-controls';

export const Home = () => {
  const canvasController = useRef<CanvasController>(new CanvasController());

  useEffect(() => {
    canvasController.current.registerDrawHandler(draw);
    canvasController.current.draw();

    return () => {
      canvasController.current.unregisterDrawHandler(draw);
    };
  }, []);

  const draw = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    const text = 'Hello World';
    context.fillStyle = 'white';
    context.font = '48px Arial';

    const textSize = context.measureText(text);
    context.fillText(
      text,
      canvas.width / 2 - textSize.width / 2,
      canvas.height / 2,
    );
  };

  return <CanvasWithControl canvasController={canvasController.current} />;
};
