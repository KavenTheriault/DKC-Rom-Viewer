import { CanvasController } from '../components/canvas/canvas-controller';
import { useEffect, useRef } from 'react';
import { ZoomControls } from '../components/zoom-controls';
import { Canvas } from '../components/canvas';

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

  return (
    <>
      <Canvas canvasController={canvasController.current} />
      <ZoomControls canvasController={canvasController.current} />
    </>
  );
};
