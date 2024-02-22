import { RomHeader } from '../rom-parser/rom-header';

export type SelectedRom = {
  header: RomHeader;
  data: Buffer;
};
