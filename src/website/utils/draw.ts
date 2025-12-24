import { ImageMatrix } from '../../rom-io/types/image-matrix';
import { Size } from '../types/spatial';
import { rgbToHex } from './hex';

export const drawImage = (
  context: CanvasRenderingContext2D,
  imageToDraw: ImageMatrix,
  offset?: Size,
) => {
  const offscreenCanvas = new OffscreenCanvas(
    imageToDraw.width,
    imageToDraw.height,
  );
  const offscreenContext = offscreenCanvas.getContext('2d')!;

  for (let x = 0; x < imageToDraw.width; x++) {
    for (let y = 0; y < imageToDraw.height; y++) {
      const color = imageToDraw.get(x, y);

      if (color) {
        offscreenContext.fillStyle = rgbToHex(color.r, color.g, color.b);
        offscreenContext.fillRect(x, y, 1, 1);
      }
    }
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(offscreenCanvas, offset?.width ?? 0, offset?.height ?? 0);
};

export const getDrawCenterOffset = (
  canvas: HTMLCanvasElement,
  contentSize: Size,
): Size => {
  return {
    width: (canvas.width - contentSize.width) / 2,
    height: (canvas.height - contentSize.height) / 2,
  };
};
