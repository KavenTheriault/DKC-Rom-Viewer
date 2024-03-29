import { Canvas, CanvasProps } from './canvas';
import { Overlay } from './overlay';
import { useRef } from 'react';
import { CanvasController } from './canvas-controller';

type FullscreenCanvasProps = Pick<CanvasProps, 'draw'>;

export const FullscreenCanvas = (props: FullscreenCanvasProps) => {
  const canvasController = useRef<CanvasController>(new CanvasController());

  console.log('Render FullscreenCanvas');
  return (
    <>
      <Canvas canvasController={canvasController.current} {...props} />
      <Overlay canvasController={canvasController.current} />
    </>
  );
};
