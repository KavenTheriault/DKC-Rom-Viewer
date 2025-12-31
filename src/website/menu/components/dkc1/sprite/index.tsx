import { useEffect, useState } from 'react';
import { buildImageFromPixelsAndPalette } from '../../../../../rom-io/common/images';
import { readPalette } from '../../../../../rom-io/common/palettes';
import { readSprite, Sprite } from '../../../../../rom-io/common/sprites';
import { assembleSprite } from '../../../../../rom-io/common/sprites/sprite-part';
import { validateSpriteHeader } from '../../../../../rom-io/common/sprites/validation';
import { SpritePointerTable } from '../../../../../rom-io/dkc1/constants';
import { getAddressFromSpritePointerIndex } from '../../../../../rom-io/dkc1/utils';
import { RomAddress } from '../../../../../rom-io/rom/address';
import { ImageMatrix } from '../../../../../rom-io/types/image-matrix';
import { CollapsiblePanel } from '../../../../components/collapsible-panel';
import { LoadHexadecimalInput } from '../../../../components/hexadecimal-input/with-load-button';
import { useAppSelector } from '../../../../state';
import { MainMenuItemComponent } from '../../../../types/layout';
import { drawImage, getDrawCenterOffset } from '../../../../utils/draw';
import { toHexString } from '../../../../utils/hex';
import { DEFAULT_PALETTE, DEFAULT_SPRITE_POINTER } from '../defaults';
import { SpriteHeaderInfo } from './header';
import { SpritePointerInput } from './pointer-input';
import { AddressesDiv } from './styles';

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
    loadSpritePointer(spritePointer);
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
        <>
          <CollapsiblePanel title="Addresses">
            <AddressesDiv>
              <LoadHexadecimalInput
                label="SNES Address"
                hexadecimalValue={snesAddress}
                onValueChange={setSnesAddress}
                onValueLoad={loadSpriteFromSnesAddressInput}
              />
              <SpritePointerInput
                label={
                  <>
                    Sprite Pointer{' '}
                    <span className="tag is-light">
                      from{' '}
                      {toHexString(SpritePointerTable, { addPrefix: true })}
                    </span>
                  </>
                }
                hexadecimalValue={spritePointer}
                onValueChange={(value) => {
                  if (value) setSpritePointer(value);
                }}
                onValueLoad={(value) => loadSpritePointer(value)}
              />
              <LoadHexadecimalInput
                label="Palette Address"
                hexadecimalValue={paletteAddress}
                onValueChange={(value) => {
                  if (value) setPaletteAddress(value);
                }}
                onValueLoad={loadSpriteFromSnesAddressInput}
              />
            </AddressesDiv>
          </CollapsiblePanel>
          {sprite && (
            <CollapsiblePanel title="Sprite Header">
              <SpriteHeaderInfo spriteHeader={sprite.header} />
            </CollapsiblePanel>
          )}
        </>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
    },
  });
};
