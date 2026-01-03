import { useEffect, useState } from 'react';
import {
  paletteReferenceToSnesAddress,
  readPalette,
  snesAddressToPaletteReference,
} from '../../../../../../../rom-io/common/palettes';
import { Palette } from '../../../../../../../rom-io/common/palettes/types';
import { scanPalettes } from '../../../../../../../rom-io/common/scan/palettes';
import {
  Dkc1EntitiesEndReference,
  Dkc1EntitiesStartReference,
  Dkc1EntityBank,
  Dkc1EntityPaletteBank,
} from '../../../../../../../rom-io/dkc1/constants';
import { RomAddress } from '../../../../../../../rom-io/rom/address';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
import { LoadHexadecimalInput } from '../../../../../../components/hexadecimal-input/with-load-button';
import { ScanControls } from '../../../../../../components/scan-controls';
import { stateSelector, useAppStore } from '../../../../../../state/selector';
import { MainMenuItemComponent } from '../../../../../../types/layout';
import { toHexString } from '../../../../../../utils/hex';
import { AddressesDiv } from '../styles';
import { PaletteColorsTable } from './colors-table';

export const Dkc1Palette: MainMenuItemComponent = ({ children }) => {
  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);
  if (!rom) return null;

  const snesAddress = stateSelector((s) => s.dkc1.paletteAddress);
  const setSnesAddress = (address: number) => {
    appStore.set((s) => {
      s.dkc1.paletteAddress = address;
    });
  };

  const paletteReference = stateSelector((s) => s.dkc1.paletteReference);
  const setPaletteReference = (reference: number | undefined) => {
    appStore.set((s) => {
      s.dkc1.paletteReference = reference;
    });
  };

  const [palette, setPalette] = useState<Palette>();

  const loadPaletteFromSnesAddressInput = () => {
    if (snesAddress) {
      const romAddress = RomAddress.fromSnesAddress(snesAddress);
      onSnesAddressLoad(romAddress);
    } else {
      setPalette(undefined);
    }
  };

  const loadPaletteFromReferenceInput = () => {
    if (paletteReference) {
      loadPaletteReference(paletteReference);
    } else {
      setPalette(undefined);
    }
  };

  const onSnesAddressLoad = (romAddress: RomAddress) => {
    loadPalette(romAddress);
    setPaletteReference(snesAddressToPaletteReference(romAddress));
  };

  const loadPaletteReference = (reference: number) => {
    const romAddress = paletteReferenceToSnesAddress(
      Dkc1EntityPaletteBank,
      reference,
    );
    loadPalette(romAddress);
    setSnesAddress(romAddress.snesAddress);
  };

  const loadPalette = (romAddress: RomAddress) => {
    const palette = readPalette(rom.data, romAddress);
    setPalette(palette);
  };

  useEffect(() => {
    onSnesAddressLoad(RomAddress.fromSnesAddress(snesAddress));
  }, []);

  return children({
    top: {
      left: (
        <CollapsiblePanel title="Addresses">
          <AddressesDiv>
            <LoadHexadecimalInput
              label="SNES Address"
              hexadecimalValue={snesAddress}
              onValueChange={(value) => {
                if (value) setSnesAddress(value);
              }}
              onValueLoad={loadPaletteFromSnesAddressInput}
            />
            <LoadHexadecimalInput
              label={
                <>
                  Palette Reference{' '}
                  <span className="tag is-light">
                    from{' '}
                    {toHexString(Dkc1EntityPaletteBank, { addPrefix: true })}
                  </span>
                </>
              }
              hexadecimalValue={paletteReference}
              onValueChange={setPaletteReference}
              onValueLoad={loadPaletteFromReferenceInput}
            />
          </AddressesDiv>
        </CollapsiblePanel>
      ),
      right: palette ? (
        <CollapsiblePanel title="Colors">
          <PaletteColorsTable palette={palette} />
        </CollapsiblePanel>
      ) : null,
    },
    bottom: {
      middle: (
        <CollapsiblePanel title="Scan Palettes">
          <ScanControls
            rom={rom}
            scanFn={(romData: Buffer) => {
              return scanPalettes(
                romData,
                Dkc1EntityBank,
                Dkc1EntityPaletteBank,
                Dkc1EntitiesStartReference,
                Dkc1EntitiesEndReference,
              );
            }}
            onSelectedAddressChange={(address) => {
              setSnesAddress(address.snesAddress);
              onSnesAddressLoad(address);
            }}
          />
        </CollapsiblePanel>
      ),
    },
  });
};
