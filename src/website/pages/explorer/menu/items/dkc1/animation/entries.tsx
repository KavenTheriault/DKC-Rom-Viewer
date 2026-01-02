import { useState } from 'react';
import {
  AnimationInfo,
  EntryCommand,
  EntrySprite,
  isEntrySprite,
} from '../../../../../../../rom-io/common/animations/types';
import { getAddressFromSpritePointerIndex } from '../../../../../../../rom-io/common/sprites';
import { Dkc1SpritePointerTable } from '../../../../../../../rom-io/dkc1/constants';
import { setAppState, useAppSelector } from '../../../../../../state';
import { toHexString } from '../../../../../../utils/hex';
import { spriteMenuItem } from '../../../index';

interface AnimationEntriesProps {
  animationInfo: AnimationInfo;
}

export const AnimationEntries = ({ animationInfo }: AnimationEntriesProps) => {
  const rom = useAppSelector((s) => s.rom);
  if (!rom) return null;

  const [selectedAnimationEntryIndex, setSelectedAnimationEntryIndex] =
    useState<number>(0);

  const renderGoToSpriteButton = (entry?: EntryCommand | EntrySprite) => {
    if (!entry || !isEntrySprite(entry)) return null;
    return (
      <button
        className="mt-2 button is-primary"
        onClick={() => {
          if (!rom || !entry || !isEntrySprite(entry)) return null;

          const spriteAddress = getAddressFromSpritePointerIndex(
            rom.data,
            Dkc1SpritePointerTable,
            entry.spriteIndex,
          );
          console.log('spriteAddress', spriteAddress);
          //saveViewerModeAddress(ViewerMode.Sprite, spriteAddress);
          //navigateToMode(ViewerMode.Sprite);
          setAppState(() => ({
            mainMenu: {
              selectedItem: spriteMenuItem,
            },
          }));
        }}
      >
        Go to Sprite {`${toHexString(entry.spriteIndex, { addPrefix: true })}`}
      </button>
    );
  };

  return (
    <div className="is-flex is-flex-direction-column is-align-items-center">
      <div className="select is-multiple">
        <select
          multiple
          size={8}
          onChange={(e) =>
            setSelectedAnimationEntryIndex(parseInt(e.target.value))
          }
        >
          {animationInfo.entries.map((entry, index) => (
            <option key={`animationEntry${index}`} value={index}>
              {buildAnimationEntryString(entry)}
            </option>
          ))}
        </select>
      </div>
      {renderGoToSpriteButton(
        animationInfo.entries[selectedAnimationEntryIndex],
      )}
    </div>
  );
};

const buildAnimationEntryString = (entry: EntryCommand | EntrySprite) => {
  if ('time' in entry) {
    return `Time: ${entry.time} Sprite: ${toHexString(entry.spriteIndex, { addPrefix: true })}`;
  }
  const parameters = [];
  for (const parameter of entry.parameters) {
    parameters.push(toHexString(parameter));
  }
  return `Command: ${toHexString(entry.command, { addPrefix: true })} Params: ${parameters.join(' ')}`;
};
