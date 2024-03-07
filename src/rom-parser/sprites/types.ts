import { Matrix } from '../../types/matrix';
import { RomAddress } from '../types/address';

export type Coordinate = {
  x: number;
  y: number;
};

export type SmallTile = {
  address: RomAddress;
  pixels: Matrix<number>;
};

export type LargeTile = {
  tiles: SmallTile[];
  pixels: Matrix<number>;
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
