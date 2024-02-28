import { ChangeEvent, useState } from 'react';
import { isHexadecimal, toHexString } from '../../utils/hex';
import { RomAddress } from '../../rom-parser/types/address';
import {
  buildAnimation,
  readAnimationPointer,
  readRawAnimation,
} from '../../rom-parser/animations';
import { SelectedRom } from '../../types/selected-rom';
import { Animation, RawAnimation } from '../../rom-parser/animations/types';
import { ImageCanvas } from '../../components/image-canvas';
import { Color } from '../../rom-parser/sprites/types';
import { readPalette } from '../../rom-parser/sprites/palette';

interface AnimationViewerProps {
  selectedRom: SelectedRom;
}

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
      const parsedAnimationIndex = parseInt(animationIndex, 16);
      loadAnimationIndex(parsedAnimationIndex);
    } else {
      setAnimationAddress('');
      setRawAnimation(undefined);
    }
  };

  const offsetAnimationIndex = (offset: number) => {
    let previousAnimationIndex: number = animationIndex
      ? parseInt(animationIndex)
      : 0;
    previousAnimationIndex += offset;
    setAnimationIndex(previousAnimationIndex.toString());
    loadAnimationIndex(previousAnimationIndex);
  };

  const loadAnimationIndex = (index: number) => {
    const address = readAnimationPointer(selectedRom.data, index);
    loadAnimation(address);
    setAnimationAddress(toHexString(address.snesAddress));
  };

  const loadAnimation = (animationAddress: RomAddress) => {
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
          {rawAnimation && JSON.stringify(rawAnimation, undefined, 2)}
        </div>
        <div className="column">
          <ImageCanvas
            animation={animation}
            defaultSize={{ width: 256, height: 256 }}
          />
        </div>
      </div>
    </div>
  );
};
