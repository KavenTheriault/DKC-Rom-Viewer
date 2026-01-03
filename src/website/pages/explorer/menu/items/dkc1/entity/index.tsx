import { useEffect, useState } from 'react';
import { buildAnimation } from '../../../../../../../rom-io/common/animations';
import { Animation } from '../../../../../../../rom-io/common/animations/types';
import {
  entityReferenceToSnesAddress,
  readEntity,
  readEntityAnimationInfo,
  readEntityPalette,
  snesAddressToEntityReference,
} from '../../../../../../../rom-io/common/entities';
import { scanEntityAddresses } from '../../../../../../../rom-io/common/entities/scan';
import { Entity } from '../../../../../../../rom-io/common/entities/types';
import { grayscalePalette } from '../../../../../../../rom-io/common/palettes';
import {
  Dkc1AnimationScriptBank,
  Dkc1AnimationScriptTable,
  Dkc1EntitiesEndReference,
  Dkc1EntitiesStartReference,
  Dkc1EntityBank,
  Dkc1EntityPaletteBank,
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
import { EntityInstructions } from './instructions';

export const Dkc1Entity: MainMenuItemComponent = ({ children }) => {
  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);
  if (!rom) return null;

  const snesAddress = stateSelector((s) => s.dkc1.entityAddress);
  const setSnesAddress = (address: number | undefined) => {
    appStore.set((s) => {
      s.dkc1.entityAddress = address;
    });
  };

  const entityReference = stateSelector((s) => s.dkc1.entityReference);
  const setEntityReference = (address: number | undefined) => {
    appStore.set((s) => {
      s.dkc1.entityReference = address;
    });
  };

  const [entity, setEntity] = useState<Entity>();
  const [animation, setAnimation] = useState<Animation>();
  const [error, setError] = useState('');

  const loadEntityFromSnesAddressInput = () => {
    if (snesAddress) {
      const romAddress = RomAddress.fromSnesAddress(snesAddress);
      onSnesAddressLoad(romAddress);
    } else {
      setEntityReference(undefined);
      setEntity(undefined);
    }
  };

  const loadEntityFromReferenceInput = () => {
    if (entityReference) {
      onEntityReferenceLoad(entityReference);
    } else {
      setSnesAddress(undefined);
      setEntity(undefined);
    }
  };

  const onEntityReferenceLoad = (reference: number) => {
    const romAddress = entityReferenceToSnesAddress(Dkc1EntityBank, reference);
    loadEntity(romAddress);
    setSnesAddress(romAddress.snesAddress);
  };

  const onSnesAddressLoad = (romAddress: RomAddress) => {
    loadEntity(romAddress);
    setEntityReference(snesAddressToEntityReference(romAddress));
  };

  const loadEntity = (address: RomAddress) => {
    try {
      const newEntity = readEntity(rom.data, Dkc1EntityBank, address);
      setEntity(newEntity);
      setError('');

      const animationInfo = readEntityAnimationInfo(
        rom.data,
        Dkc1AnimationScriptBank,
        Dkc1AnimationScriptTable,
        newEntity,
      );
      const palette = readEntityPalette(
        rom.data,
        Dkc1EntityPaletteBank,
        newEntity,
      );

      if (animationInfo) {
        const newAnimation = buildAnimation(
          rom.data,
          Dkc1SpritePointerTable,
          animationInfo,
          palette?.colors || grayscalePalette(),
        );
        setAnimation(newAnimation);
      } else {
        setAnimation(undefined);
      }
    } catch (e) {
      setError("Can't read Entity");
      setEntity(undefined);
      setAnimation(undefined);
    }
  };

  useEffect(() => {
    if (snesAddress) onSnesAddressLoad(RomAddress.fromSnesAddress(snesAddress));
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
              onValueLoad={loadEntityFromSnesAddressInput}
            />
            <LoadHexadecimalInput
              label={
                <>
                  Entity Reference{' '}
                  <span className="tag is-light">
                    from {toHexString(Dkc1EntityBank, { addPrefix: true })}
                  </span>
                </>
              }
              hexadecimalValue={entityReference}
              onValueChange={setEntityReference}
              onValueLoad={loadEntityFromReferenceInput}
            />
          </AddressesDiv>
        </CollapsiblePanel>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
      right: entity ? (
        <CollapsiblePanel title="Entity Instructions">
          <EntityInstructions
            entity={entity}
            loadEntityReference={(reference) => {
              setEntityReference(reference);
              onEntityReferenceLoad(reference);
            }}
          />
        </CollapsiblePanel>
      ) : null,
    },
    bottom: {
      middle: (
        <CollapsiblePanel title="Scan Entities">
          <ScanControls
            rom={rom}
            scanFn={(romData: Buffer) => {
              return scanEntityAddresses(
                romData,
                Dkc1EntityBank,
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
