import { Canvas } from './canvas';
import { Overlay, OverlayProps } from './overlay';
import { CanvasController } from './canvas-controller';
import { ZoomControls } from './zoom-controls';
import { merge } from 'lodash';

type FullscreenCanvasProps = {
  canvasController: CanvasController;
} & OverlayProps;

export const FullscreenCanvas = ({
  canvasController,
  slots,
}: FullscreenCanvasProps) => {
  console.log('Render FullscreenCanvas');
  const defaultSlots: OverlayProps['slots'] = {
    bottom: {
      right: <ZoomControls canvasController={canvasController} />,
    },
  };

  return (
    <>
      <Canvas canvasController={canvasController} />
      <Overlay slots={merge(defaultSlots, slots)} />
    </>
  );
};
