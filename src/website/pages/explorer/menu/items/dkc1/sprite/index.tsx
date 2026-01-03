import { useEffect, useState } from 'react';
import { buildImageFromPixelsAndPalette } from '../../../../../../../rom-io/common/images';
import { readPalette } from '../../../../../../../rom-io/common/palettes';
import { scanSprites } from '../../../../../../../rom-io/common/scan/sprites';
import {
  getAddressFromSpritePointerIndex,
  readSprite,
  Sprite,
} from '../../../../../../../rom-io/common/sprites';
import { assembleSprite } from '../../../../../../../rom-io/common/sprites/sprite-part';
import { SpritePart } from '../../../../../../../rom-io/common/sprites/types';
import { validateSpriteHeader } from '../../../../../../../rom-io/common/sprites/validation';
import { Dkc1SpritePointerTable } from '../../../../../../../rom-io/dkc1/constants';
import { RomAddress } from '../../../../../../../rom-io/rom/address';
import { ImageMatrix } from '../../../../../../../rom-io/types/image-matrix';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
import { LoadHexadecimalInput } from '../../../../../../components/hexadecimal-input/with-load-button';
import { ScanControls } from '../../../../../../components/scan-controls';
import { stateSelector, useAppStore } from '../../../../../../state/selector';
import { MainMenuItemComponent } from '../../../../../../types/layout';
import {
  drawImage,
  drawRectangle,
  getDrawCenterOffset,
} from '../../../../../../utils/draw';
import { toHexString } from '../../../../../../utils/hex';
import { OverlaySlotsContainer } from '../../../../styles';
import { AddressesDiv } from '../styles';
import { SpriteHeaderInfo } from './header';
import { SpritePartInfo } from './part-info';
import { SpritePartSelector } from './part-selector';
import { SpritePointerInput } from './pointer-input';

export const Dkc1Sprite: MainMenuItemComponent = ({ children }) => {
  const appStore = useAppStore();

  const rom = stateSelector((s) => s.rom);
  const canvasController = stateSelector((s) => s.canvasController);
  if (!rom) return null;

  const snesAddress = stateSelector((s) => s.dkc1.spriteAddress);
  const setSnesAddress = (address: number | undefined) => {
    appStore.set((s) => {
      s.dkc1.spriteAddress = address;
    });
  };

  const paletteAddress = stateSelector((s) => s.dkc1.paletteAddress);
  const setPaletteAddress = (address: number) => {
    appStore.set((s) => {
      s.dkc1.paletteAddress = address;
    });
  };

  const spritePointer = stateSelector((s) => s.dkc1.spritePointer);
  const setSpritePointer = (pointer: number) => {
    appStore.set((s) => {
      s.dkc1.spritePointer = pointer;
    });
  };

  const [sprite, setSprite] = useState<Sprite>();
  const [spriteImage, setSpriteImage] = useState<ImageMatrix>();
  const [selectedSpriteParts, setSelectedSpriteParts] = useState<SpritePart[]>(
    [],
  );
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
      Dkc1SpritePointerTable,
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
    setSelectedSpriteParts([]);
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

      selectedSpriteParts.forEach((part) =>
        drawRectangle(
          context,
          {
            lineWidth: 0.5,
            strokeStyle: 'white',
            x: part.coordinate.x,
            y: part.coordinate.y,
            width: part.type === '8x8' ? 8 : 16,
            height: part.type === '8x8' ? 8 : 16,
          },
          centerOffset,
        ),
      );
    }
  };

  useEffect(() => {
    if (snesAddress) loadSprite(RomAddress.fromSnesAddress(snesAddress));
    else loadSpritePointer(spritePointer);
  }, []);

  useEffect(() => {
    canvasController.registerDrawHandler(drawSpriteImage);
    canvasController.draw();

    return () => {
      canvasController.unregisterDrawHandler(drawSpriteImage);
    };
  }, [spriteImage, selectedSpriteParts]);

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
                      {toHexString(Dkc1SpritePointerTable, { addPrefix: true })}
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
      right: sprite ? (
        <OverlaySlotsContainer className="is-align-items-end">
          <CollapsiblePanel title="Sprite Parts">
            <SpritePartSelector
              spriteParts={sprite.parts}
              onSelectedPartsChange={setSelectedSpriteParts}
            />
          </CollapsiblePanel>
          {selectedSpriteParts.length === 1 && (
            <CollapsiblePanel title="Selected Part">
              <SpritePartInfo spritePart={selectedSpriteParts[0]} />
            </CollapsiblePanel>
          )}
        </OverlaySlotsContainer>
      ) : null,
    },
    bottom: {
      middle: (
        <CollapsiblePanel title="Scan Sprites" startCollapsed>
          <ScanControls
            rom={rom}
            scanFn={scanSprites}
            onSelectedAddressChange={(spriteAddress) => {
              setSnesAddress(spriteAddress.snesAddress);
              loadSprite(spriteAddress);
            }}
          />
        </CollapsiblePanel>
      ),
    },
  });
};
