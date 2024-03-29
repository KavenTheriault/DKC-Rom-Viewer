type OnScaleChangeHandler = (scale: number) => void;

export type Position = {
  x: number;
  y: number;
};

export class CanvasController {
  private _scale: number;
  private _translatePosition: Position;
  private readonly _onScaleChangeHandlers: OnScaleChangeHandler[];

  constructor() {
    this._scale = 1;
    this._translatePosition = { x: 0, y: 0 };
    this._onScaleChangeHandlers = [];
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

  onScaleChange(handler: OnScaleChangeHandler) {
    this._onScaleChangeHandlers.push(handler);
  }
}
