import { Matrix } from './matrix';

export type Color = {
  r: number;
  g: number;
  b: number;
};

export type ImageMatrix = Matrix<Color | null>;
