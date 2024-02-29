import { ImageCanvas } from '../../../components/image-canvas';
import { ChangeEvent, useState } from 'react';
import { isHexadecimal, toHexString } from '../../../utils/hex';
import { RomAddress } from '../../../rom-parser/types/address';
import {
  Entity,
  EntityCommand,
  EntityInstruction,
} from '../../../rom-parser/entities/types';
import {
  entityReferenceToSnesAddress,
  readEntity,
  readEntityPalette,
  readEntityRawAnimation,
  snesAddressToEntityReference,
} from '../../../rom-parser/entities';
import { SelectedRom } from '../../../types/selected-rom';
import { Animation } from '../../../rom-parser/animations/types';
import { buildAnimation } from '../../../rom-parser/animations';
import { grayscalePalette } from '../../../rom-parser/sprites/palette';
import { ScanEntities } from './scan-entity';

interface EntityViewerProps {
  selectedRom: SelectedRom;
}

const displayEntityInstruction = (instruction: EntityInstruction) => {
  const parameters = [];
  for (const parameter of instruction.parameters) {
    parameters.push(toHexString(parameter));
  }
  return `Command: ${toHexString(instruction.command)} Params: ${parameters.join(' ')}`;
};

export const EntityViewer = ({ selectedRom }: EntityViewerProps) => {
  const [entityAddress, setEntityAddress] = useState<string>('');
  const [entityReference, setEntityReference] = useState<string>('');

  const [entity, setEntity] = useState<Entity>();
  const [animation, setAnimation] = useState<Animation>();

  const [selectedInstructionIndex, setSelectedInstructionIndex] =
    useState<number>(0);
  const [error, setError] = useState('');

  const onEntityAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setEntityAddress(input);
    }
  };

  const onEntityReferenceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setEntityReference(input);
    }
  };

  const onEntityAddressLoadClick = () => {
    if (entityAddress) {
      const parsedSnesAddress = parseInt(entityAddress, 16);
      const romAddress = RomAddress.fromSnesAddress(parsedSnesAddress);
      onSnesAddressLoad(romAddress);
    } else {
      setEntityReference('');
      setEntity(undefined);
    }
  };

  const onAnimationIndexLoadClick = () => {
    if (entityReference) {
      const parsedEntityReference: number = parseInt(entityReference, 16);
      const romAddress = entityReferenceToSnesAddress(parsedEntityReference);

      loadEntity(romAddress);
      setEntityAddress(toHexString(romAddress.snesAddress));
    } else {
      setEntityAddress('');
      setEntity(undefined);
    }
    setSelectedInstructionIndex(0);
  };

  const onSnesAddressLoad = (romAddress: RomAddress) => {
    loadEntity(romAddress);
    setEntityReference(toHexString(snesAddressToEntityReference(romAddress)));
  };

  const loadEntity = (address: RomAddress) => {
    try {
      const newEntity = readEntity(selectedRom.data, address);
      setEntity(newEntity);
      setError('');

      const rawAnimation = readEntityRawAnimation(selectedRom.data, newEntity);
      const palette = readEntityPalette(selectedRom.data, newEntity);

      if (rawAnimation) {
        const newAnimation = buildAnimation(
          selectedRom.data,
          rawAnimation,
          palette || grayscalePalette(),
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
      return <span>Animation</span>;
    if (instruction.command === EntityCommand.PALETTE)
      return <span>Palette</span>;
    if (instruction.command === EntityCommand.INHERIT)
      return (
        <button
          className="button is-info"
          onClick={() => {
            const romAddress = entityReferenceToSnesAddress(
              instruction.parameters[0],
            );
            setEntityAddress(toHexString(romAddress.snesAddress));
            onSnesAddressLoad(romAddress);
          }}
        >
          Load Entity{' '}
          {toHexString(instruction.parameters[0], { addPrefix: true })}
        </button>
      );
    return null;
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
                  value={entityAddress}
                  onChange={onEntityAddressChange}
                />
              </p>
              <p className="control">
                <a
                  className="button is-primary"
                  onClick={onEntityAddressLoadClick}
                >
                  Load
                </a>
              </p>
            </div>
          </div>
          <div className="block">
            <label className="label">Entity Reference (from 0xB50000)</label>
            <div className="field has-addons">
              <p className="control">
                <a className="button is-static">0x</a>
              </p>
              <p className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Hexadecimal"
                  value={entityReference}
                  onChange={onEntityReferenceChange}
                />
              </p>
              <p className="control">
                <a
                  className="button is-primary"
                  onClick={onAnimationIndexLoadClick}
                >
                  Load
                </a>
              </p>
            </div>
          </div>

          {error && <div className="notification is-danger">{error}</div>}
        </div>
        <div className="column">
          <ImageCanvas
            animation={animation}
            defaultSize={{ width: 256, height: 256 }}
          />
        </div>
        <div className="column">
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
            {renderInstruction(entity?.instructions[selectedInstructionIndex])}
          </div>
        </div>
      </div>
      <ScanEntities
        selectedRom={selectedRom}
        onEntityAddressToShow={(entityAddress) => {
          setEntityAddress(toHexString(entityAddress.snesAddress));
          onSnesAddressLoad(entityAddress);
        }}
      />
    </div>
  );
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
