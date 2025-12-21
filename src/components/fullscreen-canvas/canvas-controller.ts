const ZOOM_SPEED_PERCENTAGE = 1.2;

type OnScaleChangeHandler = (scale: number) => void;
type OnDrawHandler = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) => void;

export type Position = {
  x: number;
  y: number;
};

export class CanvasController {
  private _scale: number;
  private _translatePosition: Position;
  private readonly _onDrawHandlers: OnDrawHandler[];
  private readonly _onScaleChangeHandlers: OnScaleChangeHandler[];

  private _canvas: HTMLCanvasElement | undefined;
  private _context: CanvasRenderingContext2D | undefined;

  constructor() {
    console.log('CanvasController constructor');

    this._scale = 1;
    this._translatePosition = { x: 0, y: 0 };
    this._onDrawHandlers = [];
    this._onScaleChangeHandlers = [];
  }

  attachCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    console.log('CanvasController attachCanvas');

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

    this._context.setTransform(
      this._scale,
      0,
      0,
      this._scale,
      this._translatePosition.x,
      this._translatePosition.y,
    );

    this._context.save();
    this._context.setTransform(1, 0, 0, 1, 0, 0);
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.restore();

    for (const onDrawHandler of this._onDrawHandlers) {
      onDrawHandler(this._canvas, this._context);
    }
  }

  onDraw(handler: OnDrawHandler) {
    this._onDrawHandlers.push(handler);
  }

  onScaleChange(handler: OnScaleChangeHandler) {
    this._onScaleChangeHandlers.push(handler);
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
