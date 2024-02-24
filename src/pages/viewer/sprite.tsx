import { ChangeEvent, useState } from 'react';
import { SelectedRom } from '../../types/selected-rom';
import { RomAddress } from '../../rom-parser/types/address';
import { SpriteHeaderTable } from './components/sprite-header';
import { validateSpriteHeader } from '../../rom-parser/scan/sprites';
import {
  getAddressFromSpritePointerIndex,
  readSprite,
  Sprite,
} from '../../rom-parser/sprites';
import { toHexString } from '../../utils/hex';
import { ImageCanvas } from '../../components/image-canvas';
import { Array2D, Color, Image } from '../../rom-parser/sprites/types';
import {
  buildImageFromPixelsAndPalette,
  readPalette,
} from '../../rom-parser/sprites/palette';
import { assembleSprite } from '../../rom-parser/sprites/sprite-part';
import { SpritePartsViewer } from './components/sprite-parts';

interface SpriteViewerProps {
  selectedRom: SelectedRom;
}

const isHexadecimal = (str: string) => /^[0-9A-F]+$/.test(str);

export const SpriteViewer = ({ selectedRom }: SpriteViewerProps) => {
  const [snesAddress, setSnesAddress] = useState<string>('');
  const [spritePointer, setSpritePointer] = useState<string>('');
  const [sprite, setSprite] = useState<Sprite>();
  const [spriteImage, setSpriteImage] = useState<Image>();
  const [error, setError] = useState('');

  const onSnesAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setSnesAddress(input);
    }
  };

  const onSpritePointerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setSpritePointer(input);
    }
  };

  const onSnesAddressLoadClick = () => {
    if (snesAddress) {
      const parsedSnesAddress = parseInt(snesAddress, 16);
      loadSprite(RomAddress.fromSnesAddress(parsedSnesAddress));
      setSpritePointer('');
    } else {
      setSprite(undefined);
    }
  };

  const onSpritePointerLoadClick = () => {
    if (spritePointer) {
      const parsedSpritePointer = parseInt(spritePointer, 16);
      loadSpritePointer(parsedSpritePointer);
    } else {
      setSnesAddress('');
      setSprite(undefined);
    }
  };

  const offsetSpritePointer = (offset: number) => {
    let previousSpritePointer: number = spritePointer
      ? parseInt(spritePointer, 16)
      : 0;
    previousSpritePointer += offset;
    setSpritePointer(toHexString(previousSpritePointer));
    loadSpritePointer(previousSpritePointer);
  };

  const loadSpritePointer = (spritePointer: number) => {
    const spiteAddress = getAddressFromSpritePointerIndex(
      selectedRom.data,
      spritePointer,
    );
    setSnesAddress(
      spiteAddress.snesAddress.toString(16).toString().toUpperCase(),
    );
    loadSprite(spiteAddress);
  };

  const loadSprite = (spriteAddress: RomAddress) => {
    const loadedSprite = readSprite(selectedRom.data, spriteAddress);
    if (loadedSprite && validateSpriteHeader(loadedSprite.header)) {
      setError('');
      setSprite(loadedSprite);
      buildSpriteImage(loadedSprite);
    } else {
      setError('Invalid Sprite Header');
      setSprite(undefined);
      setSpriteImage(undefined);
    }
  };

  const buildSpriteImage = (spriteToBuild: Sprite) => {
    const palette: Color[] = readPalette(
      selectedRom.data,
      RomAddress.fromSnesAddress(0xbc849a),
    );
    const spritePixels: Array2D = assembleSprite(spriteToBuild.parts);
    const image: Image = buildImageFromPixelsAndPalette(spritePixels, palette);
    setSpriteImage(image);
  };

  return (
    <div className="columns is-flex-wrap-wrap">
      <div className="column">
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
                value={snesAddress}
                onChange={onSnesAddressChange}
              />
            </p>
            <p className="control">
              <a className="button is-primary" onClick={onSnesAddressLoadClick}>
                Load
              </a>
            </p>
          </div>
        </div>
        <div className="block">
          <label className="label">Sprite Pointer (from 0x3BCC9C)</label>
          <div className="field has-addons">
            <p className="control">
              <a className="button is-static">0x</a>
            </p>
            <p className="control">
              <input
                className="input"
                type="text"
                placeholder="Hexadecimal"
                value={spritePointer}
                onChange={onSpritePointerChange}
              />
            </p>
            <p className="control">
              <a
                className="button is-primary"
                onClick={onSpritePointerLoadClick}
              >
                Load
              </a>
            </p>
            <p className="control">
              <a
                className="button is-primary is-outlined"
                onClick={() => {
                  offsetSpritePointer(-4);
                }}
              >
                -4
              </a>
            </p>
            <p className="control">
              <a
                className="button is-primary is-outlined"
                onClick={() => {
                  offsetSpritePointer(4);
                }}
              >
                +4
              </a>
            </p>
          </div>
        </div>

        {error && <div className="notification is-danger">{error}</div>}

        {sprite && (
          <nav className="panel is-info">
            <p className="panel-heading">Sprite Header</p>
            <div className="panel-block">
              <SpriteHeaderTable spriteHeader={sprite.header} />
            </div>
          </nav>
        )}
      </div>
      <div className="column">
        <ImageCanvas
          image={spriteImage}
          defaultSize={{ width: 256, height: 256 }}
        />
      </div>
      <div className="column">
        <SpritePartsViewer spriteParts={sprite?.parts} />
      </div>
    </div>
  );
};
