import { useEffect, useState } from 'react';
import { bufferToString, toHexString } from '../../utils/hex';
import { RomAddress } from '../../rom-parser/types/address';
import {
  buildAnimation,
  readAnimationPointer,
  readRawAnimation,
} from '../../rom-parser/animations';
import {
  Animation,
  EntryCommand,
  EntrySprite,
  RawAnimation,
} from '../../rom-parser/animations/types';
import { ImageCanvas } from '../../components/image-canvas';
import { Color } from '../../rom-parser/sprites/types';
import { ViewerMode, ViewerModeBaseProps } from './types';
import { getAddressFromSpritePointerIndex } from '../../rom-parser/sprites';
import { readPalette } from '../../rom-parser/palette';
import { getViewerModeAddress, saveViewerModeAddress } from './memory';
import { DEFAULT_PALETTE } from '../../utils/defaults';
import { ScanAddresses } from '../../components/scan-adresses';
import { scanAnimations } from '../../rom-parser/scan/animations';
import { LoadHexadecimalInput } from '../../components/load-hexadecimal-input';
import {
  AnimationScriptBank,
  AnimationScriptTable,
} from '../../rom-parser/constants/dkc1';

const displayAnimationEntry = (entry: EntryCommand | EntrySprite) => {
  if ('time' in entry) {
    return `Time: ${entry.time} Sprite: ${toHexString(entry.spriteIndex)}`;
  }
  const parameters = [];
  for (const parameter of entry.parameters) {
    parameters.push(toHexString(parameter));
  }
  return `Command: ${toHexString(entry.command)} Params: ${parameters.join(' ')}`;
};

