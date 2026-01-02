import { useEffect, useRef, useState } from 'react';
import {
  buildAnimation,
  readAnimationInfo,
  readAnimationPointer,
} from '../../../../../../../rom-io/common/animations';
import {
  Animation,
  AnimationInfo,
  AnimationStep,
} from '../../../../../../../rom-io/common/animations/types';
import { readPalette } from '../../../../../../../rom-io/common/palettes';
import {
  AnimationScriptBank,
  AnimationScriptTable,
  Dkc1SpritePointerTable,
} from '../../../../../../../rom-io/dkc1/constants';
import { RomAddress } from '../../../../../../../rom-io/rom/address';
import { ImageMatrix } from '../../../../../../../rom-io/types/image-matrix';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
import { LoadHexadecimalInput } from '../../../../../../components/hexadecimal-input/with-load-button';
import { useAppSelector } from '../../../../../../state';
import { MainMenuItemComponent } from '../../../../../../types/layout';
import { drawImage, getDrawCenterOffset } from '../../../../../../utils/draw';
import { toHexString } from '../../../../../../utils/hex';
import { DEFAULT_ANIMATION_INDEX, DEFAULT_PALETTE } from '../defaults';
import { AddressesDiv } from '../styles';
import { AnimationEntries } from './entries';
import { AnimationIndexInput } from './index-input';

export const Dkc1Animation: MainMenuItemComponent = ({ children }) => {
  const rom = useAppSelector((s) => s.rom);
  const canvasController = useAppSelector((s) => s.canvasController);
  if (!rom) return null;

  const [snesAddress, setSnesAddress] = useState<number>();
  const [paletteAddress, setPaletteAddress] = useState<number>(DEFAULT_PALETTE);
  const [animationIndex, setAnimationIndex] = useState<number>(
    DEFAULT_ANIMATION_INDEX,
  );

  const [animationInfo, setAnimationInfo] = useState<AnimationInfo>();
  const [animation, setAnimation] = useState<Animation>();
  const [error, setError] = useState('');

  const animationInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const loadAnimationFromSnesAddressInput = () => {
    if (snesAddress) {
      loadAnimationAndPalette(
        RomAddress.fromSnesAddress(snesAddress),
        RomAddress.fromSnesAddress(paletteAddress),
      );
    } else {
      setAnimationInfo(undefined);
    }
  };

  const loadAnimationIndex = (index: number) => {
    const address = readAnimationPointer(
      rom.data,
      AnimationScriptBank,
      AnimationScriptTable,
      index,
    );
    loadAnimation(address);
    setSnesAddress(address.snesAddress);
  };

  const loadAnimation = (animationAddress: RomAddress) => {
    const palette = RomAddress.fromSnesAddress(paletteAddress);
    loadAnimationAndPalette(animationAddress, palette);
  };

  const loadAnimationAndPalette = (
    animationAddress: RomAddress,
    paletteAddress: RomAddress,
  ) => {
    try {
      const info = readAnimationInfo(rom.data, animationAddress);
      setAnimationInfo(info);

      const palette = readPalette(rom.data, paletteAddress);
      const newAnimation = buildAnimation(
        rom.data,
        Dkc1SpritePointerTable,
        info,
        palette.colors,
      );
      setAnimation(newAnimation);
      setError('');
    } catch (e) {
      setAnimation(undefined);
      setError("Can't build animation");
    }
  };

  const buildDrawFnAndStartAnimation = () => {
    if (!animation) return;

    const frames: ImageMatrix[] = animation.reduce(
      (acc: ImageMatrix[], step: AnimationStep) => {
        for (let i = 0; i < step.time; i++) {
          acc.push(step.image);
        }
        return acc;
      },
      [],
    );

    let currentFrame = 0;
    const drawAnimationFrame = (
      canvas: HTMLCanvasElement,
      context: CanvasRenderingContext2D,
    ) => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const spriteImage = frames[currentFrame];
      const centerOffset = getDrawCenterOffset(canvas, spriteImage.size);
      drawImage(context, spriteImage, centerOffset);
    };

    const drawNextFrame = () => {
      if (currentFrame >= frames.length - 1) currentFrame = 0;
      else currentFrame++;

      canvasController.draw();
    };

    // noinspection TypeScriptValidateTypes
    animationInterval.current = setInterval(drawNextFrame, 15);
    return drawAnimationFrame;
  };

  const stopAnimation = () => {
    if (animationInterval.current) {
      clearInterval(animationInterval.current);
      animationInterval.current = undefined;
    }
  };

  useEffect(() => {
    const drawFn = buildDrawFnAndStartAnimation();
    if (!drawFn) return;

    canvasController.registerDrawHandler(drawFn);
    canvasController.draw();

    return () => {
      stopAnimation();
      canvasController.unregisterDrawHandler(drawFn);
    };
  }, [animation]);

  useEffect(() => {
    loadAnimationIndex(animationIndex);
  }, []);

  return children({
    top: {
      left: (
        <CollapsiblePanel title="Addresses">
          <AddressesDiv>
            <LoadHexadecimalInput
              label="SNES Address"
              hexadecimalValue={snesAddress}
              onValueChange={setSnesAddress}
              onValueLoad={loadAnimationFromSnesAddressInput}
            />
            <AnimationIndexInput
              label={
                <>
                  Animation Index{' '}
                  <span className="tag is-light">
                    from{' '}
                    {toHexString(AnimationScriptBank | AnimationScriptTable, {
                      addPrefix: true,
                    })}
                  </span>
                </>
              }
              value={animationIndex}
              onValueChange={(value) => {
                if (value) setAnimationIndex(value);
              }}
              onValueLoad={(value) => loadAnimationIndex(value)}
            />
            <LoadHexadecimalInput
              label="Palette Address"
              hexadecimalValue={paletteAddress}
              onValueChange={(value) => {
                if (value) setPaletteAddress(value);
              }}
              onValueLoad={loadAnimationFromSnesAddressInput}
            />
          </AddressesDiv>
        </CollapsiblePanel>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
      right: animationInfo ? (
        <CollapsiblePanel title="Animation Entries">
          <AnimationEntries animationInfo={animationInfo} />
        </CollapsiblePanel>
      ) : null,
    },
  });
};
