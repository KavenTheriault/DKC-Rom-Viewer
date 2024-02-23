import { RomAddress } from '../types/address';

export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Image = (Color | null)[][];

export type Coordinate = {
  x: number;
  y: number;
};

export type Array2D = number[][];

export type SmallTile = {
  address: RomAddress;
  pixels: Array2D;
};

export type LargeTile = {
  tiles: SmallTile[];
  pixels: Array2D;
};

export type SpritePart =
  | {
      type: '8x8';
      tile: SmallTile;
      coordinate: Coordinate;
    }
  | {
      type: '16x16';
      tile: LargeTile;
      coordinate: Coordinate;
    };
