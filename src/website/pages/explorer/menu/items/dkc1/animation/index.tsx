import { useEffect, useState } from 'react';
import {
  buildAnimation,
  readAnimationInfo,
  readAnimationPointer,
} from '../../../../../../../rom-io/common/animations';
import {
  Animation,
  AnimationInfo,
} from '../../../../../../../rom-io/common/animations/types';
import { readPalette } from '../../../../../../../rom-io/common/palettes';
import { scanAnimations } from '../../../../../../../rom-io/common/scan/animations';
import {
  Dkc1AnimationScriptBank,
  Dkc1AnimationScriptTable,
  Dkc1EntitiesEndReference,
  Dkc1EntitiesStartReference,
  Dkc1EntityBank,
  Dkc1SpritePointerTable,
} from '../../../../../../../rom-io/dkc1/constants';
import { RomAddress } from '../../../../../../../rom-io/rom/address';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
import { LoadHexadecimalInput } from '../../../../../../components/hexadecimal-input/with-load-button';
import { ScanControls } from '../../../../../../components/scan-controls';
import { stateSelector, useAppStore } from '../../../../../../state/selector';
import { MainMenuItemComponent } from '../../../../../../types/layout';
import { toHexString } from '../../../../../../utils/hex';
import { useDrawAnimation } from '../../../common/draw-animation';
import { AddressesDiv } from '../styles';
import { AnimationEntries } from './entries';
import { AnimationIndexInput } from './index-input';

export const Dkc1Animation: MainMenuItemComponent = ({ children }) => {
  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);
  if (!rom) return null;

  const snesAddress = stateSelector((s) => s.dkc1.animationAddress);
  const setSnesAddress = (address: number | undefined) => {
    appStore.set((s) => {
      s.dkc1.animationAddress = address;
    });
  };

  const paletteAddress = stateSelector((s) => s.dkc1.paletteAddress);
  const setPaletteAddress = (address: number) => {
    appStore.set((s) => {
      s.dkc1.paletteAddress = address;
    });
  };

  const animationIndex = stateSelector((s) => s.dkc1.animationIndex);
  const setAnimationIndex = (index: number) => {
    appStore.set((s) => {
      s.dkc1.animationIndex = index;
    });
  };

  const [animationInfo, setAnimationInfo] = useState<AnimationInfo>();
  const [animation, setAnimation] = useState<Animation>();
  const [error, setError] = useState('');

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
      Dkc1AnimationScriptBank,
      Dkc1AnimationScriptTable,
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

  useEffect(() => {
    if (snesAddress) loadAnimation(RomAddress.fromSnesAddress(snesAddress));
    else loadAnimationIndex(animationIndex);
  }, []);

  useDrawAnimation(animation);

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
                    {toHexString(
                      Dkc1AnimationScriptBank | Dkc1AnimationScriptTable,
                      { addPrefix: true },
                    )}
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
    bottom: {
      middle: (
        <CollapsiblePanel title="Scan Animations">
          <ScanControls
            rom={rom}
            scanFn={(romData: Buffer) => {
              return scanAnimations(
                romData,
                Dkc1EntityBank,
                Dkc1EntitiesStartReference,
                Dkc1EntitiesEndReference,
                Dkc1AnimationScriptBank,
                Dkc1AnimationScriptTable,
              );
            }}
            onSelectedAddressChange={(address) => {
              setSnesAddress(address.snesAddress);
              loadAnimation(address);
            }}
          />
        </CollapsiblePanel>
      ),
    },
  });
};
