import { Position } from '../../types/spatial';

const ZOOM_SPEED_PERCENTAGE = 1.2;

export type OnScaleChangeHandler = (scale: number) => void;
export type OnDrawHandler = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) => void;

export class CanvasController {
  private _scale: number;
  private _translatePosition: Position;
  private readonly _onDrawHandlers: Set<OnDrawHandler>;
  private readonly _onScaleChangeHandlers: Set<OnScaleChangeHandler>;

  private _canvas: HTMLCanvasElement | undefined;
  private _context: CanvasRenderingContext2D | undefined;

  constructor() {
    this._scale = 1;
    this._translatePosition = { x: 0, y: 0 };
    this._onDrawHandlers = new Set<OnDrawHandler>();
    this._onScaleChangeHandlers = new Set<OnScaleChangeHandler>();
  }

  attachCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    this._canvas = canvas;
    this._context = context;
  }

  get canvas(): HTMLCanvasElement {
    if (!this._canvas) {
      throw new Error('No canvas attached to this controller.');
    }

    return this._canvas;
  }

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = value;
    for (const onScaleChangeHandler of this._onScaleChangeHandlers) {
      onScaleChangeHandler(value);
    }
  }

  get translatePosition(): Position {
    return this._translatePosition;
  }

  set translatePosition(value: Position) {
    this._translatePosition = value;
  }

  draw() {
    if (!this._canvas || !this._context) {
      throw new Error('No canvas attached to this controller.');
    }

    /* The entire canvas is cleared and redrawn on every draw call */
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this._context.setTransform(
      this._scale,
      0,
      0,
      this._scale,
      this._translatePosition.x,
      this._translatePosition.y,
    );

    for (const onDrawHandler of this._onDrawHandlers) {
      onDrawHandler(this._canvas, this._context);
    }
  }

  registerDrawHandler(handler: OnDrawHandler) {
    this._onDrawHandlers.add(handler);
  }

  unregisterDrawHandler(handler: OnDrawHandler) {
    this._onDrawHandlers.delete(handler);
  }

  registerScaleChangeHandler(handler: OnScaleChangeHandler) {
    this._onScaleChangeHandlers.add(handler);
  }

  unregisterScaleChangeHandler(handler: OnScaleChangeHandler) {
    this._onScaleChangeHandlers.delete(handler);
  }

  zoom(direction: 'in' | 'out', x: number, y: number) {
    const currentPosition = this.translatePosition;
    const factor =
      direction === 'in' ? ZOOM_SPEED_PERCENTAGE : 1 / ZOOM_SPEED_PERCENTAGE;

    this.scale *= factor;
    this.translatePosition = {
      x: (currentPosition.x -= (x - currentPosition.x) * (factor - 1)),
      y: (currentPosition.y -= (y - currentPosition.y) * (factor - 1)),
    };

    this.draw();
  }
}
