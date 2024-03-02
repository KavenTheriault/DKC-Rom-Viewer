import { RomAddress } from '../types/address';
import { Image } from '../sprites/types';

/* Animation Commands
   Ref: http://www.dkc-atlas.com/forum/viewtopic.php?f=38&t=448
* */
export enum AnimationCommand {
  LOOP = 0x80,
  UNSUPPORTED_0 = 0x81,
  UNSUPPORTED_1 = 0x82,
  UNSUPPORTED_2 = 0x83,
  UNSUPPORTED_3 = 0x84,
  UNSUPPORTED_4 = 0x85,
  UNSUPPORTED_5 = 0x86,
  UNSUPPORTED_6 = 0x87,
  UNSUPPORTED_7 = 0x88,
  UNSUPPORTED_8 = 0x8b,
  UNSUPPORTED_9 = 0x8c,
  UNSUPPORTED_A = 0x8d,
  UNSUPPORTED_B = 0x8e,
  UNSUPPORTED_C = 0x8f,
  UNSUPPORTED_D = 0x90,
  OTHER_0 = 0x40,
}

export const AnimationCommandParametersCount: Record<AnimationCommand, number> =
  {
    [AnimationCommand.LOOP]: 1,
    [AnimationCommand.UNSUPPORTED_0]: 3,
    [AnimationCommand.UNSUPPORTED_1]: 2,
    [AnimationCommand.UNSUPPORTED_2]: 2,
    [AnimationCommand.UNSUPPORTED_3]: 3,
    [AnimationCommand.UNSUPPORTED_4]: 5,
    [AnimationCommand.UNSUPPORTED_5]: 9,
    [AnimationCommand.UNSUPPORTED_6]: 7,
    [AnimationCommand.UNSUPPORTED_7]: 4,
    [AnimationCommand.UNSUPPORTED_8]: 7,
    [AnimationCommand.UNSUPPORTED_9]: 2,
    [AnimationCommand.UNSUPPORTED_A]: 4,
    [AnimationCommand.UNSUPPORTED_B]: 1,
    [AnimationCommand.UNSUPPORTED_C]: 1,
    [AnimationCommand.UNSUPPORTED_D]: 1,
    [AnimationCommand.OTHER_0]: 2,
  };

export type RawAnimation = {
  address: RomAddress;
  bytes: Buffer;
  entries: (EntryCommand | EntrySprite)[];
};

export type EntryCommand = {
  command: AnimationCommand;
  parameters: Buffer;
};

export type EntrySprite = {
  time: number;
  spriteIndex: number;
};

export type AnimationStep = { time: number; image: Image };

export type Animation = AnimationStep[];
