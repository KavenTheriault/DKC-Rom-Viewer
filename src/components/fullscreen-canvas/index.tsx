import { Canvas } from './canvas';
import { Overlay } from './overlay';
import { CanvasController } from './canvas-controller';

type FullscreenCanvasProps = {
  canvasController: CanvasController;
};

export const FullscreenCanvas = ({
  canvasController,
}: FullscreenCanvasProps) => {
  console.log('Render FullscreenCanvas');
  return (
    <>
      <Canvas canvasController={canvasController} />
      <Overlay canvasController={canvasController} />
    </>
  );
};
