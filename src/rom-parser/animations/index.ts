import { RomAddress } from '../types/address';
import { extract, read16, read8 } from '../utils/buffer';
import {
  Animation,
  AnimationCommand,
  AnimationCommandParametersCount,
  AnimationStep,
  EntryCommand,
  EntrySprite,
  RawAnimation,
} from './types';
import { getAddressFromSpritePointerIndex, readSprite } from '../sprites';
import { toHexString } from '../../utils/hex';
import { Array2D, Color, Image } from '../sprites/types';
import { buildImageFromPixelsAndPalette } from '../sprites/palette';
import { assembleSprite } from '../sprites/sprite-part';

const ANIMATION_POINTERS_ADDRESS: RomAddress =
  RomAddress.fromSnesAddress(0x3e8572);
const ANIMATION_POINTER_LENGTH = 2;

export const readAnimationPointer = (
  romData: Buffer,
  animationIndex: number,
): RomAddress => {
  const address: RomAddress = RomAddress.fromSnesAddress(
    ANIMATION_POINTERS_ADDRESS.snesAddress +
      animationIndex * ANIMATION_POINTER_LENGTH,
  );
  const pointer: number = read16(romData, address.pcAddress);
  return animationPointerToSnesAddress(pointer);
};

const animationPointerToSnesAddress = (
  animationAddress: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(0xbe0000 | animationAddress);
};

export const readRawAnimation = (
  romData: Buffer,
  animationAddress: RomAddress,
): RawAnimation => {
  const entries: (EntryCommand | EntrySprite)[] = [];

  let offset = 0;
  let lastCommand = 0;

  while (lastCommand !== AnimationCommand.LOOP) {
    if (offset > 3000) throw new Error('No LOOP command found');

    const entryStart: number = read8(
      romData,
      animationAddress.pcAddress + offset,
    );
    lastCommand = entryStart;
    offset++;

    if (entryStart in AnimationCommandParametersCount) {
      const parametersCount =
        AnimationCommandParametersCount[entryStart as AnimationCommand];
      const parameters: Buffer = extract(
        romData,
        animationAddress.pcAddress + offset,
        parametersCount,
      );
      offset += parametersCount;

      entries.push({ command: entryStart, parameters });
    } else {
      const spritePointer: number = read16(
        romData,
        animationAddress.pcAddress + offset,
      );
      offset += 2;

      entries.push({ time: entryStart, spriteIndex: spritePointer });
    }
  }

  return { address: animationAddress, entries };
};

export const buildAnimation = (
  romData: Buffer,
  animationSequence: RawAnimation,
  palette: Color[],
): Animation => {
  const animation: AnimationStep[] = [];

  for (const entry of animationSequence.entries) {
    if ('spriteIndex' in entry) {
      const spriteAddress = getAddressFromSpritePointerIndex(
        romData,
        entry.spriteIndex,
      );
      const sprite = readSprite(romData, spriteAddress);
      if (!sprite)
        throw new Error(
          `Can't find sprite at ${toHexString(entry.spriteIndex)}`,
        );

      const spritePixels: Array2D = assembleSprite(sprite.parts);
      const image: Image = buildImageFromPixelsAndPalette(
        spritePixels,
        palette,
      );

      animation.push({ time: entry.time, image });
    }
  }

  return animation;
};
