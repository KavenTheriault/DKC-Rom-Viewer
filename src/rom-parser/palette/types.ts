import { Color } from '../sprites/types';
import { RomAddress } from '../types/address';

export type Palette = {
  address: RomAddress;
  colors: Color[];
};
