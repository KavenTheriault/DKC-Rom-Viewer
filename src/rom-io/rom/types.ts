import { RomHeader } from './header';

export interface Rom {
  header: RomHeader;
  data: Buffer;
}
