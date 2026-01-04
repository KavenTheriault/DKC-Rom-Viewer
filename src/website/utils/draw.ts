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

export const drawImageBitmap = (
  context: CanvasRenderingContext2D,
  imageBitmap: ImageBitmap,
  offset?: Size,
) => {
  context.imageSmoothingEnabled = false;
  context.drawImage(imageBitmap, offset?.width ?? 0, offset?.height ?? 0);
};

export const drawRectangle = (
  context: CanvasRenderingContext2D,
  rectangle: {
    x: number;
    y: number;
    width: number;
    height: number;
    lineWidth: number;
    strokeStyle: string;
  },
  offset?: Size,
) => {
  context.lineWidth = rectangle.lineWidth;
  context.strokeStyle = rectangle.strokeStyle;

  context.beginPath();
  context.rect(
    rectangle.x + (offset?.width ?? 0),
    rectangle.y + (offset?.height ?? 0),
    rectangle.width,
    rectangle.height,
  );
  context.stroke();
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
