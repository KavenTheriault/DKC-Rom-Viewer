import { toHexString } from '../../../website/utils/hex';
import { extract, read16, read8 } from '../../buffer';
import { RomAddress } from '../../rom/address';
import { Color } from '../../types/color';
import { ImageMatrix } from '../../types/image-matrix';
import { buildImageFromPixelsAndPalette } from '../images';
import { getAddressFromSpritePointerIndex, readSprite } from '../sprites';
import { assembleSprite } from '../sprites/sprite-part';
import {
  Animation,
  AnimationCommand,
  AnimationCommandParametersCount,
  AnimationStep,
  EntryCommand,
  EntrySprite,
  AnimationInfo,
} from './types';

const ANIMATION_POINTER_LENGTH = 2;

export const readAnimationPointer = (
  romData: Buffer,
  animationScriptBankSnesAddress: number,
  animationScriptTableSnesAddress: number,
  animationIndex: number,
): RomAddress => {
  const address: RomAddress = RomAddress.fromSnesAddress(
    (animationScriptBankSnesAddress | animationScriptTableSnesAddress) +
      animationIndex * ANIMATION_POINTER_LENGTH,
  );
  const pointer: number = read16(romData, address.pcAddress);
  return animationPointerToSnesAddress(animationScriptBankSnesAddress, pointer);
};

const animationPointerToSnesAddress = (
  animationScriptBankSnesAddress: number,
  animationAddress: number,
): RomAddress => {
  return RomAddress.fromSnesAddress(
    animationScriptBankSnesAddress | animationAddress,
  );
};

export const readAnimationInfo = (
  romData: Buffer,
  animationAddress: RomAddress,
): AnimationInfo => {
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

  const bytes = extract(romData, animationAddress.pcAddress, offset);
  return { address: animationAddress, bytes, entries };
};

export const buildAnimation = (
  romData: Buffer,
  spritePointerTableSnesAddress: number,
  animationInfo: AnimationInfo,
  palette: Color[],
): Animation => {
  const animation: AnimationStep[] = [];

  for (const entry of animationInfo.entries) {
    if ('spriteIndex' in entry) {
      const spriteAddress = getAddressFromSpritePointerIndex(
        romData,
        spritePointerTableSnesAddress,
        entry.spriteIndex,
      );
      const sprite = readSprite(romData, spriteAddress);
      if (!sprite)
        throw new Error(
          `Can't find sprite at ${toHexString(entry.spriteIndex)}`,
        );

      const spritePixels = assembleSprite(sprite.parts);
      const image: ImageMatrix = buildImageFromPixelsAndPalette(
        spritePixels,
        palette,
      );

      animation.push({ time: entry.time, image });
    }
  }

  return animation;
};
