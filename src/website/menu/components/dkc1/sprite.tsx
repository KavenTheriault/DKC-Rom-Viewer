import { useEffect, useState } from 'react';
import { buildImageFromPixelsAndPalette } from '../../../../rom-io/common/images';
import { readPalette } from '../../../../rom-io/common/palettes';
import { readSprite, Sprite } from '../../../../rom-io/common/sprites';
import { assembleSprite } from '../../../../rom-io/common/sprites/sprite-part';
import { validateSpriteHeader } from '../../../../rom-io/common/sprites/validation';
import { SpritePointerTable } from '../../../../rom-io/dkc1/constants';
import { getAddressFromSpritePointerIndex } from '../../../../rom-io/dkc1/utils';
import { RomAddress } from '../../../../rom-io/rom/address';
import { ImageMatrix } from '../../../../rom-io/types/image-matrix';
import { CollapsibleBox } from '../../../components/collapsible-box';
import { HexadecimalInput } from '../../../components/hexadecimal-input';
import { LoadHexadecimalInput } from '../../../components/hexadecimal-input/with-load-button';
import { useAppSelector } from '../../../state';
import { MainMenuItemComponent } from '../../../types/layout';
import { drawImage, getDrawCenterOffset } from '../../../utils/draw';
import { toHexString } from '../../../utils/hex';
import { DEFAULT_PALETTE, DEFAULT_SPRITE_POINTER } from './defaults';

export const Dkc1Sprite: MainMenuItemComponent = ({ children }) => {
  const rom = useAppSelector((s) => s.rom);
  const canvasController = useAppSelector((s) => s.canvasController);
  if (!rom) return null;

  const [snesAddress, setSnesAddress] = useState<number>();
  const [paletteAddress, setPaletteAddress] = useState<number>(DEFAULT_PALETTE);
  const [spritePointer, setSpritePointer] = useState<number>(
    DEFAULT_SPRITE_POINTER,
  );

  const [sprite, setSprite] = useState<Sprite>();
  const [spriteImage, setSpriteImage] = useState<ImageMatrix>();
  const [error, setError] = useState('');

  const loadSpriteFromSnesAddressInput = () => {
    if (snesAddress) {
      loadSpriteAndPalette(
        RomAddress.fromSnesAddress(snesAddress),
        RomAddress.fromSnesAddress(paletteAddress),
      );
    }
  };

  const loadSpriteFromSpritePointerInput = () => {
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
      rom.data,
      spritePointer,
    );
    setSnesAddress(spriteAddress.snesAddress);
    loadSprite(spriteAddress);
  };

  const loadSprite = (spriteAddress: RomAddress) => {
    const palette = RomAddress.fromSnesAddress(paletteAddress);
    loadSpriteAndPalette(spriteAddress, palette);
  };

  const loadSpriteAndPalette = (
    spriteAddress: RomAddress,
    paletteAddress: RomAddress,
  ) => {
    const loadedSprite = readSprite(rom.data, spriteAddress);
    if (loadedSprite && validateSpriteHeader(loadedSprite.header)) {
      setError('');
      setSprite(loadedSprite);
      buildSpriteImage(loadedSprite, paletteAddress);
    } else {
      setError('Invalid Sprite Header');
      setSprite(undefined);
      setSpriteImage(undefined);
    }
    //setShowSelectedPartsBorder(false);
    //setSelectedPartIndexes([0]);
  };

  const buildSpriteImage = (
    spriteToBuild: Sprite,
    paletteAddress: RomAddress,
  ) => {
    const palette = readPalette(rom.data, paletteAddress);
    const spritePixels = assembleSprite(spriteToBuild.parts);
    const image: ImageMatrix = buildImageFromPixelsAndPalette(
      spritePixels,
      palette.colors,
    );
    setSpriteImage(image);
  };

  const drawSpriteImage = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    if (spriteImage) {
      const centerOffset = getDrawCenterOffset(canvas, spriteImage.size);
      drawImage(context, spriteImage, centerOffset);
    }
  };

  useEffect(() => {
    loadSpriteFromSpritePointerInput();
  }, []);

  useEffect(() => {
    canvasController.registerDrawHandler(drawSpriteImage);
    canvasController.draw();

    return () => {
      canvasController.unregisterDrawHandler(drawSpriteImage);
    };
  }, [spriteImage]);

  return children({
    top: {
      left: (
        <CollapsibleBox>
          <div className="column is-flex is-flex-direction-column is-align-items-start">
            <LoadHexadecimalInput
              label="SNES Address"
              hexadecimalValue={snesAddress}
              onValueChange={setSnesAddress}
              onValueLoad={loadSpriteFromSnesAddressInput}
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
                    onChange={(value) => {
                      if (value) setSpritePointer(value);
                    }}
                  />
                </p>
                <p className="control">
                  <a
                    className="button is-primary"
                    onClick={loadSpriteFromSpritePointerInput}
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
              onValueChange={(value) => {
                if (value) setPaletteAddress(value);
              }}
              onValueLoad={loadSpriteFromSnesAddressInput}
            />
          </div>
        </CollapsibleBox>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
    },
  });
};