export const AnimationViewer = ({
  selectedRom,
  navigateToMode,
}: ViewerModeBaseProps) => {
  const [animationAddress, setAnimationAddress] = useState<number>();
  const [paletteAddress, setPaletteAddress] = useState<number>();
  const [animationIndex, setAnimationIndex] = useState<string>('');

  const [rawAnimation, setRawAnimation] = useState<RawAnimation>();
  const [animation, setAnimation] = useState<Animation>();

  const [selectedAnimationEntryIndex, setSelectedAnimationEntryIndex] =
    useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPaletteAddress =
      getViewerModeAddress(ViewerMode.Palette) ||
      RomAddress.fromSnesAddress(DEFAULT_PALETTE);
    if (savedPaletteAddress) {
      setPaletteAddress(savedPaletteAddress.snesAddress);
    }

    const savedAnimationAddress = getViewerModeAddress(ViewerMode.Animation);
    if (savedAnimationAddress) {
      setAnimationAddress(savedAnimationAddress.snesAddress);
      loadAnimationAndPalette(savedAnimationAddress, savedPaletteAddress);
    }
  }, []);

  const onAnimationAddressLoadClick = () => {
    if (animationAddress) {
      loadAnimationAndPalette(
        RomAddress.fromSnesAddress(animationAddress),
        RomAddress.fromSnesAddress(paletteAddress || DEFAULT_PALETTE),
      );
      setAnimationIndex('');
    } else {
      setRawAnimation(undefined);
    }
  };

  const onAnimationIndexLoadClick = () => {
    if (animationIndex) {
      loadAnimationIndex(parseInt(animationIndex));
    } else {
      setAnimationAddress(0);
      setRawAnimation(undefined);
    }
  };

  const offsetAnimationIndex = (offset: number) => {
    let newAnimationIndex: number = animationIndex
      ? parseInt(animationIndex)
      : 0;
    newAnimationIndex += offset;

    if (newAnimationIndex > 0) {
      setAnimationIndex(newAnimationIndex.toString());
      loadAnimationIndex(newAnimationIndex);
    }
  };

  const loadAnimationIndex = (index: number) => {
    const address = readAnimationPointer(selectedRom.data, index);
    loadAnimation(address);
    setAnimationAddress(address.snesAddress);
  };

  const loadAnimation = (animationAddress: RomAddress) => {
    const palette = RomAddress.fromSnesAddress(
      paletteAddress || DEFAULT_PALETTE,
    );
    loadAnimationAndPalette(animationAddress, palette);
  };

  const loadAnimationAndPalette = (
    animationAddress: RomAddress,
    paletteAddress: RomAddress,
  ) => {
    try {
      const animationSequence = readRawAnimation(
        selectedRom.data,
        animationAddress,
      );
      setRawAnimation(animationSequence);
      saveViewerModeAddress(ViewerMode.Animation, animationAddress);

      const palette: Color[] = readPalette(selectedRom.data, paletteAddress);
      const newAnimation = buildAnimation(
        selectedRom.data,
        animationSequence,
        palette,
      );
      setAnimation(newAnimation);
      setError('');
    } catch (e) {
      setAnimation(undefined);
      setError("Can't build animation");
    }
  };

  const renderEntry = (entry?: EntryCommand | EntrySprite) => {
    if (!entry) return null;
    if ('spriteIndex' in entry) {
      return (
        <button
          className="button is-info"
          onClick={() => {
            const spriteAddress = getAddressFromSpritePointerIndex(
              selectedRom.data,
              entry.spriteIndex,
            );
            saveViewerModeAddress(ViewerMode.Sprite, spriteAddress);
            navigateToMode(ViewerMode.Sprite);
          }}
        >
          Go to sprite
        </button>
      );
    }
    return null;
  };

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="columns is-flex-wrap-wrap">
        <div className="column is-flex is-flex-direction-column is-align-items-start">
          <LoadHexadecimalInput
            label="SNES Address"
            hexadecimalValue={animationAddress}
            onValueChange={setAnimationAddress}
            onValueLoad={onAnimationAddressLoadClick}
          />
          <div className="block">
            <label className="label">{`Animation Index (from ${toHexString(AnimationScriptBank | AnimationScriptTable, { addPrefix: true })})`}</label>
            <div className="field has-addons">
              <p className="control">
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="Decimal"
                  value={animationIndex}
                  onChange={(e) => setAnimationIndex(e.target.value)}
                />
              </p>
              <p className="control">
                <a
                  className="button is-primary"
                  onClick={onAnimationIndexLoadClick}
                >
                  Load
                </a>
              </p>
              <p className="control">
                <a
                  className="button is-primary is-outlined"
                  onClick={() => {
                    offsetAnimationIndex(-1);
                  }}
                >
                  -1
                </a>
              </p>
              <p className="control">
                <a
                  className="button is-primary is-outlined"
                  onClick={() => {
                    offsetAnimationIndex(1);
                  }}
                >
                  +1
                </a>
              </p>
            </div>
          </div>
          <LoadHexadecimalInput
            label="Palette Address"
            hexadecimalValue={paletteAddress}
            onValueChange={setPaletteAddress}
            onValueLoad={onAnimationAddressLoadClick}
          />
          {error && <div className="notification is-danger">{error}</div>}
        </div>
        <div className="column">
          <ImageCanvas
            animation={animation}
            defaultSize={{ width: 256, height: 256 }}
          />
        </div>
        <div className="column">
          {rawAnimation && (
            <>
              <label className="label">Animation Steps</label>
              <div className="block select is-multiple">
                <select
                  multiple
                  size={10}
                  onChange={(e) =>
                    setSelectedAnimationEntryIndex(parseInt(e.target.value))
                  }
                >
                  {rawAnimation?.entries.map((entry, index) => (
                    <option key={`animationEntry${index}`} value={index}>
                      {displayAnimationEntry(entry)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="block">
                {renderEntry(
                  rawAnimation?.entries[selectedAnimationEntryIndex],
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="columns">
        <div className="column">
          <ScanAddresses
            scan={scanAnimations}
            selectedRom={selectedRom}
            onSelectedAddressChange={(animationAddress) => {
              setAnimationAddress(animationAddress.snesAddress);
              loadAnimation(animationAddress);
            }}
            title="Animations"
          />
        </div>
        <div className="column">
          {rawAnimation && (
            <>
              <label className="label">Raw Data</label>
              <pre>{bufferToString(rawAnimation.bytes)}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
