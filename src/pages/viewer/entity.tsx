import { ImageCanvas } from '../../components/image-canvas';
import { useEffect, useState } from 'react';
import { bufferToString, toHexString } from '../../utils/hex';
import { RomAddress } from '../../rom-parser/types/address';
import {
  Entity,
  EntityCommand,
  EntityInstruction,
} from '../../rom-parser/entities/types';
import {
  entityReferenceToSnesAddress,
  readEntity,
  readEntityPalette,
  readEntityRawAnimation,
  snesAddressToEntityReference,
} from '../../rom-parser/entities';
import { Animation } from '../../rom-parser/animations/types';
import {
  buildAnimation,
  readAnimationPointer,
} from '../../rom-parser/animations';
import { ViewerMode, ViewerModeBaseProps } from './types';
import {
  grayscalePalette,
  paletteReferenceToSnesAddress,
} from '../../rom-parser/palette';
import { getViewerModeAddress, saveViewerModeAddress } from './memory';
import { ScanAddresses } from '../../components/scan-adresses';
import { scanEntityAddresses } from '../../rom-parser/scan/entities';
import { LoadHexadecimalInput } from '../../components/load-hexadecimal-input';
import { EntityBank } from '../../rom-parser/constants/dkc1';

const displayEntityInstruction = (instruction: EntityInstruction) => {
  const parameters = [];
  for (const parameter of instruction.parameters) {
    parameters.push(toHexString(parameter));
  }
  return `Command: ${toHexString(instruction.command)} Params: ${parameters.join(' ')}`;
};

export const EntityViewer = ({
  selectedRom,
  navigateToMode,
}: ViewerModeBaseProps) => {
  const [entityAddress, setEntityAddress] = useState<number>();
  const [entityReference, setEntityReference] = useState<number>();

  const [entity, setEntity] = useState<Entity>();
  const [animation, setAnimation] = useState<Animation>();

  const [selectedInstructionIndex, setSelectedInstructionIndex] =
    useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const initRomAddress = getViewerModeAddress(ViewerMode.Entity);
    if (initRomAddress) {
      setEntityAddress(initRomAddress.snesAddress);
      onSnesAddressLoad(initRomAddress);
    }
  }, []);

  const onEntityAddressLoadClick = () => {
    if (entityAddress) {
      const romAddress = RomAddress.fromSnesAddress(entityAddress);
      onSnesAddressLoad(romAddress);
    } else {
      setEntityReference(undefined);
      setEntity(undefined);
    }
  };

  const onAnimationIndexLoadClick = () => {
    if (entityReference) {
      const romAddress = entityReferenceToSnesAddress(entityReference);
      loadEntity(romAddress);
      setEntityAddress(romAddress.snesAddress);
    } else {
      setEntityAddress(undefined);
      setEntity(undefined);
    }
    setSelectedInstructionIndex(0);
  };

  const onSnesAddressLoad = (romAddress: RomAddress) => {
    loadEntity(romAddress);
    setEntityReference(snesAddressToEntityReference(romAddress));
  };

  const loadEntity = (address: RomAddress) => {
    try {
      const newEntity = readEntity(selectedRom.data, address);
      setEntity(newEntity);
      saveViewerModeAddress(ViewerMode.Entity, address);
      setError('');

      const rawAnimation = readEntityRawAnimation(selectedRom.data, newEntity);
      const palette = readEntityPalette(selectedRom.data, newEntity);

      if (rawAnimation) {
        const newAnimation = buildAnimation(
          selectedRom.data,
          rawAnimation,
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

  const renderInstruction = (instruction?: EntityInstruction) => {
    if (!instruction) return null;
    if (instruction.command === EntityCommand.ANIMATION)
      return (
        <button
          className="button is-info"
          onClick={() => {
            const animationIndex = instruction.parameters[0];
            const animationAddress = readAnimationPointer(
              selectedRom.data,
              animationIndex,
            );
            saveViewerModeAddress(ViewerMode.Animation, animationAddress);
            navigateToMode(ViewerMode.Animation);
          }}
        >
          Go to animation
        </button>
      );
    if (instruction.command === EntityCommand.PALETTE)
      return (
        <button
          className="button is-info"
          onClick={() => {
            const palettePointer = instruction.parameters[0];
            const paletteAddress =
              paletteReferenceToSnesAddress(palettePointer);
            saveViewerModeAddress(ViewerMode.Palette, paletteAddress);
            navigateToMode(ViewerMode.Palette);
          }}
        >
          Go to palette
        </button>
      );
    if (instruction.command === EntityCommand.INHERIT)
      return (
        <button
          className="button is-info"
          onClick={() => {
            const romAddress = entityReferenceToSnesAddress(
              instruction.parameters[0],
            );
            setEntityAddress(romAddress.snesAddress);
            onSnesAddressLoad(romAddress);
          }}
        >
          Load Entity{' '}
          {toHexString(instruction.parameters[0], { addPrefix: true })}
        </button>
      );
    return null;
  };

  const getInstructionClassName = (instruction: EntityInstruction) => {
    if (instruction.command === EntityCommand.PALETTE)
      return 'has-background-primary';
    if (instruction.command === EntityCommand.ANIMATION)
      return 'has-background-success';
    if (instruction.command === EntityCommand.INHERIT)
      return 'has-background-warning';
    return '';
  };

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="columns is-flex-wrap-wrap">
        <div className="column is-flex is-flex-direction-column is-align-items-start">
          <LoadHexadecimalInput
            label="SNES Address"
            hexadecimalValue={entityAddress}
            onValueChange={setEntityAddress}
            onValueLoad={onEntityAddressLoadClick}
          />
          <LoadHexadecimalInput
            label={`Entity Reference (from ${toHexString(EntityBank, { addPrefix: true })})`}
            hexadecimalValue={entityReference}
            onValueChange={setEntityReference}
            onValueLoad={onAnimationIndexLoadClick}
          />
          {error && <div className="notification is-danger">{error}</div>}
        </div>
        <div className="column">
          <ImageCanvas
            animation={animation}
            defaultSize={{ width: 256, height: 256 }}
          />
        </div>
        <div className="column">
          {entity && (
            <>
              <label className="label">Entity Instructions</label>
              <div className="block select is-multiple">
                <select
                  multiple
                  size={10}
                  onChange={(e) =>
                    setSelectedInstructionIndex(parseInt(e.target.value))
                  }
                >
                  {entity?.instructions.map((instruction, index) => (
                    <option
                      className={getInstructionClassName(instruction)}
                      key={`entityInstruction${index}`}
                      value={index}
                    >
                      {displayEntityInstruction(instruction)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="block">
                {renderInstruction(
                  entity?.instructions[selectedInstructionIndex],
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="columns">
        <div className="column">
          <ScanAddresses
            scan={scanEntityAddresses}
            selectedRom={selectedRom}
            onSelectedAddressChange={(entityAddress) => {
              setEntityAddress(entityAddress.snesAddress);
              onSnesAddressLoad(entityAddress);
            }}
            title="Entities"
          />
        </div>
        <div className="column">
          {entity && (
            <>
              <label className="label">Raw Data</label>
              <pre>{bufferToString(entity.bytes)}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
