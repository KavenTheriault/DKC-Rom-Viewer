import { Buffer } from '../types/buffer';
import { RomHeader } from './header';

export interface Rom {
  header: RomHeader;
  data: Buffer;
}
