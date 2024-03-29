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
  private _mainDraw: OnDrawHandler | undefined;

  constructor() {
    console.log('CanvasController constructor');

    this._scale = 1;
    this._translatePosition = { x: 0, y: 0 };
    this._onDrawHandlers = [];
    this._onScaleChangeHandlers = [];
  }

  attachCanvas(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    mainDraw: OnDrawHandler,
  ) {
    console.log('CanvasController attachCanvas');

    this._canvas = canvas;
    this._context = context;
    this._mainDraw = mainDraw;
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
    if (!this._canvas || !this._context || !this._mainDraw) {
      throw new Error('No canvas attached to this controller.');
    }

    this._mainDraw(this._canvas, this._context);
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
}
