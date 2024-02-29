import { ChangeEvent, useState } from 'react';
import { isHexadecimal, toHexString } from '../../utils/hex';
import { RomAddress } from '../../rom-parser/types/address';
import {
  buildAnimation,
  readAnimationPointer,
  readRawAnimation,
} from '../../rom-parser/animations';
import { SelectedRom } from '../../types/selected-rom';
import {
  Animation,
  EntryCommand,
  EntrySprite,
  RawAnimation,
} from '../../rom-parser/animations/types';
import { ImageCanvas } from '../../components/image-canvas';
import { Color } from '../../rom-parser/sprites/types';
import { readPalette } from '../../rom-parser/sprites/palette';

interface AnimationViewerProps {
  selectedRom: SelectedRom;
}

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

export const AnimationViewer = ({ selectedRom }: AnimationViewerProps) => {
  const [animationAddress, setAnimationAddress] = useState<string>('');
  const [animationIndex, setAnimationIndex] = useState<string>('');

  const [rawAnimation, setRawAnimation] = useState<RawAnimation>();
  const [animation, setAnimation] = useState<Animation>();

  const [error, setError] = useState('');

  const onAnimationAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setAnimationAddress(input);
    }
  };

  const onAnimationAddressLoadClick = () => {
    if (animationAddress) {
      const parsedSnesAddress = parseInt(animationAddress, 16);
      loadAnimation(RomAddress.fromSnesAddress(parsedSnesAddress));
      setAnimationIndex('');
    } else {
      setRawAnimation(undefined);
    }
  };

  const onAnimationIndexLoadClick = () => {
    if (animationIndex) {
      loadAnimationIndex(parseInt(animationIndex));
    } else {
      setAnimationAddress('');
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
    setAnimationAddress(toHexString(address.snesAddress));
  };

  const loadAnimation = (animationAddress: RomAddress) => {
    try {
      const animationSequence = readRawAnimation(
        selectedRom.data,
        animationAddress,
      );
      setRawAnimation(animationSequence);

      const palette: Color[] = readPalette(
        selectedRom.data,
        RomAddress.fromSnesAddress(0xbc849a),
      );
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

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="columns is-flex-wrap-wrap">
        <div className="column is-flex is-flex-direction-column is-align-items-start">
          <div className="block">
            <label className="label">SNES Address</label>
            <div className="field has-addons">
              <p className="control">
                <a className="button is-static">0x</a>
              </p>
              <p className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Hexadecimal"
                  value={animationAddress}
                  onChange={onAnimationAddressChange}
                />
              </p>
              <p className="control">
                <a
                  className="button is-primary"
                  onClick={onAnimationAddressLoadClick}
                >
                  Load
                </a>
              </p>
            </div>
          </div>
          <div className="block">
            <label className="label">Animation Index (from 0X3E8572)</label>
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

          {error && <div className="notification is-danger">{error}</div>}
        </div>
        <div className="column">
          <ImageCanvas
            animation={animation}
            defaultSize={{ width: 256, height: 256 }}
          />
        </div>
        <div className="column">
          <label className="label">Animation Steps</label>
          <div className="select is-multiple">
            <select multiple size={10}>
              {rawAnimation?.entries.map((entry, index) => (
                <option key={`animationEntry${index}`} value={index}>
                  {displayAnimationEntry(entry)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
