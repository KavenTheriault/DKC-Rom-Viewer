import { RomHeader } from './header';

export interface Rom {
  header: RomHeader;
  data: Uint8Array;
}
