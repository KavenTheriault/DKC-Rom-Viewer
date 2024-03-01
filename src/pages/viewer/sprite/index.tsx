import { ChangeEvent, useEffect, useState } from 'react';
import { RomAddress } from '../../../rom-parser/types/address';
import { SpriteHeaderTable } from './sprite-header';
import { validateSpriteHeader } from '../../../rom-parser/scan/sprites';
import {
  getAddressFromSpritePointerIndex,
  readSprite,
  Sprite,
} from '../../../rom-parser/sprites';
import { isHexadecimal, toHexString } from '../../../utils/hex';
import { ImageCanvas, Rectangle } from '../../../components/image-canvas';
import { Array2D, Color, Image } from '../../../rom-parser/sprites/types';
import { assembleSprite } from '../../../rom-parser/sprites/sprite-part';
import { SpritePartsViewer } from './sprite-parts';
import { ScanSprites } from './scan-sprites';
import { ViewerMode, ViewerModeBaseProps } from '../types';
import {
  buildImageFromPixelsAndPalette,
  readPalette,
} from '../../../rom-parser/palette';
import { getViewerModeAddress, saveViewerModeAddress } from '../memory';
import { DEFAULT_PALETTE } from '../../../utils/defaults';

export const SpriteViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [snesAddress, setSnesAddress] = useState<string>('');
  const [paletteAddress, setPaletteAddress] = useState<string>('');
  const [spritePointer, setSpritePointer] = useState<string>('');

  const [sprite, setSprite] = useState<Sprite>();
  const [spriteImage, setSpriteImage] = useState<Image>();

  const [selectedPartIndexes, setSelectedPartIndexes] = useState<number[]>([]);
  const [showSelectedPartsBorder, setShowSelectedPartsBorder] =
    useState<boolean>(false);
  const [partBorderToShow, setPartBorderToShow] = useState<Rectangle[]>([]);

  const [error, setError] = useState('');

  useEffect(() => {
    const savedPaletteAddress =
      getViewerModeAddress(ViewerMode.Palette) ||
      RomAddress.fromSnesAddress(DEFAULT_PALETTE);
    if (savedPaletteAddress) {
      setPaletteAddress(toHexString(savedPaletteAddress.snesAddress));
    }

    const savedSpriteAddress = getViewerModeAddress(ViewerMode.Sprite);
    if (savedSpriteAddress) {
      setSnesAddress(toHexString(savedSpriteAddress.snesAddress));
      loadSpriteAndPalette(savedSpriteAddress, savedPaletteAddress);
    }
  }, []);

  useEffect(() => {
    if (sprite && showSelectedPartsBorder) {
      const borders = selectedPartIndexes.map((i) => {
        const part = sprite.parts[i];
        const size = part.type === '8x8' ? 8 : 16;
        return {
          x: part.coordinate.x,
          y: part.coordinate.y,
          width: size,
          height: size,
        };
      });
      setPartBorderToShow(borders);
    } else {
      setPartBorderToShow([]);
    }
  }, [showSelectedPartsBorder, selectedPartIndexes]);

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

  const onPaletteAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setPaletteAddress(input);
    }
  };

  const onSnesAddressLoadClick = () => {
    if (snesAddress) {
      const parsedSnesAddress = parseInt(snesAddress, 16);
      const parsedPaletteAddress = parseInt(paletteAddress, 16);
      loadSpriteAndPalette(
        RomAddress.fromSnesAddress(parsedSnesAddress),
        RomAddress.fromSnesAddress(parsedPaletteAddress),
      );
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
    const spriteAddress = getAddressFromSpritePointerIndex(
      selectedRom.data,
      spritePointer,
    );
    setSnesAddress(
      spriteAddress.snesAddress.toString(16).toString().toUpperCase(),
    );
    loadSprite(spriteAddress);
  };

  const loadSprite = (spriteAddress: RomAddress) => {
    const palette = RomAddress.fromSnesAddress(parseInt(paletteAddress, 16));
    loadSpriteAndPalette(spriteAddress, palette);
  };

  const loadSpriteAndPalette = (
    spriteAddress: RomAddress,
    paletteAddress: RomAddress,
  ) => {
    const loadedSprite = readSprite(selectedRom.data, spriteAddress);
    if (loadedSprite && validateSpriteHeader(loadedSprite.header)) {
      setError('');
      saveViewerModeAddress(ViewerMode.Sprite, spriteAddress);
      setSprite(loadedSprite);
      buildSpriteImage(loadedSprite, paletteAddress);
    } else {
      setError('Invalid Sprite Header');
      setSprite(undefined);
      setSpriteImage(undefined);
    }
    setShowSelectedPartsBorder(false);
    setSelectedPartIndexes([0]);
  };

  const buildSpriteImage = (
    spriteToBuild: Sprite,
    paletteAddress: RomAddress,
  ) => {
    const palette: Color[] = readPalette(selectedRom.data, paletteAddress);
    const spritePixels: Array2D = assembleSprite(spriteToBuild.parts);
    const image: Image = buildImageFromPixelsAndPalette(spritePixels, palette);
    setSpriteImage(image);
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
                  value={snesAddress}
                  onChange={onSnesAddressChange}
                />
              </p>
              <p className="control">
                <a
                  className="button is-primary"
                  onClick={onSnesAddressLoadClick}
                >
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
          <div className="block">
            <label className="label">Palette Address</label>
            <div className="field has-addons">
              <p className="control">
                <a className="button is-static">0x</a>
              </p>
              <p className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Hexadecimal"
                  value={paletteAddress}
                  onChange={onPaletteAddressChange}
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
            </div>
          </div>

          {error && <div className="notification is-danger">{error}</div>}

          {sprite && (
            <>
              <label className="label">Sprite Header</label>
              <SpriteHeaderTable spriteHeader={sprite.header} />
            </>
          )}
        </div>
        <div className="column">
          <ImageCanvas
            image={spriteImage}
            rectangles={partBorderToShow}
            defaultSize={{ width: 256, height: 256 }}
          />
        </div>

        <div className="column is-flex is-flex-direction-column is-align-items-flex-start">
          {sprite && (
            <>
              <label className="label">Options</label>
              <label className="checkbox mb-4">
                <input
                  type="checkbox"
                  checked={showSelectedPartsBorder}
                  onChange={(e) => setShowSelectedPartsBorder(e.target.checked)}
                />
                <span className="ml-1">Show selected parts borders</span>
              </label>
              <SpritePartsViewer
                spriteParts={sprite.parts}
                onSelectedIndexesChange={setSelectedPartIndexes}
              />
            </>
          )}
        </div>
      </div>
      <ScanSprites
        selectedRom={selectedRom}
        onSpriteAddressToShow={(spriteAddress) => {
          setSpritePointer('');
          setSnesAddress(toHexString(spriteAddress.snesAddress));
          loadSprite(spriteAddress);
        }}
      />
    </div>
  );
};
