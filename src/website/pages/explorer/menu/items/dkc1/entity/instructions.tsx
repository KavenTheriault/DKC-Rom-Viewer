import { useState } from 'react';
import {
  Entity,
  EntityCommand,
  EntityInstruction,
} from '../../../../../../../rom-io/common/entities/types';
import { paletteReferenceToSnesAddress } from '../../../../../../../rom-io/common/palettes';
import { Dkc1EntityPaletteBank } from '../../../../../../../rom-io/dkc1/constants';
import { stateSelector, useAppStore } from '../../../../../../state/selector';
import { toHexString } from '../../../../../../utils/hex';
import { animationMenuItem, paletteMenuItem } from '../../../index';

interface EntityInstructionsProps {
  entity: Entity;
  loadEntityReference: (entityReference: number) => void;
}

export const EntityInstructions = ({
  entity,
  loadEntityReference,
}: EntityInstructionsProps) => {
  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);
  if (!rom) return null;

  const [selectedInstructionIndex, setSelectedInstructionIndex] =
    useState<number>(0);

  const renderInstructionGoToButton = (instruction: EntityInstruction) => {
    if (instruction.command === EntityCommand.ANIMATION) {
      const animationIndex = instruction.parameters[0];
      return (
        <button
          className="mt-2 button is-primary is-small"
          onClick={() => {
            appStore.set((s) => {
              s.dkc1.animationIndex = animationIndex;
              s.dkc1.animationAddress = undefined;
              s.mainMenu.selectedItem = animationMenuItem;
            });
          }}
        >
          Go to Animation{' '}
          {`${toHexString(animationIndex, { addPrefix: true })}`}
        </button>
      );
    }
    if (instruction.command === EntityCommand.PALETTE) {
      const paletteReference = instruction.parameters[0];
      return (
        <button
          className="mt-2 button is-primary is-small"
          onClick={() => {
            appStore.set((s) => {
              s.dkc1.paletteAddress = paletteReferenceToSnesAddress(
                Dkc1EntityPaletteBank,
                paletteReference,
              ).snesAddress;
              s.mainMenu.selectedItem = paletteMenuItem;
            });
          }}
        >
          Go to Palette{' '}
          {`${toHexString(paletteReference, { addPrefix: true })}`}
        </button>
      );
    }
    if (instruction.command === EntityCommand.INHERIT) {
      const entityReference = instruction.parameters[0];
      return (
        <button
          className="mt-2 button is-primary is-small"
          onClick={() => {
            loadEntityReference(entityReference);
          }}
        >
          Load Entity {toHexString(entityReference, { addPrefix: true })}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="is-flex is-flex-direction-column is-align-items-center">
      <div className="select is-multiple">
        <select
          multiple
          size={10}
          onChange={(e) =>
            setSelectedInstructionIndex(parseInt(e.target.value))
          }
        >
          {entity.instructions.map((instruction, index) => (
            <option
              className={`is-size-7 ${getInstructionClassName(instruction)}`}
              key={`entityInstruction${index}`}
              value={index}
            >
              {displayEntityInstruction(instruction)}
            </option>
          ))}
        </select>
      </div>
      {entity.instructions[selectedInstructionIndex] &&
        renderInstructionGoToButton(
          entity.instructions[selectedInstructionIndex],
        )}
    </div>
  );
};

const displayEntityInstruction = (instruction: EntityInstruction) => {
  const parameters = [];
  for (const parameter of instruction.parameters) {
    parameters.push(toHexString(parameter, { addPrefix: true }));
  }
  return `Command: ${toHexString(instruction.command, { addPrefix: true })} Params: ${parameters.join(' ')}`;
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
