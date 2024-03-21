import { useEffect, useState } from 'react';
import { RomAddress } from '../../../rom-parser/types/address';
import { SpriteHeaderTable } from './sprite-header';
import {
  scanSprites,
  validateSpriteHeader,
} from '../../../rom-parser/scan/sprites';
import {
  getAddressFromSpritePointerIndex,
  readSprite,
  Sprite,
} from '../../../rom-parser/sprites';
import { ImageCanvas, Rectangle } from '../../../components/image-canvas';
import { assembleSprite } from '../../../rom-parser/sprites/sprite-part';
import { SpritePartsViewer } from './sprite-parts';
import { ViewerMode, ViewerModeBaseProps } from '../types';
import {
  buildImageFromPixelsAndPalette,
  readPalette,
} from '../../../rom-parser/palette';
import { getViewerModeAddress, saveViewerModeAddress } from '../memory';
import { DEFAULT_PALETTE } from '../../../utils/defaults';
import { HexadecimalInput } from '../../../components/hexadecimal-input';
import { ScanAddresses } from '../../../components/scan-adresses';
import { LoadHexadecimalInput } from '../../../components/load-hexadecimal-input';
import { toHexString } from '../../../utils/hex';
import { SpritePointerTable } from '../../../rom-parser/constants/dkc1';
import { ImageMatrix } from '../../../types/image-matrix';

export const SpriteViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [snesAddress, setSnesAddress] = useState<number>();
  const [paletteAddress, setPaletteAddress] = useState<number>();
  const [spritePointer, setSpritePointer] = useState<number>();

  const [sprite, setSprite] = useState<Sprite>();
  const [spriteImage, setSpriteImage] = useState<ImageMatrix>();

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
      setPaletteAddress(savedPaletteAddress.snesAddress);
    }

    const savedSpriteAddress = getViewerModeAddress(ViewerMode.Sprite);
    if (savedSpriteAddress) {
      setSnesAddress(savedSpriteAddress.snesAddress);
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

  const onSnesAddressLoadClick = () => {
    if (snesAddress) {
      loadSpriteAndPalette(
        RomAddress.fromSnesAddress(snesAddress),
        RomAddress.fromSnesAddress(paletteAddress || DEFAULT_PALETTE),
      );
      setSpritePointer(undefined);
    } else {
      setSprite(undefined);
    }
  };

  const onSpritePointerLoadClick = () => {
    if (spritePointer) {
      loadSpritePointer(spritePointer);
    } else {
      setSnesAddress(undefined);
      setSprite(undefined);
    }
  };

  const offsetSpritePointer = (offset: number) => {
    let previousSpritePointer: number = spritePointer ?? 0;
    previousSpritePointer += offset;
    setSpritePointer(previousSpritePointer);
    loadSpritePointer(previousSpritePointer);
  };

  const loadSpritePointer = (spritePointer: number) => {
    const spriteAddress = getAddressFromSpritePointerIndex(
      selectedRom.data,
      spritePointer,
    );
    setSnesAddress(spriteAddress.snesAddress);
    loadSprite(spriteAddress);
  };

  const loadSprite = (spriteAddress: RomAddress) => {
    const palette = RomAddress.fromSnesAddress(
      paletteAddress || DEFAULT_PALETTE,
    );
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
    const palette = readPalette(selectedRom.data, paletteAddress);
    const spritePixels = assembleSprite(spriteToBuild.parts);
    const image: ImageMatrix = buildImageFromPixelsAndPalette(
      spritePixels,
      palette.colors,
    );
    setSpriteImage(image);
  };

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="columns is-flex-wrap-wrap">
        <div className="column is-flex is-flex-direction-column is-align-items-start">
          <LoadHexadecimalInput
            label="SNES Address"
            hexadecimalValue={snesAddress}
            onValueChange={setSnesAddress}
            onValueLoad={onSnesAddressLoadClick}
          />
          <div className="block">
            <label className="label">{`Sprite Pointer (from ${toHexString(SpritePointerTable, { addPrefix: true })})`}</label>
            <div className="field has-addons">
              <p className="control">
                <a className="button is-static">0x</a>
              </p>
              <p className="control">
                <HexadecimalInput
                  className="input"
                  placeholder="Hexadecimal"
                  value={spritePointer}
                  onChange={setSpritePointer}
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
          <LoadHexadecimalInput
            label="Palette Address"
            hexadecimalValue={paletteAddress}
            onValueChange={setPaletteAddress}
            onValueLoad={onSnesAddressLoadClick}
          />

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
      <ScanAddresses
        scan={scanSprites}
        selectedRom={selectedRom}
        onSelectedAddressChange={(spriteAddress) => {
          setSpritePointer(undefined);
          setSnesAddress(spriteAddress.snesAddress);
          loadSprite(spriteAddress);
        }}
        title="Sprites"
      />
    </div>
  );
};
